import { IsNumber } from 'class-validator';

export class UpdateScoreDto {
  @IsNumber()
  score: number;

  @IsNumber()
  timeTaken: number;
}