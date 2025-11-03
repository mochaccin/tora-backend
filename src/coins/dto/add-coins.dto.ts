import { IsInt, Min } from 'class-validator';

export class AddCoinsDto {
  @IsInt()
  @Min(1)
  amount: number;
}
