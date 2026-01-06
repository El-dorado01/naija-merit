import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ProgrammeService } from './programme.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('programmes')
export class ProgrammeController {
  constructor(private readonly programmeService: ProgrammeService) {}

  @Post()
  create(@Body() body: { name: string; faculty?: string }) {
    return this.programmeService.create(body.name, body.faculty);
  }

  @Get()
  findAll() {
    return this.programmeService.findAll();
  }

  @Post('bulk')
  @UseInterceptors(FileInterceptor('file'))
  bulkCreate(@UploadedFile() file: Express.Multer.File) {
    return this.programmeService.bulkCreate(file);
  }

  @Post('assign')
  assignToInstitution(
    @Body() body: { programmeIds: string[]; institutionId: string },
  ) {
    return this.programmeService.assignToInstitution(
      body.programmeIds,
      body.institutionId,
    );
  }

  @Get('institution/:id')
  getInstitutionProgrammes(@Param('id') id: string) {
    return this.programmeService.getInstitutionProgrammes(id);
  }

  @Delete('institution/:institutionId/programme/:programmeId')
  removeFromInstitution(
    @Param('institutionId') institutionId: string,
    @Param('programmeId') programmeId: string,
  ) {
    return this.programmeService.removeFromInstitution(
      programmeId,
      institutionId,
    );
  }

  @Get(':id/institutions')
  getProgrammeInstitutions(@Param('id') id: string) {
    return this.programmeService.getProgrammeInstitutions(id);
  }

  @Post(':id/assign-institutions')
  assignProgrammeToInstitutions(
    @Param('id') id: string,
    @Body() body: { institutionIds: string[] },
  ) {
    return this.programmeService.assignProgrammeToInstitutions(
      id,
      body.institutionIds,
    );
  }
}
