import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { LoginDto } from './dto/login.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { SubmitScoreDto } from './dto/submit-score.dto'; 

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}


  async login(dto: LoginDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ 
      where: { phone: dto.phone } 
    });

    if (existingUser) {
   
      existingUser.name = dto.name;
      existingUser.score = 0;       
      existingUser.timeTaken = 0;   
      existingUser.client = 'Dummy Client'; 
      
      return this.usersRepository.save(existingUser);
    }

    const newUser = this.usersRepository.create({
      name: dto.name,
      phone: dto.phone,
      client: 'Dummy Client', 
      score: 0,
      timeTaken: 0,
    });

    return this.usersRepository.save(newUser);
  }


  async updateScore(id: number, dto: UpdateScoreDto): Promise<void> {
    await this.usersRepository.update(id, {
      score: dto.score,
      timeTaken: dto.timeTaken,
    });
  }



  async submitGame(dto: SubmitScoreDto): Promise<User> {
  
    const existingUser = await this.usersRepository.findOne({ 
        where: { phone: dto.phone } 
    });

    if (existingUser) {
        existingUser.score = dto.score;
        existingUser.timeTaken = dto.timeTaken;
        existingUser.client = 'Dummy Client';
        return this.usersRepository.save(existingUser);
    }

    const newUser = this.usersRepository.create({
      name: dto.name,
      phone: dto.phone,
      client: 'Dummy Client', 
      score: dto.score,
      timeTaken: dto.timeTaken,
    });
    
    return this.usersRepository.save(newUser);
  }
}