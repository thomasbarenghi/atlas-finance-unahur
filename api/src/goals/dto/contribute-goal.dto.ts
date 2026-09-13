import { IsNumber, Min } from "class-validator";

export class ContributeGoalDto {
  @IsNumber()
  @Min(0.0001)
  amount: number;
}
