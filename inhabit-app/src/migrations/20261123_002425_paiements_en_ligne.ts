import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_orders_product" AS ENUM('livre-papier', 'livre-numerique', 'accompagnement');
  CREATE TYPE "payload"."enum_orders_provider" AS ENUM('stripe', 'paypal');
  CREATE TYPE "payload"."enum_orders_status" AS ENUM('en-attente', 'payee', 'expediee', 'annulee', 'remboursee');
  CREATE TYPE "payload"."enum_book_editions_kind" AS ENUM('papier', 'numerique');
  ALTER TYPE "payload"."enum_coaching_bookings_status" ADD VALUE 'attente-paiement' BEFORE 'confirmee';
  CREATE TABLE "payload"."orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"product" "payload"."enum_orders_product" NOT NULL,
  	"label" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"shipping_fee" numeric,
  	"provider" "payload"."enum_orders_provider" NOT NULL,
  	"customer_name" varchar,
  	"customer_email" varchar,
  	"customer_phone" varchar,
  	"shipping_name" varchar,
  	"shipping_line1" varchar,
  	"shipping_line2" varchar,
  	"shipping_postal_code" varchar,
  	"shipping_city" varchar,
  	"shipping_state" varchar,
  	"shipping_country" varchar,
  	"tracking_number" varchar,
  	"month" varchar,
  	"coaching_booking_id" integer,
  	"edition_id" varchar,
  	"provider_id" varchar,
  	"payment_id" varchar,
  	"secret" varchar NOT NULL,
  	"download_count" numeric DEFAULT 0,
  	"download_expires_at" timestamp(3) with time zone,
  	"status" "payload"."enum_orders_status" DEFAULT 'en-attente' NOT NULL,
  	"paid_at" timestamp(3) with time zone,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload"."book_editions" ADD COLUMN "sell_online" boolean DEFAULT false;
  ALTER TABLE "payload"."book_editions" ADD COLUMN "kind" "payload"."enum_book_editions_kind" DEFAULT 'papier';
  ALTER TABLE "payload"."book_editions" ADD COLUMN "amount" numeric;
  ALTER TABLE "payload"."book_editions" ADD COLUMN "digital_file" varchar;
  ALTER TABLE "payload"."book" ADD COLUMN "shop_shipping_fee" numeric DEFAULT 0;
  ALTER TABLE "payload"."book" ADD COLUMN "shop_shipping_countries" varchar DEFAULT 'FR,BE,CH,LU,CA,TG,BJ,CI,SN,BF,ML,NE,GN,CM,GA,CG,CD,GH,NG,JP,US,GB,DE';
  ALTER TABLE "payload"."book" ADD COLUMN "shop_delivery_note" varchar DEFAULT 'Expédition sous 7 à 14 jours';
  ALTER TABLE "payload"."coaching" ADD COLUMN "amount" numeric;
  ALTER TABLE "payload"."orders" ADD CONSTRAINT "orders_coaching_booking_id_coaching_bookings_id_fk" FOREIGN KEY ("coaching_booking_id") REFERENCES "payload"."coaching_bookings"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "orders_reference_idx" ON "payload"."orders" USING btree ("reference");
  CREATE INDEX "orders_coaching_booking_idx" ON "payload"."orders" USING btree ("coaching_booking_id");
  CREATE INDEX "orders_provider_id_idx" ON "payload"."orders" USING btree ("provider_id");
  CREATE INDEX "orders_payment_id_idx" ON "payload"."orders" USING btree ("payment_id");
  CREATE UNIQUE INDEX "orders_secret_idx" ON "payload"."orders" USING btree ("secret");
  CREATE INDEX "orders_updated_at_idx" ON "payload"."orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "payload"."orders" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "payload"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("orders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."orders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."orders" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload"."coaching_bookings" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "payload"."coaching_bookings" ALTER COLUMN "status" SET DEFAULT 'nouvelle'::text;
  DROP TYPE "payload"."enum_coaching_bookings_status";
  CREATE TYPE "payload"."enum_coaching_bookings_status" AS ENUM('nouvelle', 'confirmee', 'annulee');
  ALTER TABLE "payload"."coaching_bookings" ALTER COLUMN "status" SET DEFAULT 'nouvelle'::"payload"."enum_coaching_bookings_status";
  ALTER TABLE "payload"."coaching_bookings" ALTER COLUMN "status" SET DATA TYPE "payload"."enum_coaching_bookings_status" USING "status"::"payload"."enum_coaching_bookings_status";
  DROP INDEX "payload"."payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "sell_online";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "kind";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "amount";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "digital_file";
  ALTER TABLE "payload"."book" DROP COLUMN "shop_shipping_fee";
  ALTER TABLE "payload"."book" DROP COLUMN "shop_shipping_countries";
  ALTER TABLE "payload"."book" DROP COLUMN "shop_delivery_note";
  ALTER TABLE "payload"."coaching" DROP COLUMN "amount";
  DROP TYPE "payload"."enum_orders_product";
  DROP TYPE "payload"."enum_orders_provider";
  DROP TYPE "payload"."enum_orders_status";
  DROP TYPE "payload"."enum_book_editions_kind";`)
}
