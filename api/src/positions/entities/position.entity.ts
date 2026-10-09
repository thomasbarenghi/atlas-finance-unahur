import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { numericTransformer } from "../../common/transformers/numeric.transformer";
import { User } from "../../users/entities/user.entity";

@Entity("positions")
export class Position {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "text" })
  symbol: string;

  @Column({ type: "text" })
  instrument: string;

  @Column({
    type: "numeric",
    precision: 18,
    scale: 8,
    transformer: numericTransformer,
  })
  quantity: number;

  @Column({
    name: "avg_cost",
    type: "numeric",
    precision: 18,
    scale: 4,
    transformer: numericTransformer,
  })
  avgCost: number;

  @Column({ type: "char", length: 3 })
  currency: string;

  @Column({ type: "boolean", default: false })
  archived: boolean;
}
