import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AssetType } from "../../common/types/financial-enums";

@Entity("assets")
export class Asset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text" })
  type: AssetType;

  @Column({ type: "char", length: 3 })
  currency: string;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "boolean", default: false })
  archived: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
