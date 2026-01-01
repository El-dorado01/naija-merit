import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Correct path based on AppModule

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(data: { nin: string; fullName: string; email: string }) {
    // Check if NIN exists in NIN table (Mock validation)
    const ninRecord = await this.prisma.nin.findUnique({ where: { nin: data.nin } });
    if (!ninRecord) {
      throw new NotFoundException('NIN not found in national database');
    }
    
    // Create Profile
    return this.prisma.profile.create({
      data: {
        id: crypto.randomUUID(), // Assuming we generate UUIDs here or let DB do it. Schema says @id @db.Uuid.
        // Wait, schema says id is String @id @db.Uuid. We need to provide it or let DB default if it was @default(uuid()).
        // The schema: `id String @id @db.Uuid`. It does NOT have @default(uuid()).
        // So we must provide it.
        nin: data.nin,
        fullName: data.fullName,
        email: data.email,
        role: 'student',
      },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        academicRecords: { include: { institution: true } },
        extracurriculars: true,
      }
    });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const student = await this.findOne(userId);
    
    let avatarPath: string;
    
    // Handle different storage types
    if (file.path) {
      // Disk storage (local development)
      avatarPath = file.path.replace(/\\/g, '/');
      
      // Delete old avatar if it exists and is a local file
      if (student.avatar && student.avatar.startsWith('uploads')) {
        const fs = require('fs');
        try {
          if (fs.existsSync(student.avatar)) {
            fs.unlinkSync(student.avatar);
          }
        } catch (err) {
          console.error('Error deleting old avatar:', err);
        }
      }
    } else if (file.buffer) {
      // Memory storage (serverless/Vercel)
      // In production, you should upload to cloud storage (S3, Cloudinary, etc.)
      // For now, we'll store a data URL as a temporary solution
      // TODO: Implement cloud storage upload (S3, Cloudinary, etc.)
      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      avatarPath = `data:${mimeType};base64,${base64}`;
      
      console.warn('Using base64 storage for avatar. Consider implementing cloud storage for production.');
    } else {
      throw new Error('File has neither path nor buffer');
    }
    
    // Save avatar path/URL
    return this.prisma.profile.update({
      where: { id: userId },
      data: { avatar: avatarPath },
    });
  }
}
