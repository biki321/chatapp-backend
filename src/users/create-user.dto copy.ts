import { IsEmail, IsOptional, IsUrl, Length } from 'class-validator';
export class CreateUserDto {
  handle: string;

  @IsOptional()
  name: string;

  githubId: number;

  @Length(0, 300)
  @IsOptional()
  bio: string | null;

  @IsUrl()
  githubUrl: string;

  @IsOptional()
  @IsEmail()
  email: string | undefined | null;

  @IsOptional()
  @IsUrl()
  avatar: string | undefined | null;
}
