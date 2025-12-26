import { Controller, Get, Post, Body, Param, Put, Patch, UseInterceptors, UploadedFile, ParseFilePipeBuilder, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Helper for file storage setup
const uploadOptions = {
  storage: diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, cb) => {
      const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getMe(@Request() req) {
    return this.profileService.findOne(req.user.userId);
  }

  @Patch()
  updateMe(@Request() req, @Body() data: any) {
    return this.profileService.update(req.user.userId, data);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadAvatar(
    @Request() req,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 }) // 5MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    return this.profileService.uploadAvatar(req.user.userId, file);
  }
}
