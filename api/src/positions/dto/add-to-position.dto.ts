import { IsNumber, Min } from "class-validator";

export class AddToPositionDto {
  @IsNumber()
  @Min(0.00000001)
  amount: number;

  @IsNumber()
  @Min(0.00000001)
  unitPrice: number;
}
