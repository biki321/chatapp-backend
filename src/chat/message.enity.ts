import { User } from 'src/users/user.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

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

  @Column('varchar', { length: 500, default: '' })
  text: string;

  // default: 'NOW()'
  // send timestamp from client in utc iso format and set database timezone to utc.
  // this way things worked
  @Column({ type: 'timestamp with time zone' })
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
