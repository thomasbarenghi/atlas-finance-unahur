import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AssetType } from "../../common/types/financial-enums";
import { User } from "../../users/entities/user.entity";

@Entity("assets")
export class Asset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

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
