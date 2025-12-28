import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('companies')
export class CompanyController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  registerCompany(@Request() req, @Body() dto: { name: string; industry?: string; website?: string; description?: string }) {
    return this.recruitmentService.registerCompany(req.user.userId, dto);
  }
}

@Controller('recruitment')
@UseGuards(JwtAuthGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Post('shortlist')
  createShortlist(@Request() req, @Body() dto: { studentIds: string[]; notes?: string }) {
    return this.recruitmentService.createShortlist(req.user.userId, dto.studentIds, dto.notes);
  }

  @Get('my-shortlists')
  getMyShortlists(@Request() req) {
    return this.recruitmentService.getMyShortlists(req.user.userId);
  }
}

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentSearchController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('search')
  advancedSearch(
    @Request() req,
    @Query('gpa') gpa?: string,
    @Query('skills') skills?: string,
    @Query('region') region?: string,
    @Query('level') level?: string,
    @Query('minScore') minScore?: string
  ) {
    const filters = {
      gpa: gpa ? parseFloat(gpa) : undefined,
      skills,
      region,
      level,
      minScore: minScore ? parseFloat(minScore) : undefined
    };
    
    return this.recruitmentService.advancedSearch(req.user.userId, filters);
  }
}
