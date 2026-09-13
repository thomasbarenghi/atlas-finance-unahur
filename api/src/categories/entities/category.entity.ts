import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { CategoryType } from "../../common/types/financial-enums";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
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

  @Column({ type: "boolean", default: false })
  archived: boolean;
}
