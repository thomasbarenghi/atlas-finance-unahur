import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1757600000000 implements MigrationInterface {
  name = "InitialSchema1757600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "email" text NOT NULL,
        "password_hash" text NOT NULL,
        "base_currency" character(3) NOT NULL DEFAULT 'USD',
        "theme" text NOT NULL DEFAULT 'system',
        "ai_enabled" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "refresh_token_hash" text NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "currency" character(3) NOT NULL,
        "initial_balance" numeric(18,4) NOT NULL DEFAULT 0,
        "archived" boolean NOT NULL DEFAULT false,
        "notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accounts_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_accounts_user_id" ON "accounts" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "color" text NOT NULL,
        "icon" text,
        "archived" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_user_id" ON "categories" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" text NOT NULL,
        "amount" numeric(18,4) NOT NULL,
        "currency" character(3) NOT NULL,
        "date" date NOT NULL,
        "description" text NOT NULL,
        "notes" text,
        "account_id" uuid NOT NULL,
        "transfer_account_id" uuid,
        "category_id" uuid,
        "transfer_group_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_account" FOREIGN KEY ("account_id")
          REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_transfer_account" FOREIGN KEY ("transfer_account_id")
          REFERENCES "accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_transactions_category" FOREIGN KEY ("category_id")
          REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_user_id" ON "transactions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_account_id" ON "transactions" ("account_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_transfer_group_id" ON "transactions" ("transfer_group_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "budgets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "period" date NOT NULL,
        "limit" numeric(18,4) NOT NULL,
        "currency" character(3) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budgets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_budgets_user_category_period"
          UNIQUE ("user_id", "category_id", "period"),
        CONSTRAINT "FK_budgets_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_budgets_category" FOREIGN KEY ("category_id")
          REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_budgets_user_id" ON "budgets" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "assets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "currency" character(3) NOT NULL,
        "notes" text,
        "archived" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_assets_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_assets_user_id" ON "assets" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "valuations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "asset_id" uuid NOT NULL,
        "value" numeric(18,4) NOT NULL,
        "currency" character(3) NOT NULL,
        "date" date NOT NULL,
        "source" text NOT NULL DEFAULT 'manual',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_valuations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_valuations_asset" FOREIGN KEY ("asset_id")
          REFERENCES "assets"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_valuations_asset_id" ON "valuations" ("asset_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "debts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "balance" numeric(18,4) NOT NULL,
        "currency" character(3) NOT NULL,
        "date" date NOT NULL,
        "archived" boolean NOT NULL DEFAULT false,
        "asset_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_debts_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_debts_asset" FOREIGN KEY ("asset_id")
          REFERENCES "assets"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_debts_user_id" ON "debts" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "positions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "symbol" text NOT NULL,
        "instrument" text NOT NULL,
        "quantity" numeric(18,8) NOT NULL,
        "avg_cost" numeric(18,4) NOT NULL,
        "currency" character(3) NOT NULL,
        "archived" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_positions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_positions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_positions_user_id" ON "positions" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "quotes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "symbol" text NOT NULL,
        "price" numeric(18,8) NOT NULL,
        "currency" character(3) NOT NULL,
        "provider" text NOT NULL,
        "change_24h" numeric(18,8),
        "fetched_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_quotes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_quotes_symbol_currency_provider"
          UNIQUE ("symbol", "currency", "provider")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "goals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "target_amount" numeric(18,4) NOT NULL,
        "saved_amount" numeric(18,4) NOT NULL DEFAULT 0,
        "currency" character(3) NOT NULL,
        "target_date" date,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_goals_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_goals_user_id" ON "goals" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "ai_conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "question" text NOT NULL,
        "answer" text NOT NULL,
        "context_meta" jsonb NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_conversations_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_user_id" ON "ai_conversations" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "exchange_rates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "base_currency" character(3) NOT NULL,
        "quote_currency" character(3) NOT NULL,
        "rate" numeric(18,8) NOT NULL,
        "provider" text NOT NULL,
        "date" date NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exchange_rates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exchange_rates_pair_provider_date"
          UNIQUE ("base_currency", "quote_currency", "provider", "date")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "exchange_rates"`);
    await queryRunner.query(`DROP TABLE "ai_conversations"`);
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TABLE "quotes"`);
    await queryRunner.query(`DROP TABLE "positions"`);
    await queryRunner.query(`DROP TABLE "debts"`);
    await queryRunner.query(`DROP TABLE "valuations"`);
    await queryRunner.query(`DROP TABLE "assets"`);
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
