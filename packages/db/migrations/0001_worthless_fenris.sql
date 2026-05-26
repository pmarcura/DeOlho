CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source_key" text NOT NULL,
	"raw_record_id" uuid,
	"credor_entity_id" uuid,
	"orgao_entity_id" uuid,
	"contract_id" uuid,
	"numero_empenho" text,
	"exercicio" integer,
	"valor_empenhado" numeric(18, 2),
	"valor_liquidado" numeric(18, 2),
	"valor_pago" numeric(18, 2),
	"moeda" text DEFAULT 'BRL' NOT NULL,
	"data" date,
	"descricao" text,
	"municipio_ibge" text,
	"uf" text,
	"source_url" text,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gazette_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gazette_id" uuid NOT NULL,
	"entity_id" uuid,
	"contract_id" uuid,
	"trecho" text,
	"raw_documento" text,
	"raw_numero_contrato" text,
	"confianca" numeric(4, 3),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gazettes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source_key" text NOT NULL,
	"raw_record_id" uuid,
	"territory_ibge" text,
	"uf" text,
	"date" date,
	"edition" text,
	"is_extra_edition" boolean,
	"url" text,
	"txt_url" text,
	"source_url" text,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_credor_entity_id_entities_id_fk" FOREIGN KEY ("credor_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_orgao_entity_id_entities_id_fk" FOREIGN KEY ("orgao_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gazette_mentions" ADD CONSTRAINT "gazette_mentions_gazette_id_gazettes_id_fk" FOREIGN KEY ("gazette_id") REFERENCES "public"."gazettes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gazette_mentions" ADD CONSTRAINT "gazette_mentions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gazette_mentions" ADD CONSTRAINT "gazette_mentions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gazettes" ADD CONSTRAINT "gazettes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gazettes" ADD CONSTRAINT "gazettes_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_source_idx" ON "payments" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE INDEX "payments_credor_idx" ON "payments" USING btree ("credor_entity_id");--> statement-breakpoint
CREATE INDEX "payments_orgao_idx" ON "payments" USING btree ("orgao_entity_id");--> statement-breakpoint
CREATE INDEX "payments_contract_idx" ON "payments" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "payments_municipio_idx" ON "payments" USING btree ("municipio_ibge");--> statement-breakpoint
CREATE INDEX "gazette_mentions_gazette_idx" ON "gazette_mentions" USING btree ("gazette_id");--> statement-breakpoint
CREATE INDEX "gazette_mentions_entity_idx" ON "gazette_mentions" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "gazette_mentions_contract_idx" ON "gazette_mentions" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gazettes_source_key_idx" ON "gazettes" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE INDEX "gazettes_date_idx" ON "gazettes" USING btree ("territory_ibge","date");