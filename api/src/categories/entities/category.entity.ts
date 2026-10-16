import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { CategoryType } from "../../common/types/financial-enums";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text" })
  type: CategoryType;

  @Column({ type: "text" })
  color: string;

  @Column({ type: "text", nullable: true })
  icon: string | null;
}
