import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { IsStudentEmail } from '../validators/is-student-email.validator';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsStudentEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
