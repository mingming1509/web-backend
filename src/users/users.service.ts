import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserData } from './dto/create-user.dto';
import { User } from './entities/user.entity';

/**
 * Owns persistence for users. Auth concerns (hashing, tokens, cookies) stay out
 * of here so this module has one reason to change: how users are stored.
 */
@Injectable()
export class UsersService {
  /** Columns needed when a password check is about to happen. */
  private static readonly WITH_PASSWORD_SELECT: (keyof User)[] = [
    'id',
    'email',
    'passwordHash',
    'fullName',
    'role',
    'createdAt',
    'updatedAt',
  ];

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(data: CreateUserData): Promise<User> {
    return this.usersRepository.save(this.usersRepository.create(data));
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /** Includes the password hash, which the entity excludes by default. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: UsersService.WITH_PASSWORD_SELECT,
    });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.usersRepository.exists({ where: { email } });
  }
}
