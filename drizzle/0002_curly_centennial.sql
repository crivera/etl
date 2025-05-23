ALTER TABLE "etl_field_groups" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "etl_templates" ALTER COLUMN "fields" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "etl_templates" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "etl_templates" ALTER COLUMN "path" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "etl_templates" ALTER COLUMN "file_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "etl_templates" ALTER COLUMN "type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "etl_templates" ALTER COLUMN "size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "etl_document" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "etl_templates" DROP COLUMN "metadata";