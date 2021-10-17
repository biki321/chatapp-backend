import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Gender } from './gender.enum';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  excludeColumns = (columnsToExclude: string[]): string[] =>
    this.usersRepository.metadata.columns
      .map((column) => column.databaseName)
      .filter((columnName) => !columnsToExclude.includes(columnName));

  getUsersKeyWithOutPass = (): (keyof User)[] => [
    'id',
    'username',
    'gender',
    'tokenVersion',
  ];

  findAllIds() {
    return this.usersRepository.find({ select: ['id'] });
  }

  create(username: string, password: string, gender: string): Promise<User> {
    return this.usersRepository.save({
      username: username,
      password: password,
      gender: gender === 'male' ? Gender.MALE : Gender.FEMALE,
    });
  }

  findOneByUserName(username: string) {
    return this.usersRepository.findOne({
      where: { username: username },
    });
  }

  findOneById(id: string, relations?: string[]): Promise<User> {
    if (!relations) return this.usersRepository.findOne(id);
    else
      return this.usersRepository.findOne(id, {
        relations: relations,
      });
  }

  findMany(ids?: string[], relations?: string[]): Promise<User[]> {
    if (!ids) return this.usersRepository.find();
    if (!relations) return this.usersRepository.findByIds(ids);
    else
      return this.usersRepository.findByIds(ids, {
        relations: relations,
      });
  }

  findManyNotIds(ids: string[]) {
    console.log('ids', ids);
    return this.usersRepository.find({
      select: this.getUsersKeyWithOutPass(),
      where: { id: Not(In(ids)) },
    });
  }

  async remove(id: string): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    if (user) return user;
    return this.usersRepository.remove(user);
  }

  async save(user: User) {
    return this.usersRepository.save(user);
  }

  // async updateUserData(userId: number, bio: string) {
  //   const user = await this.usersRepository.findOne(userId);
  //   user.bio = bio;
  //   return this.usersRepository.save(user);
  // }
}
