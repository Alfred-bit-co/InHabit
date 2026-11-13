import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Schéma dédié aux tables Payload (non exposé par l'API publique de Supabase)
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "payload";`)
  await db.execute(sql`
   CREATE TYPE "payload"."enum_news_type" AS ENUM('annonce', 'concours', 'evenement', 'conference');
  CREATE TYPE "payload"."enum_projects_gallery_kind" AS ENUM('photo', 'plan', 'perspective', 'dessin');
  CREATE TYPE "payload"."enum_projects_country" AS ENUM('710', '012', '024', '204', '072', '854', '108', '120', '132', '140', '174', '178', '384', '262', '818', '232', '748', '231', '266', '270', '288', '324', '624', '226', '404', '426', '430', '434', '450', '454', '466', '504', '480', '478', '508', '516', '562', '566', '800', '180', '646', '732', '678', '686', '690', '694', '706', '729', '728', '834', '148', '768', '788', '894', '716', 'hors-afrique');
  CREATE TYPE "payload"."enum_projects_status" AS ENUM('realise', 'en-cours', 'etude', 'concours');
  CREATE TYPE "payload"."enum_publications_type" AS ENUM('etude', 'publication', 'en-cours', 'article');
  CREATE TYPE "payload"."enum_events_type" AS ENUM('concours', 'evenement', 'conference');
  CREATE TYPE "payload"."enum_events_status" AS ENUM('a-venir', 'en-cours', 'termine');
  CREATE TYPE "payload"."enum_coaching_bookings_profile" AS ENUM('etudiant', 'jeune-diplome', 'professionnel', 'autre');
  CREATE TYPE "payload"."enum_coaching_bookings_status" AS ENUM('nouvelle', 'confirmee', 'annulee');
  CREATE TYPE "payload"."enum_appointments_mode" AS ENUM('visio', 'telephone');
  CREATE TYPE "payload"."enum_appointments_project_type" AS ENUM('maison', 'logements', 'equipement', 'renovation', 'autre');
  CREATE TYPE "payload"."enum_appointments_status" AS ENUM('confirme', 'effectue', 'annule');
  CREATE TYPE "payload"."enum_contact_messages_reason" AS ENUM('partenariat', 'institution', 'evenement', 'question', 'autre');
  CREATE TYPE "payload"."enum_contact_messages_status" AS ENUM('nouveau', 'en-cours', 'traite');
  CREATE TYPE "payload"."enum_topic_suggestions_status" AS ENUM('nouveau', 'retenu', 'traite', 'ecarte');
  CREATE TYPE "payload"."enum_appointment_settings_weekdays" AS ENUM('1', '2', '3', '4', '5', '6', '0');
  CREATE TYPE "payload"."enum_site_settings_socials_platform" AS ENUM('youtube', 'instagram', 'linkedin', 'facebook', 'tiktok', 'x', 'whatsapp');
  CREATE TABLE "payload"."news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "payload"."enum_news_type" DEFAULT 'annonce' NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"excerpt" varchar NOT NULL,
  	"cover_id" integer,
  	"content" jsonb,
  	"link" varchar,
  	"slug" varchar,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."projects_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"kind" "payload"."enum_projects_gallery_kind" DEFAULT 'photo',
  	"caption" varchar
  );
  
  CREATE TABLE "payload"."projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"country" "payload"."enum_projects_country" NOT NULL,
  	"country_other" varchar,
  	"city" varchar,
  	"year" varchar,
  	"status" "payload"."enum_projects_status" DEFAULT 'realise',
  	"role" varchar,
  	"cover_id" integer NOT NULL,
  	"context" varchar,
  	"program" varchar,
  	"approach" jsonb,
  	"slug" varchar,
  	"published" boolean DEFAULT true,
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."publications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "payload"."enum_publications_type" DEFAULT 'article' NOT NULL,
  	"date" timestamp(3) with time zone,
  	"summary" varchar NOT NULL,
  	"cover_id" integer,
  	"content" jsonb,
  	"file_id" integer,
  	"external_url" varchar,
  	"slug" varchar,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "payload"."enum_events_type" DEFAULT 'concours' NOT NULL,
  	"status" "payload"."enum_events_status" DEFAULT 'a-venir' NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"location" varchar,
  	"summary" varchar NOT NULL,
  	"cover_id" integer,
  	"content" jsonb,
  	"modalities" jsonb,
  	"registration_url" varchar,
  	"slug" varchar,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
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
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "payload"."videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"youtube_id" varchar,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."videos_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"video_themes_id" integer
  );
  
  CREATE TABLE "payload"."video_themes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."coaching_bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"month" varchar NOT NULL,
  	"country" varchar,
  	"profile" "payload"."enum_coaching_bookings_profile",
  	"motivation" varchar,
  	"status" "payload"."enum_coaching_bookings_status" DEFAULT 'nouvelle' NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."appointments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"date" varchar NOT NULL,
  	"slot" varchar NOT NULL,
  	"mode" "payload"."enum_appointments_mode" DEFAULT 'visio',
  	"project_type" "payload"."enum_appointments_project_type",
  	"location" varchar,
  	"description" varchar NOT NULL,
  	"status" "payload"."enum_appointments_status" DEFAULT 'confirme' NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"organization" varchar,
  	"reason" "payload"."enum_contact_messages_reason" NOT NULL,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"status" "payload"."enum_contact_messages_status" DEFAULT 'nouveau' NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."topic_suggestions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"email" varchar,
  	"topic" varchar NOT NULL,
  	"details" varchar,
  	"status" "payload"."enum_topic_suggestions_status" DEFAULT 'nouveau' NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
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
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer,
  	"projects_id" integer,
  	"publications_id" integer,
  	"events_id" integer,
  	"media_id" integer,
  	"videos_id" integer,
  	"video_themes_id" integer,
  	"coaching_bookings_id" integer,
  	"appointments_id" integer,
  	"contact_messages_id" integer,
  	"topic_suggestions_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."home_hero_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"line1" varchar,
  	"line2" varchar,
  	"link" varchar
  );
  
  CREATE TABLE "payload"."home_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_title" varchar DEFAULT 'Architecture',
  	"hero_subtitle" varchar DEFAULT 'begins as',
  	"hero_accent" varchar DEFAULT 'art',
  	"hero_cta" varchar DEFAULT 'Cliquez pour commencer',
  	"intro_eyebrow" varchar DEFAULT 'La chaîne InHabit_Archi',
  	"intro_title" varchar,
  	"intro_text" varchar,
  	"appointment_title" varchar DEFAULT 'Vous avez un projet de construction ?',
  	"appointment_text" varchar DEFAULT 'Réservez un premier échange gratuit pour parler de votre projet.',
  	"partner_title" varchar DEFAULT 'Construisons ensemble.',
  	"partner_text" varchar DEFAULT 'Entreprises, institutions, organisateurs d’événements : proposez-nous une collaboration.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "payload"."youtube_page_editorial_line" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."youtube_page_community_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"topic" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."youtube_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Penser l’espace, en vidéo.',
  	"vision" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."about_collaborators" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"photo_id" integer,
  	"link" varchar
  );
  
  CREATE TABLE "payload"."about_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar,
  	"logo_id" integer
  );
  
  CREATE TABLE "payload"."about" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Habiter, questionner, transmettre.',
  	"intro" varchar,
  	"history" jsonb,
  	"vision" jsonb,
  	"founder_name" varchar DEFAULT 'Warren Riad AYITOU',
  	"founder_role" varchar DEFAULT 'Architecte & auteur',
  	"founder_photo_id" integer,
  	"founder_bio" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."book_editions_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."book_editions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"format" varchar,
  	"price" varchar,
  	"cover_id" integer,
  	"available" boolean DEFAULT true
  );
  
  CREATE TABLE "payload"."book_excerpts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE "payload"."book" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'CONCEPT',
  	"subtitle" varchar,
  	"cover_id" integer,
  	"pitch" varchar,
  	"presentation" jsonb,
  	"contents" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."coaching_objectives" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."coaching_modalities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."coaching_months" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"month" varchar NOT NULL,
  	"capacity" numeric DEFAULT 4,
  	"displayed_places" numeric,
  	"open" boolean DEFAULT true
  );
  
  CREATE TABLE "payload"."coaching" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Accompagnement CONCEPT',
  	"intro" varchar,
  	"price" varchar,
  	"duration_weeks" numeric DEFAULT 4,
  	"description" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."appointment_settings_weekdays" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_appointment_settings_weekdays",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."appointment_settings_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."appointment_settings_blocked_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."appointment_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Rendez-vous architectural',
  	"intro" varchar,
  	"duration_minutes" numeric DEFAULT 30,
  	"days_ahead" numeric DEFAULT 30,
  	"min_notice_days" numeric DEFAULT 1,
  	"timezone_label" varchar DEFAULT 'heure de Paris',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."site_settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_site_settings_socials_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'InHabit_Archi',
  	"tagline" varchar DEFAULT 'Plateforme architecturale contemporaine : chaîne YouTube, livre CONCEPT, projets et recherches.',
  	"contact_email" varchar,
  	"phone" varchar,
  	"location" varchar,
  	"notification_email" varchar,
  	"youtube_channel_id" varchar,
  	"youtube_channel_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."news" ADD CONSTRAINT "news_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."projects_gallery" ADD CONSTRAINT "projects_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."projects_gallery" ADD CONSTRAINT "projects_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."projects" ADD CONSTRAINT "projects_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."publications" ADD CONSTRAINT "publications_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."publications" ADD CONSTRAINT "publications_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."events" ADD CONSTRAINT "events_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."videos_rels" ADD CONSTRAINT "videos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."videos_rels" ADD CONSTRAINT "videos_rels_video_themes_fk" FOREIGN KEY ("video_themes_id") REFERENCES "payload"."video_themes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "payload"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "payload"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "payload"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "payload"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_video_themes_fk" FOREIGN KEY ("video_themes_id") REFERENCES "payload"."video_themes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_coaching_bookings_fk" FOREIGN KEY ("coaching_bookings_id") REFERENCES "payload"."coaching_bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_appointments_fk" FOREIGN KEY ("appointments_id") REFERENCES "payload"."appointments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "payload"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topic_suggestions_fk" FOREIGN KEY ("topic_suggestions_id") REFERENCES "payload"."topic_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_hero_cards" ADD CONSTRAINT "home_hero_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."home_hero_cards" ADD CONSTRAINT "home_hero_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_stats" ADD CONSTRAINT "home_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_rels" ADD CONSTRAINT "home_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."youtube_page_editorial_line" ADD CONSTRAINT "youtube_page_editorial_line_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."youtube_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."youtube_page_community_topics" ADD CONSTRAINT "youtube_page_community_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."youtube_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."about_collaborators" ADD CONSTRAINT "about_collaborators_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."about_collaborators" ADD CONSTRAINT "about_collaborators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."about_partners" ADD CONSTRAINT "about_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."about_partners" ADD CONSTRAINT "about_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."about" ADD CONSTRAINT "about_founder_photo_id_media_id_fk" FOREIGN KEY ("founder_photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."book_editions_links" ADD CONSTRAINT "book_editions_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."book_editions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."book_editions" ADD CONSTRAINT "book_editions_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."book_editions" ADD CONSTRAINT "book_editions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."book"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."book_excerpts" ADD CONSTRAINT "book_excerpts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."book_excerpts" ADD CONSTRAINT "book_excerpts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."book"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."book" ADD CONSTRAINT "book_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."coaching_objectives" ADD CONSTRAINT "coaching_objectives_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."coaching"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."coaching_modalities" ADD CONSTRAINT "coaching_modalities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."coaching"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."coaching_months" ADD CONSTRAINT "coaching_months_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."coaching"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."appointment_settings_weekdays" ADD CONSTRAINT "appointment_settings_weekdays_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."appointment_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."appointment_settings_slots" ADD CONSTRAINT "appointment_settings_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."appointment_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."appointment_settings_blocked_dates" ADD CONSTRAINT "appointment_settings_blocked_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."appointment_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "news_cover_idx" ON "payload"."news" USING btree ("cover_id");
  CREATE UNIQUE INDEX "news_slug_idx" ON "payload"."news" USING btree ("slug");
  CREATE INDEX "news_updated_at_idx" ON "payload"."news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "payload"."news" USING btree ("created_at");
  CREATE INDEX "projects_gallery_order_idx" ON "payload"."projects_gallery" USING btree ("_order");
  CREATE INDEX "projects_gallery_parent_id_idx" ON "payload"."projects_gallery" USING btree ("_parent_id");
  CREATE INDEX "projects_gallery_image_idx" ON "payload"."projects_gallery" USING btree ("image_id");
  CREATE INDEX "projects_cover_idx" ON "payload"."projects" USING btree ("cover_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "payload"."projects" USING btree ("slug");
  CREATE INDEX "projects_updated_at_idx" ON "payload"."projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "payload"."projects" USING btree ("created_at");
  CREATE INDEX "publications_cover_idx" ON "payload"."publications" USING btree ("cover_id");
  CREATE INDEX "publications_file_idx" ON "payload"."publications" USING btree ("file_id");
  CREATE UNIQUE INDEX "publications_slug_idx" ON "payload"."publications" USING btree ("slug");
  CREATE INDEX "publications_updated_at_idx" ON "payload"."publications" USING btree ("updated_at");
  CREATE INDEX "publications_created_at_idx" ON "payload"."publications" USING btree ("created_at");
  CREATE INDEX "events_cover_idx" ON "payload"."events" USING btree ("cover_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "payload"."events" USING btree ("slug");
  CREATE INDEX "events_updated_at_idx" ON "payload"."events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "payload"."events" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "payload"."media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "payload"."media" USING btree ("sizes_large_filename");
  CREATE INDEX "videos_updated_at_idx" ON "payload"."videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "payload"."videos" USING btree ("created_at");
  CREATE INDEX "videos_rels_order_idx" ON "payload"."videos_rels" USING btree ("order");
  CREATE INDEX "videos_rels_parent_idx" ON "payload"."videos_rels" USING btree ("parent_id");
  CREATE INDEX "videos_rels_path_idx" ON "payload"."videos_rels" USING btree ("path");
  CREATE INDEX "videos_rels_video_themes_id_idx" ON "payload"."videos_rels" USING btree ("video_themes_id");
  CREATE INDEX "video_themes_updated_at_idx" ON "payload"."video_themes" USING btree ("updated_at");
  CREATE INDEX "video_themes_created_at_idx" ON "payload"."video_themes" USING btree ("created_at");
  CREATE INDEX "coaching_bookings_month_idx" ON "payload"."coaching_bookings" USING btree ("month");
  CREATE INDEX "coaching_bookings_updated_at_idx" ON "payload"."coaching_bookings" USING btree ("updated_at");
  CREATE INDEX "coaching_bookings_created_at_idx" ON "payload"."coaching_bookings" USING btree ("created_at");
  CREATE INDEX "appointments_date_idx" ON "payload"."appointments" USING btree ("date");
  CREATE INDEX "appointments_updated_at_idx" ON "payload"."appointments" USING btree ("updated_at");
  CREATE INDEX "appointments_created_at_idx" ON "payload"."appointments" USING btree ("created_at");
  CREATE INDEX "contact_messages_updated_at_idx" ON "payload"."contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "payload"."contact_messages" USING btree ("created_at");
  CREATE INDEX "topic_suggestions_updated_at_idx" ON "payload"."topic_suggestions" USING btree ("updated_at");
  CREATE INDEX "topic_suggestions_created_at_idx" ON "payload"."topic_suggestions" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_publications_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("publications_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_video_themes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("video_themes_id");
  CREATE INDEX "payload_locked_documents_rels_coaching_bookings_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("coaching_bookings_id");
  CREATE INDEX "payload_locked_documents_rels_appointments_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("appointments_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_locked_documents_rels_topic_suggestions_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("topic_suggestions_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_hero_cards_order_idx" ON "payload"."home_hero_cards" USING btree ("_order");
  CREATE INDEX "home_hero_cards_parent_id_idx" ON "payload"."home_hero_cards" USING btree ("_parent_id");
  CREATE INDEX "home_hero_cards_image_idx" ON "payload"."home_hero_cards" USING btree ("image_id");
  CREATE INDEX "home_stats_order_idx" ON "payload"."home_stats" USING btree ("_order");
  CREATE INDEX "home_stats_parent_id_idx" ON "payload"."home_stats" USING btree ("_parent_id");
  CREATE INDEX "home_rels_order_idx" ON "payload"."home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "payload"."home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "payload"."home_rels" USING btree ("path");
  CREATE INDEX "home_rels_media_id_idx" ON "payload"."home_rels" USING btree ("media_id");
  CREATE INDEX "youtube_page_editorial_line_order_idx" ON "payload"."youtube_page_editorial_line" USING btree ("_order");
  CREATE INDEX "youtube_page_editorial_line_parent_id_idx" ON "payload"."youtube_page_editorial_line" USING btree ("_parent_id");
  CREATE INDEX "youtube_page_community_topics_order_idx" ON "payload"."youtube_page_community_topics" USING btree ("_order");
  CREATE INDEX "youtube_page_community_topics_parent_id_idx" ON "payload"."youtube_page_community_topics" USING btree ("_parent_id");
  CREATE INDEX "about_collaborators_order_idx" ON "payload"."about_collaborators" USING btree ("_order");
  CREATE INDEX "about_collaborators_parent_id_idx" ON "payload"."about_collaborators" USING btree ("_parent_id");
  CREATE INDEX "about_collaborators_photo_idx" ON "payload"."about_collaborators" USING btree ("photo_id");
  CREATE INDEX "about_partners_order_idx" ON "payload"."about_partners" USING btree ("_order");
  CREATE INDEX "about_partners_parent_id_idx" ON "payload"."about_partners" USING btree ("_parent_id");
  CREATE INDEX "about_partners_logo_idx" ON "payload"."about_partners" USING btree ("logo_id");
  CREATE INDEX "about_founder_founder_photo_idx" ON "payload"."about" USING btree ("founder_photo_id");
  CREATE INDEX "book_editions_links_order_idx" ON "payload"."book_editions_links" USING btree ("_order");
  CREATE INDEX "book_editions_links_parent_id_idx" ON "payload"."book_editions_links" USING btree ("_parent_id");
  CREATE INDEX "book_editions_order_idx" ON "payload"."book_editions" USING btree ("_order");
  CREATE INDEX "book_editions_parent_id_idx" ON "payload"."book_editions" USING btree ("_parent_id");
  CREATE INDEX "book_editions_cover_idx" ON "payload"."book_editions" USING btree ("cover_id");
  CREATE INDEX "book_excerpts_order_idx" ON "payload"."book_excerpts" USING btree ("_order");
  CREATE INDEX "book_excerpts_parent_id_idx" ON "payload"."book_excerpts" USING btree ("_parent_id");
  CREATE INDEX "book_excerpts_image_idx" ON "payload"."book_excerpts" USING btree ("image_id");
  CREATE INDEX "book_cover_idx" ON "payload"."book" USING btree ("cover_id");
  CREATE INDEX "coaching_objectives_order_idx" ON "payload"."coaching_objectives" USING btree ("_order");
  CREATE INDEX "coaching_objectives_parent_id_idx" ON "payload"."coaching_objectives" USING btree ("_parent_id");
  CREATE INDEX "coaching_modalities_order_idx" ON "payload"."coaching_modalities" USING btree ("_order");
  CREATE INDEX "coaching_modalities_parent_id_idx" ON "payload"."coaching_modalities" USING btree ("_parent_id");
  CREATE INDEX "coaching_months_order_idx" ON "payload"."coaching_months" USING btree ("_order");
  CREATE INDEX "coaching_months_parent_id_idx" ON "payload"."coaching_months" USING btree ("_parent_id");
  CREATE INDEX "appointment_settings_weekdays_order_idx" ON "payload"."appointment_settings_weekdays" USING btree ("order");
  CREATE INDEX "appointment_settings_weekdays_parent_idx" ON "payload"."appointment_settings_weekdays" USING btree ("parent_id");
  CREATE INDEX "appointment_settings_slots_order_idx" ON "payload"."appointment_settings_slots" USING btree ("_order");
  CREATE INDEX "appointment_settings_slots_parent_id_idx" ON "payload"."appointment_settings_slots" USING btree ("_parent_id");
  CREATE INDEX "appointment_settings_blocked_dates_order_idx" ON "payload"."appointment_settings_blocked_dates" USING btree ("_order");
  CREATE INDEX "appointment_settings_blocked_dates_parent_id_idx" ON "payload"."appointment_settings_blocked_dates" USING btree ("_parent_id");
  CREATE INDEX "site_settings_socials_order_idx" ON "payload"."site_settings_socials" USING btree ("_order");
  CREATE INDEX "site_settings_socials_parent_id_idx" ON "payload"."site_settings_socials" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."news" CASCADE;
  DROP TABLE "payload"."projects_gallery" CASCADE;
  DROP TABLE "payload"."projects" CASCADE;
  DROP TABLE "payload"."publications" CASCADE;
  DROP TABLE "payload"."events" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."videos" CASCADE;
  DROP TABLE "payload"."videos_rels" CASCADE;
  DROP TABLE "payload"."video_themes" CASCADE;
  DROP TABLE "payload"."coaching_bookings" CASCADE;
  DROP TABLE "payload"."appointments" CASCADE;
  DROP TABLE "payload"."contact_messages" CASCADE;
  DROP TABLE "payload"."topic_suggestions" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."home_hero_cards" CASCADE;
  DROP TABLE "payload"."home_stats" CASCADE;
  DROP TABLE "payload"."home" CASCADE;
  DROP TABLE "payload"."home_rels" CASCADE;
  DROP TABLE "payload"."youtube_page_editorial_line" CASCADE;
  DROP TABLE "payload"."youtube_page_community_topics" CASCADE;
  DROP TABLE "payload"."youtube_page" CASCADE;
  DROP TABLE "payload"."about_collaborators" CASCADE;
  DROP TABLE "payload"."about_partners" CASCADE;
  DROP TABLE "payload"."about" CASCADE;
  DROP TABLE "payload"."book_editions_links" CASCADE;
  DROP TABLE "payload"."book_editions" CASCADE;
  DROP TABLE "payload"."book_excerpts" CASCADE;
  DROP TABLE "payload"."book" CASCADE;
  DROP TABLE "payload"."coaching_objectives" CASCADE;
  DROP TABLE "payload"."coaching_modalities" CASCADE;
  DROP TABLE "payload"."coaching_months" CASCADE;
  DROP TABLE "payload"."coaching" CASCADE;
  DROP TABLE "payload"."appointment_settings_weekdays" CASCADE;
  DROP TABLE "payload"."appointment_settings_slots" CASCADE;
  DROP TABLE "payload"."appointment_settings_blocked_dates" CASCADE;
  DROP TABLE "payload"."appointment_settings" CASCADE;
  DROP TABLE "payload"."site_settings_socials" CASCADE;
  DROP TABLE "payload"."site_settings" CASCADE;
  DROP TYPE "payload"."enum_news_type";
  DROP TYPE "payload"."enum_projects_gallery_kind";
  DROP TYPE "payload"."enum_projects_country";
  DROP TYPE "payload"."enum_projects_status";
  DROP TYPE "payload"."enum_publications_type";
  DROP TYPE "payload"."enum_events_type";
  DROP TYPE "payload"."enum_events_status";
  DROP TYPE "payload"."enum_coaching_bookings_profile";
  DROP TYPE "payload"."enum_coaching_bookings_status";
  DROP TYPE "payload"."enum_appointments_mode";
  DROP TYPE "payload"."enum_appointments_project_type";
  DROP TYPE "payload"."enum_appointments_status";
  DROP TYPE "payload"."enum_contact_messages_reason";
  DROP TYPE "payload"."enum_contact_messages_status";
  DROP TYPE "payload"."enum_topic_suggestions_status";
  DROP TYPE "payload"."enum_appointment_settings_weekdays";
  DROP TYPE "payload"."enum_site_settings_socials_platform";`)
}
