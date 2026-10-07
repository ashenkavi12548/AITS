import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetEmployeePasswordDto {
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword!: string;
}
