import { IsIn, IsOptional, IsString, Length, MaxLength } from "class-validator";
import { AssetType } from "../../common/types/financial-enums";
import { ASSET_TYPE_VALUES } from "./create-asset.dto";

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsIn(ASSET_TYPE_VALUES)
  type?: AssetType;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
