import { IsUUID, Length } from 'class-validator';

export class MessageDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  otherUserId: string;

  @IsUUID()
  id: string;

  @IsUUID()
  senderId: string;

  @Length(0, 500)
  text: string;

  read?: boolean;

  // @IsDateString()
  timestamp: string;
}
