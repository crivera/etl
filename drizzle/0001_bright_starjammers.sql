CREATE TYPE "public"."file_type" AS ENUM('docx', 'xlsx', 'pdf');--> statement-breakpoint
CREATE TABLE "etl_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"fields" jsonb NOT NULL,
	"user_id" text,
	"path" text NOT NULL,
	"file_name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"file_type" "file_type" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "etl_templates" ADD CONSTRAINT "etl_templates_user_id_etl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."etl_user"("id") ON DELETE no action ON UPDATE no action;