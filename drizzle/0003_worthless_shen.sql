ALTER TABLE "etl_document_extractions" DROP CONSTRAINT "etl_document_extractions_document_id_etl_document_id_fk";
--> statement-breakpoint
ALTER TABLE "etl_document_extractions" ADD CONSTRAINT "etl_document_extractions_document_id_etl_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."etl_document"("id") ON DELETE cascade ON UPDATE no action;