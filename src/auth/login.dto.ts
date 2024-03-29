import { Length } from 'class-validator';
export class LoginDto {
  @Length(4, 30)
  username: string;

  @Length(5, 16)
  password: string;
}
