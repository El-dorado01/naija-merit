import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rankings')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('national')
  async getNationalRankings(
    @Query('limit') limit?: string,
    @Query('level') level?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    return this.rankingService.getNationalRankings(parsedLimit, level);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-position')
  async getMyPosition(@Request() req) {
    return this.rankingService.getMyPosition(req.user.userId);
  }
}
