CREATE TABLE "company_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"raw_record_id" uuid,
	"nome_socio" text NOT NULL,
	"documento_socio" text,
	"qualificacao" text,
	"faixa_etaria" text,
	"data_entrada" date,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_partners" ADD CONSTRAINT "company_partners_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_partners" ADD CONSTRAINT "company_partners_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_partners" ADD CONSTRAINT "company_partners_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_partners_entity_idx" ON "company_partners" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "company_partners_nome_idx" ON "company_partners" USING btree ("nome_socio");