import { IsString, IsNumber, IsOptional } from 'class-validator';

export class SubmitScoreDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsNumber()
  score: number;

  @IsNumber()
  timeTaken: number;

  @IsOptional()
  @IsString()
  clientName?: string;
}