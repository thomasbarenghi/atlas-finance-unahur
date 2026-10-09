import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CategoryType } from "../../common/types/financial-enums";
import { User } from "../../users/entities/user.entity";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text" })
  type: CategoryType;

  @Column({ type: "text" })
  color: string;

  @Column({ type: "text", nullable: true })
  icon: string | null;

  @Column({ type: "boolean", default: false })
  archived: boolean;
}
