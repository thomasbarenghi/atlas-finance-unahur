import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBudgetRecurring1757600000001 implements MigrationInterface {
  name = "AddBudgetRecurring1757600000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD "recurring" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "budgets" DROP COLUMN "recurring"`);
  }
}
