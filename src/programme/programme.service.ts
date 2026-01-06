import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import csv from 'csv-parser';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');
import * as mammoth from 'mammoth';
import { Readable } from 'stream';

@Injectable()
export class ProgrammeService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, faculty?: string) {
    // Check if exists
    const existing = await this.prisma.programme.findUnique({
      where: { name },
    });
    if (existing) {
      throw new BadRequestException(`Programme '${name}' already exists.`);
    }

    return this.prisma.programme.create({
      data: { name, faculty },
    });
  }

  async findAll() {
    return this.prisma.programme.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async bulkCreate(file: Express.Multer.File) {
    let programmes: string[] = [];

    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      programmes = await this.parseCsv(file.buffer);
    } else if (file.mimetype === 'application/pdf') {
      programmes = await this.parsePdf(file.buffer);
    } else if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      programmes = await this.parseDocx(file.buffer);
    } else {
      throw new BadRequestException(
        'Unsupported file type. Use CSV, PDF, or DOCX.',
      );
    }

    // Clean and unique
    const uniqueNames = [
      ...new Set(programmes.map((p) => p.trim()).filter((p) => p.length > 0)),
    ];

    let createdCount = 0;
    const errors: string[] = [];

    for (const name of uniqueNames) {
      try {
        await this.prisma.programme.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        createdCount++;
      } catch (error) {
        errors.push(`Failed to create '${name}'`);
      }
    }

    return {
      message: `Processed ${uniqueNames.length} programmes. Created/Found ${createdCount}.`,
      errors,
    };
  }

  async assignToInstitution(programmeIds: string[], institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) throw new BadRequestException('Institution not found');

    // We need to link these programmes to the institution
    // Creating implicit many-to-many link
    // Prisma implicit m-n: update institution connect programmes

    return this.prisma.institution.update({
      where: { id: institutionId },
      data: {
        programmes: {
          connect: programmeIds.map((id) => ({ id })),
        },
      },
      include: {
        programmes: true,
      },
    });
  }

  async getInstitutionProgrammes(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      include: { programmes: true },
    });
    if (!institution) throw new BadRequestException('Institution not found');
    return institution.programmes;
  }

  async removeFromInstitution(programmeId: string, institutionId: string) {
    return this.prisma.institution.update({
      where: { id: institutionId },
      data: {
        programmes: {
          disconnect: { id: programmeId },
        },
      },
    });
  }

  async getProgrammeInstitutions(programmeId: string) {
    const programme = await this.prisma.programme.findUnique({
      where: { id: programmeId },
      include: { institutions: true },
    });
    if (!programme) throw new BadRequestException('Programme not found');
    return programme.institutions;
  }

  async assignProgrammeToInstitutions(
    programmeId: string,
    institutionIds: string[],
  ) {
    // We update the Programme to connect to these institutions
    // Or update each Institution. Updating Programme is cleaner for this direction.
    return this.prisma.programme.update({
      where: { id: programmeId },
      data: {
        institutions: {
          connect: institutionIds.map((id) => ({ id })),
        },
      },
      include: { institutions: true },
    });
  }

  private async parseCsv(buffer: Buffer): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const results: string[] = [];
      const stream = Readable.from(buffer);
      stream
        .pipe(csv(['name'])) // Assume first column or header 'name'
        .on('data', (data) => {
          // If header exists, data is object, else array or indexed object
          // Just take the first value found
          const val = Object.values(data)[0] as string;
          if (val) results.push(val);
        })
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }

  private async parsePdf(buffer: Buffer): Promise<string[]> {
    const data = await pdf(buffer);
    // Split by newlines, assume one programme per line
    return data.text.split('\n');
  }

  private async parseDocx(buffer: Buffer): Promise<string[]> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.split('\n');
  }
}
