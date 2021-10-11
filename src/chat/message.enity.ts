import { User } from 'src/users/user.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Message {
  @Column('uuid', { primary: true })
  userId: string;

  @Column('uuid', { primary: true })
  otherUserId: string;

  @Column('uuid', { primary: true })
  id: string;

  @Column('uuid')
  senderId: string;

  @Column('varchar', { length: 500 })
  text: string;

  @CreateDateColumn({ type: 'timestamp without time zone', default: 'NOW()' })
  timestamp: Date;

  @Column({ default: false })
  read: boolean;

  @ManyToOne(() => User, {
    // onDelete: 'CASCADE',
    // onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, {
    // onDelete: 'CASCADE',
    // onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: 'otherUserId' })
  otherUser: User;

  @ManyToOne(() => User, {
    // onDelete: 'CASCADE',
    // onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: 'senderId' })
  sender: User;
}
