import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { CategoryType } from "../../common/types/financial-enums";

/**
 * Categories are either system-wide (`user_id` null, read-only) or owned by a
 * user (`user_id` set, editable by its owner).
 */
@Entity("categories")
@Index(["userId", "type", "name"], { unique: true })
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string | null;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text" })
  type: CategoryType;

  @Column({ type: "text" })
  color: string;

  @Column({ type: "text", nullable: true })
  icon: string | null;
}
