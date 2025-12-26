import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  async calculateStudentScore(profileId: string) {
    const records = await this.prisma.academicRecord.findMany({ where: { profileId } });
    const activities = await this.prisma.extracurricularActivity.findMany({ where: { profileId } });

    // 1. Calculate Average Academic Score (using score field)
    let totalScore = 0;
    let count = 0;
    for (const rec of records) {
      if (rec.score) {
        totalScore += rec.score;
        count++;
      }
    }
    const averageScore = count > 0 ? totalScore / count : 0;

    // 2. Calculate Activity Points (arbitrary 5 points per activity)
    const activityPoints = activities.length * 5;

    // 3. Simple Weighted Total (70% academics, 30% extracurriculars - normalized)
    // Assuming max academic average is 100, and max reasonable activity points ~50
    // This is a naive algorithm for demonstration.
    const weightedScore = (averageScore * 0.7) + (activityPoints * 0.3); // Scale needs adjustment

    return {
      averageScore,
      activityPoints,
      weightedScore,
    };
  }

  async getLeaderboard() {
    // Fetch all profiles
    const profiles = await this.prisma.profile.findMany();
    
    // Calculate scores for all (Inefficient for large datasets, but okay for MVP)
    const leaderboard = await Promise.all(
      profiles.map(async (p) => {
        const stats = await this.calculateStudentScore(p.id);
        return {
          ...p,
          stats,
        };
      })
    );

    // Sort by weightedScore descending
    return leaderboard.sort((a, b) => b.stats.weightedScore - a.stats.weightedScore);
  }
}
