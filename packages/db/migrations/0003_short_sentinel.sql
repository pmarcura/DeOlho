CREATE TABLE "sanctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid,
	"source_id" text NOT NULL,
	"raw_record_id" uuid,
	"cadastro" text NOT NULL,
	"documento" text,
	"nome_sancionado" text,
	"tipo_sancao" text,
	"orgao_sancionador" text,
	"data_inicio" date,
	"data_fim" date,
	"fundamentacao" text,
	"source_url" text,
	"fetched_at" timestamp with time zone,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sanctions_entity_idx" ON "sanctions" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "sanctions_documento_idx" ON "sanctions" USING btree ("documento");