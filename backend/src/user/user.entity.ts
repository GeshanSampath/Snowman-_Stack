// src/user/user.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true }) 
  phone: string;

  @Column({ default: 'Christmas Game' }) 
  client: string;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  timeTaken: number;

  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}