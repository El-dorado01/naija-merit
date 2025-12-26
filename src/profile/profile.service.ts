import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        // Include commonly accessed data, or leave it basic for now
        // For general profile, maybe we don't fetch academic records by default?
        // Let's keep it simple.
      }
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const profile = await this.findOne(userId);
    
    // Delete old avatar if it exists and is a local file
    if (profile.avatar && profile.avatar.startsWith('uploads')) {
      const fs = require('fs'); 
      try {
        if (fs.existsSync(profile.avatar)) {
           fs.unlinkSync(profile.avatar);
        }
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }
    
    // Save new path
    return this.prisma.profile.update({
      where: { id: userId },
      data: { avatar: file.path.replace(/\\/g, '/') },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    // Prevent updating sensitive fields manually if needed, e.g. isVerified
    // For now, we trust the controller/DTO validation or add a check
    // delete data.isVerified; // Example safety
    return this.prisma.profile.update({
      where: { id },
      data,
    });
  }
}
