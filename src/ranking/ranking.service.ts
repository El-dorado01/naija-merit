import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ScoreBreakdown {
  academicScore: number;
  extracurricularScore: number;
  competitionScore: number;
  totalScore: number;
  breakdown: {
    schoolGrades: number;
    cgpa: number;
    examBodies: number;
    extracurriculars: number;
    competitions: number;
  };
}

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate school grades score (Max: 5 points)
   * Based on class percentile ranking
   */
  private calculateSchoolGradesScore(percentile: number): number {
    if (percentile <= 5) return 5;
    if (percentile <= 10) return 4;
    if (percentile <= 25) return 3;
    if (percentile <= 50) return 2;
    return 1;
  }

  /**
   * Calculate CGPA score (Max: 40 points)
   * Base: (Student CGPA / Max CGPA) × 40
   * Multiplier based on percentile: Top 5% = ×1.5, Top 10% = ×1.3, Top 25% = ×1.2
   */
  private calculateCGPAScore(
    cgpa: number,
    maxCGPA: number,
    percentile: number,
  ): number {
    const baseScore = (cgpa / maxCGPA) * 40;

    let multiplier = 1.0;
    if (percentile <= 5) multiplier = 1.5;
    else if (percentile <= 10) multiplier = 1.3;
    else if (percentile <= 25) multiplier = 1.2;

    return Math.min(baseScore * multiplier, 60); // Cap at 60 with multiplier
  }

  /**
   * Calculate JAMB score (Max: 40 points)
   * Formula: (Score / 400) × 40
   */
  private calculateJAMBScore(score: number): number {
    return (score / 400) * 40;
  }

  /**
   * Calculate WAEC/NECO score (Max: 20 points)
   * Based on grade points: A1=7, B2=6, B3=5, C4=4, C5=3, C6=2, D7=1, E8=0
   */
  private calculateWAECScore(grades: string[]): number {
    const gradePoints: Record<string, number> = {
      A1: 7,
      B2: 6,
      B3: 5,
      C4: 4,
      C5: 3,
      C6: 2,
      D7: 1,
      E8: 0,
    };

    const numSubjects = grades.length;
    if (numSubjects < 7 || numSubjects > 9) return 0;

    const sumPoints = grades.reduce(
      (sum, grade) => sum + (gradePoints[grade] || 0),
      0,
    );
    const maxPoints = numSubjects * 7; // Max is all A1s

    const scoreRatio = sumPoints / maxPoints;
    return scoreRatio * 20;
  }

  /**
   * Calculate extracurricular score
   * - Institution-uploaded: 1=primary, 2=secondary, 3=tertiary
   * - Student-uploaded (admin verified): 2 points
   */
  private calculateExtracurricularScore(activities: any[]): number {
    return activities.reduce((total, activity) => {
      // If student-uploaded and admin-verified, give 2 points
      if (activity.isStudentUploaded) {
        return total + 2;
      }
      // Institution-uploaded: points based on level
      const institutionLevel = activity.institutionLevel || 2; // Default to secondary
      return total + institutionLevel;
    }, 0);
  }

  /**
   * Calculate competition score (Max varies by tier)
   * Tier 1 (Elite): 1st=10, 2nd=9, 3rd=8 points
   * Tier 2 (High): 1st=7, 2nd=6, 3rd=5 points
   * Tier 3 (Strong): 2-4 points
   * Tier 4 (Basic): 1 point
   */
  private calculateCompetitionScore(participations: any[]): number {
    return participations.reduce((total, p) => {
      const position = p.position?.toLowerCase() || '';
      const hasAward = !!p.award;

      // Tier 1: Elite (National/International top placements)
      if (position.includes('national') || position.includes('international')) {
        if (
          position.includes('1st') ||
          position.includes('winner') ||
          position.includes('champion')
        ) {
          return total + 10;
        }
        if (position.includes('2nd') || position.includes('runner-up')) {
          return total + 9;
        }
        if (position.includes('3rd')) {
          return total + 8;
        }
        // Tier 1 participants
        if (position.includes('participant')) {
          return total + 5;
        }
      }

      // Tier 2: High (State/Regional wins or national distinction)
      if (position.includes('state') || position.includes('regional')) {
        if (position.includes('1st')) return total + 7;
        if (position.includes('2nd')) return total + 6;
        if (position.includes('3rd')) return total + 5;
        // Tier 2 participants
        if (position.includes('participant')) return total + 3;
      }
      if (position.includes('finalist')) {
        return total + 6;
      }

      // Tier 3: Strong (Participation with certificate/award)
      if (hasAward) {
        // Award holders get points based on implied position
        if (position.includes('1st')) return total + 4;
        if (position.includes('2nd')) return total + 3;
        if (position.includes('3rd')) return total + 2;
        return total + 2; // Default for award holders
      }
      if (position.includes('participant')) {
        return total + 1;
      }

      // Tier 4: Basic
      return total + 1;
    }, 0);
  }

  /**
   * Calculate total score for a student
   */
  async calculateStudentScore(studentId: string): Promise<ScoreBreakdown> {
    // Fetch all student data
    const [academicRecords, extracurriculars, eventParticipations] =
      await Promise.all([
        this.prisma.academicRecord.findMany({
          where: { profileId: studentId, isVerified: true },
          include: { institution: true },
        }),
        this.prisma.extracurricularActivity.findMany({
          where: { profileId: studentId, isVerified: true },
        }),
        this.prisma.eventParticipation.findMany({
          where: { profileId: studentId },
          include: { event: true },
        }),
      ]);

    let schoolGradesScore = 0;
    let cgpaScore = 0;
    let examScore = 0;

    // Group exam records by type and session to get best sitting
    const jambRecords = academicRecords.filter((r) =>
      r.institution.type?.toLowerCase().includes('jamb'),
    );
    const waecRecords = academicRecords.filter(
      (r) =>
        r.institution.type?.toLowerCase().includes('waec') ||
        r.institution.type?.toLowerCase().includes('neco'),
    );
    const cgpaRecords = academicRecords.filter(
      (r) =>
        r.institution.type?.toLowerCase().includes('university') ||
        r.institution.type?.toLowerCase().includes('tertiary'),
    );
    const schoolRecords = academicRecords.filter(
      (r) =>
        !jambRecords.includes(r) &&
        !waecRecords.includes(r) &&
        !cgpaRecords.includes(r),
    );

    // Calculate best JAMB score
    if (jambRecords.length > 0) {
      const bestJamb = Math.max(...jambRecords.map((r) => r.score || 0));
      examScore = Math.max(examScore, this.calculateJAMBScore(bestJamb));
    }

    // Calculate best WAEC/NECO sitting (grouped by session)
    if (waecRecords.length > 0) {
      const sittingsBySession = waecRecords.reduce(
        (acc, record) => {
          const session = record.session || 'unknown';
          if (!acc[session]) acc[session] = [];
          acc[session].push(record.grade || 'E8');
          return acc;
        },
        {} as Record<string, string[]>,
      );

      // Calculate score for each sitting and take the best
      const sittingScores = Object.values(sittingsBySession).map(
        (grades: string[]) => this.calculateWAECScore(grades),
      );
      examScore = Math.max(examScore, ...(sittingScores as number[]));
    }

    // Calculate CGPA score with institution's scale and real percentile
    if (cgpaRecords.length > 0) {
      for (const record of cgpaRecords) {
        const cgpa = record.score || 0;
        const maxCGPA = record.institution.cgpaScale || 5.0; // Use institution's scale

        // Calculate real percentile from class data
        let percentile = 50; // Default
        if (record.classRank && record.classSize) {
          percentile = (record.classRank / record.classSize) * 100;
        }

        cgpaScore = Math.max(
          cgpaScore,
          this.calculateCGPAScore(cgpa, maxCGPA, percentile),
        );
      }
    }

    // Calculate school grades with real percentile
    if (schoolRecords.length > 0) {
      for (const record of schoolRecords) {
        let percentile = 50; // Default
        if (record.classRank && record.classSize) {
          percentile = (record.classRank / record.classSize) * 100;
        }
        schoolGradesScore = Math.max(
          schoolGradesScore,
          this.calculateSchoolGradesScore(percentile),
        );
      }
    }

    // Calculate extracurricular score
    const extracurricularScore = this.calculateExtracurricularScore(
      extracurriculars.map((e) => ({
        institutionLevel: 2,
        isStudentUploaded: true, // All verified extracurriculars are student-uploaded (2 points each)
      })),
    );

    // Calculate competition score (only recognized events)
    const recognizedParticipations = eventParticipations.filter(
      (p) => p.event.isRecognized,
    );
    const competitionScore = this.calculateCompetitionScore(
      recognizedParticipations,
    );

    const totalScore =
      schoolGradesScore +
      cgpaScore +
      examScore +
      extracurricularScore +
      competitionScore;

    return {
      academicScore: schoolGradesScore + cgpaScore + examScore,
      extracurricularScore,
      competitionScore,
      totalScore,
      breakdown: {
        schoolGrades: schoolGradesScore,
        cgpa: cgpaScore,
        examBodies: examScore,
        extracurriculars: extracurricularScore,
        competitions: competitionScore,
      },
    };
  }

  /**
   * Get national leaderboard
   */
  async getNationalRankings(limit: number = 100, level?: string) {
    // Get all students
    const students = await this.prisma.profile.findMany({
      where: { role: 'student' },
      select: { id: true, fullName: true, avatar: true },
    });

    // Calculate scores for all students
    const scoredStudents = await Promise.all(
      students.map(async (student) => {
        const score = await this.calculateStudentScore(student.id);
        return {
          studentId: student.id,
          fullName: student.fullName,
          avatar: student.avatar,
          ...score,
        };
      }),
    );

    // Sort by total score (ties broken by CGPA in breakdown)
    const ranked = scoredStudents
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        // Tie-breaker: CGPA
        return b.breakdown.cgpa - a.breakdown.cgpa;
      })
      .slice(0, limit);

    // Add rank positions
    return ranked.map((student, index) => ({
      rank: index + 1,
      ...student,
    }));
  }

  /**
   * Get student's personal ranking position
   */
  async getMyPosition(studentId: string) {
    const allRankings = await this.getNationalRankings(10000); // Get all
    const myRank = allRankings.find((r) => r.studentId === studentId);

    if (!myRank) {
      return {
        rank: null,
        message: 'Not ranked yet (no verified records)',
        totalStudents: allRankings.length,
      };
    }

    return {
      ...myRank,
      totalStudents: allRankings.length,
      percentile:
        ((allRankings.length - myRank.rank + 1) / allRankings.length) * 100,
    };
  }
}
