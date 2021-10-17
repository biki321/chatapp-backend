import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Gender } from './gender.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.MALE,
  })
  gender: Gender;

  @Column({ default: 0 })
  tokenVersion: number;
}
