import { User } from 'src/users/user.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Thread {
  @Column('uuid', { primary: true })
  userId: string;

  @Column('uuid', { primary: true })
  otherUserId: string;

  @Column('uuid')
  messageId: string;

  @Column('uuid')
  senderId: string;

  @Column('varchar', { length: 10, default: '' })
  text: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column()
  read: boolean;

  //   @ManyToOne(() => User, {
  //     // onDelete: 'CASCADE',
  //     // onUpdate: 'CASCADE',
  //     primary: true,
  //   })
  //   @JoinColumn({ name: 'userId' })
  //   user: User;

  @ManyToOne(() => User, {
    // onDelete: 'CASCADE',
    // onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: 'otherUserId' })
  otherUser: User;

  // @ManyToOne(() => User, {
  //   // onDelete: 'CASCADE',
  //   // onUpdate: 'CASCADE',
  // })
  // @JoinColumn({ name: 'senderId' })
  // sender: User;
}
