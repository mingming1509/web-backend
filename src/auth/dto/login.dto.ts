import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { NormalizeEmail } from '../../common/decorators/normalize.decorator';
import { IsStudentEmail } from '../../common/validators/is-student-email.validator';

export class LoginDto {
  @ApiProperty({ example: 'nam.tran@usth.edu.vn' })
  @NormalizeEmail()
  @IsStudentEmail()
  email: string;

  @ApiProperty({ example: 'password123', format: 'password' })
  @IsString()
  @MinLength(1)
  password: string;
}
