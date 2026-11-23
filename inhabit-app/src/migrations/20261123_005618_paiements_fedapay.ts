import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_orders_provider" ADD VALUE 'fedapay';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."orders" ALTER COLUMN "provider" SET DATA TYPE text;
  DROP TYPE "payload"."enum_orders_provider";
  CREATE TYPE "payload"."enum_orders_provider" AS ENUM('stripe', 'paypal');
  ALTER TABLE "payload"."orders" ALTER COLUMN "provider" SET DATA TYPE "payload"."enum_orders_provider" USING "provider"::"payload"."enum_orders_provider";`)
}
