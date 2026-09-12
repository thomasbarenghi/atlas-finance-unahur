import { Type } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from "class-validator";
import { PeriodDto } from "../../common/dto/period.dto";

export class AssistantMessageDto {
  @IsString()
  @Length(1, 1000)
  question: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => PeriodDto)
  period?: PeriodDto;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
