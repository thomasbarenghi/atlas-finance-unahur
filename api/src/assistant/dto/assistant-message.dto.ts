import { Type } from "class-transformer";
import { IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { PeriodDto } from "../../common/dto/period.dto";

export class AssistantMessageDto {
  @IsString()
  @Length(1, 1000)
  question: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PeriodDto)
  period?: PeriodDto;
}
