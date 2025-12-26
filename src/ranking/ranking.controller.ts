import { Controller, Get, Param } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('leaderboard')
  getLeaderboard() {
    return this.rankingService.getLeaderboard();
  }

  @Get('student/:id')
  getStudentRank(@Param('id') id: string) {
    return this.rankingService.calculateStudentScore(id);
  }
}
