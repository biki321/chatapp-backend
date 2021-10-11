import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(username: string, password: string): Promise<User> {
    return this.usersRepository.save({
      username: username,
      password: password,
    });
  }

  findOneByUserName(username: string) {
    return this.usersRepository.findOne({ where: { username: username } });
  }

  findOneById(id: string, relations?: string[]): Promise<User> {
    if (!relations) return this.usersRepository.findOne(id);
    else return this.usersRepository.findOne(id, { relations: relations });
  }

  findMany(ids: string[], relations?: string[]): Promise<User[]> {
    if (!relations) return this.usersRepository.findByIds(ids);
    else return this.usersRepository.findByIds(ids, { relations: relations });
  }

  findManyNotIds(ids: string[]) {
    return this.usersRepository.find({ where: { id: Not(ids) } });
  }

  async remove(id: string): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    if (user) return user;
    return this.usersRepository.remove(user);
  }

  async save(user: User) {
    return this.usersRepository.save(user);
  }

  async updateUserData(userId: number, bio: string) {
    const user = await this.usersRepository.findOne(userId);
    user.bio = bio;
    return this.usersRepository.save(user);
  }
}
