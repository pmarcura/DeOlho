CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "unaccent";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
CREATE TYPE "public"."contract_event_type" AS ENUM('publicacao', 'assinatura', 'aditivo', 'pagamento', 'alteracao', 'rescisao');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('cnpj', 'cpf');--> statement-breakpoint
CREATE TYPE "public"."entity_kind" AS ENUM('empresa', 'orgao', 'unidade_orgao', 'pessoa_publica');--> statement-breakpoint
CREATE TYPE "public"."trust_type" AS ENUM('fato_oficial', 'explicacao', 'sinal_atencao', 'noticia', 'opiniao');--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"base_url" text,
	"licenca" text,
	"termos_url" text,
	"cobertura" text,
	"limitacoes" text,
	"default_trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source_key" text NOT NULL,
	"record_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"source_url" text,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone NOT NULL,
	"source_version" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "entity_kind" NOT NULL,
	"nome" text NOT NULL,
	"documento" text,
	"documento_kind" "document_kind",
	"uf" text,
	"municipio_ibge" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"source_key" text,
	"raw_nome" text NOT NULL,
	"raw_documento" text,
	"confianca" numeric(4, 3),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"tipo" "contract_event_type" NOT NULL,
	"data" date NOT NULL,
	"descricao" text,
	"valor_delta" numeric(18, 2),
	"raw_record_id" uuid,
	"source_url" text,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source_key" text NOT NULL,
	"raw_record_id" uuid,
	"numero" text,
	"ano" integer,
	"objeto" text NOT NULL,
	"valor_inicial" numeric(18, 2),
	"valor_global" numeric(18, 2),
	"moeda" text DEFAULT 'BRL' NOT NULL,
	"data_assinatura" date,
	"data_vigencia_inicio" date,
	"data_vigencia_fim" date,
	"situacao" text,
	"orgao_entity_id" uuid,
	"fornecedor_entity_id" uuid,
	"municipio_ibge" text,
	"uf" text,
	"source_url" text,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"search_document" "tsvector" GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(objeto, '') || ' ' || coalesce(numero, ''))) STORED,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "raw_records" ADD CONSTRAINT "raw_records_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_references" ADD CONSTRAINT "entity_references_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_references" ADD CONSTRAINT "entity_references_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_orgao_entity_id_entities_id_fk" FOREIGN KEY ("orgao_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_fornecedor_entity_id_entities_id_fk" FOREIGN KEY ("fornecedor_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "raw_records_dedup_idx" ON "raw_records" USING btree ("source_id","source_key","content_hash");--> statement-breakpoint
CREATE INDEX "raw_records_history_idx" ON "raw_records" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE INDEX "raw_records_type_idx" ON "raw_records" USING btree ("record_type");--> statement-breakpoint
CREATE UNIQUE INDEX "entities_documento_idx" ON "entities" USING btree ("kind","documento") WHERE "entities"."documento" is not null;--> statement-breakpoint
CREATE INDEX "entities_nome_trgm_idx" ON "entities" USING gin ("nome" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "entity_references_entity_idx" ON "entity_references" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "entity_references_source_idx" ON "entity_references" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE INDEX "contract_events_contract_idx" ON "contract_events" USING btree ("contract_id","data");--> statement-breakpoint
CREATE INDEX "contracts_source_idx" ON "contracts" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE INDEX "contracts_orgao_idx" ON "contracts" USING btree ("orgao_entity_id");--> statement-breakpoint
CREATE INDEX "contracts_fornecedor_idx" ON "contracts" USING btree ("fornecedor_entity_id");--> statement-breakpoint
CREATE INDEX "contracts_municipio_idx" ON "contracts" USING btree ("municipio_ibge");--> statement-breakpoint
CREATE INDEX "contracts_search_idx" ON "contracts" USING gin ("search_document");--> statement-breakpoint
CREATE INDEX "contracts_objeto_trgm_idx" ON "contracts" USING gin ("objeto" gin_trgm_ops);