import { IsEmail, IsOptional, IsUrl, Length } from 'class-validator';
export class CreateUserDto {
  @Length(5, 30)
  username: string;

  @Length(0, 300)
  @IsOptional()
  bio: string | null;

  @IsOptional()
  @IsEmail()
  email: string | undefined | null;

  @IsOptional()
  @IsUrl()
  avatar: string | null;
}
