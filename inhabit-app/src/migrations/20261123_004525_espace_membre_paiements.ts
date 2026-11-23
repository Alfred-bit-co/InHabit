import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_book_files_kind" AS ENUM('complet', 'extrait');
  CREATE TYPE "payload"."enum_coaching_bookings_payment_status" AS ENUM('non-paye', 'payee', 'autre');
  CREATE TYPE "payload"."enum_orders_status" AS ENUM('en-attente', 'payee', 'echouee', 'expiree', 'remboursee');
  CREATE TYPE "payload"."enum_orders_product" AS ENUM('livre', 'accompagnement');
  CREATE TYPE "payload"."enum_orders_currency" AS ENUM('eur', 'xof', 'usd', 'jpy');
  CREATE TYPE "payload"."enum_book_editions_currency" AS ENUM('eur', 'xof', 'usd', 'jpy');
  CREATE TYPE "payload"."enum_coaching_currency" AS ENUM('eur', 'xof', 'usd', 'jpy');
  CREATE TABLE "payload"."book_chapters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric NOT NULL,
  	"title" varchar NOT NULL,
  	"part" varchar,
  	"content" jsonb NOT NULL,
  	"free" boolean DEFAULT false,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."book_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "payload"."enum_book_files_kind" DEFAULT 'complet' NOT NULL,
  	"active" boolean DEFAULT true,
  	"prefix" varchar DEFAULT '',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"status" "payload"."enum_orders_status" DEFAULT 'en-attente' NOT NULL,
  	"product" "payload"."enum_orders_product" NOT NULL,
  	"label" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" "payload"."enum_orders_currency" DEFAULT 'eur' NOT NULL,
  	"email" varchar,
  	"customer_name" varchar,
  	"shipping_address" varchar,
  	"grants_book_access" boolean DEFAULT false,
  	"access_days" numeric,
  	"edition_id" varchar,
  	"member_id" integer,
  	"coaching_booking_id" integer,
  	"provider" varchar DEFAULT 'stripe',
  	"provider_session_id" varchar,
  	"provider_payment_id" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."members_bookmarks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chapter_id" integer,
  	"position" numeric,
  	"page" numeric,
  	"excerpt" varchar,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."members_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"book_access" boolean DEFAULT false,
  	"book_access_until" timestamp(3) with time zone,
  	"reading_chapter_id" integer,
  	"reading_position" numeric,
  	"pdf_page" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."coaching_bookings" ADD COLUMN "payment_status" "payload"."enum_coaching_bookings_payment_status" DEFAULT 'non-paye';
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "book_chapters_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "book_files_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "payload"."payload_preferences_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "payload"."book_editions" ADD COLUMN "pay_by_card" boolean DEFAULT false;
  ALTER TABLE "payload"."book_editions" ADD COLUMN "price_amount" numeric;
  ALTER TABLE "payload"."book_editions" ADD COLUMN "currency" "payload"."enum_book_editions_currency" DEFAULT 'eur';
  ALTER TABLE "payload"."book_editions" ADD COLUMN "digital_access" boolean DEFAULT false;
  ALTER TABLE "payload"."book_editions" ADD COLUMN "access_days" numeric;
  ALTER TABLE "payload"."book_editions" ADD COLUMN "requires_shipping" boolean DEFAULT false;
  ALTER TABLE "payload"."coaching" ADD COLUMN "pay_by_card" boolean DEFAULT false;
  ALTER TABLE "payload"."coaching" ADD COLUMN "price_amount" numeric;
  ALTER TABLE "payload"."coaching" ADD COLUMN "currency" "payload"."enum_coaching_currency" DEFAULT 'eur';
  ALTER TABLE "payload"."orders" ADD CONSTRAINT "orders_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "payload"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."orders" ADD CONSTRAINT "orders_coaching_booking_id_coaching_bookings_id_fk" FOREIGN KEY ("coaching_booking_id") REFERENCES "payload"."coaching_bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."members_bookmarks" ADD CONSTRAINT "members_bookmarks_chapter_id_book_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "payload"."book_chapters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."members_bookmarks" ADD CONSTRAINT "members_bookmarks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."members_sessions" ADD CONSTRAINT "members_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."members" ADD CONSTRAINT "members_reading_chapter_id_book_chapters_id_fk" FOREIGN KEY ("reading_chapter_id") REFERENCES "payload"."book_chapters"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "book_chapters_number_idx" ON "payload"."book_chapters" USING btree ("number");
  CREATE INDEX "book_chapters_updated_at_idx" ON "payload"."book_chapters" USING btree ("updated_at");
  CREATE INDEX "book_chapters_created_at_idx" ON "payload"."book_chapters" USING btree ("created_at");
  CREATE INDEX "book_files_updated_at_idx" ON "payload"."book_files" USING btree ("updated_at");
  CREATE INDEX "book_files_created_at_idx" ON "payload"."book_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "book_files_filename_idx" ON "payload"."book_files" USING btree ("filename");
  CREATE UNIQUE INDEX "orders_reference_idx" ON "payload"."orders" USING btree ("reference");
  CREATE INDEX "orders_status_idx" ON "payload"."orders" USING btree ("status");
  CREATE INDEX "orders_email_idx" ON "payload"."orders" USING btree ("email");
  CREATE INDEX "orders_member_idx" ON "payload"."orders" USING btree ("member_id");
  CREATE INDEX "orders_coaching_booking_idx" ON "payload"."orders" USING btree ("coaching_booking_id");
  CREATE INDEX "orders_provider_session_id_idx" ON "payload"."orders" USING btree ("provider_session_id");
  CREATE INDEX "orders_updated_at_idx" ON "payload"."orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "payload"."orders" USING btree ("created_at");
  CREATE INDEX "members_bookmarks_order_idx" ON "payload"."members_bookmarks" USING btree ("_order");
  CREATE INDEX "members_bookmarks_parent_id_idx" ON "payload"."members_bookmarks" USING btree ("_parent_id");
  CREATE INDEX "members_bookmarks_chapter_idx" ON "payload"."members_bookmarks" USING btree ("chapter_id");
  CREATE INDEX "members_sessions_order_idx" ON "payload"."members_sessions" USING btree ("_order");
  CREATE INDEX "members_sessions_parent_id_idx" ON "payload"."members_sessions" USING btree ("_parent_id");
  CREATE INDEX "members_reading_chapter_idx" ON "payload"."members" USING btree ("reading_chapter_id");
  CREATE INDEX "members_updated_at_idx" ON "payload"."members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "payload"."members" USING btree ("created_at");
  CREATE UNIQUE INDEX "members_email_idx" ON "payload"."members" USING btree ("email");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_chapters_fk" FOREIGN KEY ("book_chapters_id") REFERENCES "payload"."book_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_files_fk" FOREIGN KEY ("book_files_id") REFERENCES "payload"."book_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "payload"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_book_chapters_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("book_chapters_id");
  CREATE INDEX "payload_locked_documents_rels_book_files_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("book_files_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_members_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("members_id");
  CREATE INDEX "payload_preferences_rels_members_id_idx" ON "payload"."payload_preferences_rels" USING btree ("members_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."book_chapters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."book_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."members_bookmarks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."members_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."members" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."book_chapters" CASCADE;
  DROP TABLE "payload"."book_files" CASCADE;
  DROP TABLE "payload"."orders" CASCADE;
  DROP TABLE "payload"."members_bookmarks" CASCADE;
  DROP TABLE "payload"."members_sessions" CASCADE;
  DROP TABLE "payload"."members" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_book_chapters_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_book_files_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_members_fk";
  
  ALTER TABLE "payload"."payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_members_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_book_chapters_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_book_files_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_orders_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_members_id_idx";
  DROP INDEX "payload"."payload_preferences_rels_members_id_idx";
  ALTER TABLE "payload"."coaching_bookings" DROP COLUMN "payment_status";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "book_chapters_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "book_files_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "members_id";
  ALTER TABLE "payload"."payload_preferences_rels" DROP COLUMN "members_id";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "pay_by_card";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "price_amount";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "currency";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "digital_access";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "access_days";
  ALTER TABLE "payload"."book_editions" DROP COLUMN "requires_shipping";
  ALTER TABLE "payload"."coaching" DROP COLUMN "pay_by_card";
  ALTER TABLE "payload"."coaching" DROP COLUMN "price_amount";
  ALTER TABLE "payload"."coaching" DROP COLUMN "currency";
  DROP TYPE "payload"."enum_book_files_kind";
  DROP TYPE "payload"."enum_coaching_bookings_payment_status";
  DROP TYPE "payload"."enum_orders_status";
  DROP TYPE "payload"."enum_orders_product";
  DROP TYPE "payload"."enum_orders_currency";
  DROP TYPE "payload"."enum_book_editions_currency";
  DROP TYPE "payload"."enum_coaching_currency";`)
}
