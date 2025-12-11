// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async login(createUserDto: CreateUserDto): Promise<User> {
    const { phone, name } = createUserDto;

    // 1. Check if user exists by phone number
    const existingUser = await this.usersRepository.findOneBy({ phone });

    if (existingUser) {
      // Optional: Update name if they changed it, or just return existing
      return existingUser;
    }

    // 2. If not, create a new user
    const newUser = this.usersRepository.create({ name, phone });
    return this.usersRepository.save(newUser);
  }
}