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
    
    let avatarPath: string;
    
    // Handle different storage types
    if (file.path) {
      // Disk storage (local development)
      avatarPath = file.path.replace(/\\/g, '/');
      
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
