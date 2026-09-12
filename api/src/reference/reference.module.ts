import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ReferenceController } from "./reference.controller";

@Module({
  imports: [ConfigModule],
  controllers: [ReferenceController],
})
export class ReferenceModule {}
