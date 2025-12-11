import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Assuming phone is unique so returning users can log back in
  @Column({ unique: true })
  phone: string;
}