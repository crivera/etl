CREATE TYPE "public"."file_type" AS ENUM('docx', 'xlsx', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('FILE', 'FOLDER');--> statement-breakpoint
CREATE TABLE "etl_document_collection" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"fields" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etl_document_extractions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"document_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"fields" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etl_document" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" text,
	"item_type" "item_type" DEFAULT 'FILE' NOT NULL,
	"path" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"status" integer,
	"extracted_text" jsonb,
	"collection_id" text
);
--> statement-breakpoint
CREATE TABLE "etl_field_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"fields" jsonb NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etl_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"file_type" "file_type" NOT NULL,
	"user_id" text NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"path" text,
	"file_name" text,
	"type" text,
	"size" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "etl_user" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" integer DEFAULT 3 NOT NULL,
	"external_id" text NOT NULL,
	CONSTRAINT "etl_user_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "etl_document_collection" ADD CONSTRAINT "etl_document_collection_user_id_etl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."etl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etl_document_extractions" ADD CONSTRAINT "etl_document_extractions_document_id_etl_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."etl_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etl_document" ADD CONSTRAINT "etl_document_user_id_etl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."etl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etl_document" ADD CONSTRAINT "etl_document_parent_id_etl_document_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."etl_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etl_document" ADD CONSTRAINT "etl_document_collection_id_etl_document_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."etl_document_collection"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etl_field_groups" ADD CONSTRAINT "etl_field_groups_user_id_etl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."etl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etl_templates" ADD CONSTRAINT "etl_templates_user_id_etl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."etl_user"("id") ON DELETE no action ON UPDATE no action;