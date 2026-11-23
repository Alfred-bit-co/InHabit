import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."members" ADD COLUMN "google_id" varchar;
  CREATE UNIQUE INDEX "members_google_id_idx" ON "payload"."members" USING btree ("google_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."members_google_id_idx";
  ALTER TABLE "payload"."members" DROP COLUMN "google_id";`)
}
