import { IsNumber, IsString, Length, Min } from "class-validator";

export class CreatePositionDto {
  @IsString()
  @Length(1, 20)
  symbol: string;

  @IsString()
  @Length(1, 80)
  instrument: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  avgCost: number;

  @IsString()
  @Length(3, 3)
  currency: string;
}
