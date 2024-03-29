import { Length, IsIn } from 'class-validator';
export class SignUpDto {
  @Length(4, 30)
  username: string;

  @Length(5, 16)
  password: string;

  @IsIn(['male', 'female'])
  gender: string;
}
