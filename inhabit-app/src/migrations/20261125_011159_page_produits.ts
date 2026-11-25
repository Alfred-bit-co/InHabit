import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_products_page_products_kind" AS ENUM('livre', 'accompagnement', 'rendez-vous', 'autre');
  CREATE TYPE "payload"."enum_products_page_products_button_style" AS ENUM('beige', 'accent');
  CREATE TABLE "payload"."products_page_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "payload"."enum_products_page_products_kind" DEFAULT 'autre' NOT NULL,
  	"visible" boolean DEFAULT true,
  	"label" varchar,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"price" varchar,
  	"price_note" varchar,
  	"button_label" varchar,
  	"button_style" "payload"."enum_products_page_products_button_style" DEFAULT 'beige',
  	"link" varchar
  );
  
  CREATE TABLE "payload"."products_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Produits & services',
  	"title" varchar DEFAULT 'Lire, apprendre,',
  	"title_accent" varchar DEFAULT 'construire',
  	"intro" varchar DEFAULT 'Des publications et des accompagnements pour développer une pensée architecturale juste.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."products_page_products" ADD CONSTRAINT "products_page_products_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."products_page_products" ADD CONSTRAINT "products_page_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_page_products_order_idx" ON "payload"."products_page_products" USING btree ("_order");
  CREATE INDEX "products_page_products_parent_id_idx" ON "payload"."products_page_products" USING btree ("_parent_id");
  CREATE INDEX "products_page_products_image_idx" ON "payload"."products_page_products" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."products_page_products" CASCADE;
  DROP TABLE "payload"."products_page" CASCADE;
  DROP TYPE "payload"."enum_products_page_products_kind";
  DROP TYPE "payload"."enum_products_page_products_button_style";`)
}
