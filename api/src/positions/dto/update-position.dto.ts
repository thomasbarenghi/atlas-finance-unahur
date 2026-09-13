import { IsNumber, IsOptional, IsString, Length, Min } from "class-validator";

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  @Length(1, 20)
  symbol?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  instrument?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  avgCost?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
