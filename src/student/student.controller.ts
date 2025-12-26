import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';
import { StudentService } from './student.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

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

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadAvatar(
    @Body('userId') userId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 }) // 5MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    return this.studentService.uploadAvatar(userId, file);
  }

  @Post()
  create(@Body() createStudentDto: { nin: string; fullName: string; email: string }) {
    return this.studentService.create(createStudentDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }
}
