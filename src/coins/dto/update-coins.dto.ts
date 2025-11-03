import { IsInt, Min } from 'class-validator';

export class UpdateCoinsDto {
  @IsInt()
  @Min(0)
  coins: number;
}
