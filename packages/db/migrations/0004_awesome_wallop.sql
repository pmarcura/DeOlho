CREATE TYPE "public"."civic_event_category" AS ENUM('contratacao', 'pagamento', 'receita', 'obra_zeladoria', 'ato_normativo', 'nomeacao_exoneracao', 'proposta_legislativa', 'indicacao_requerimento', 'sancao', 'audiencia_conselho', 'limitacao_fonte', 'relacionamento');--> statement-breakpoint
CREATE TYPE "public"."civic_event_type" AS ENUM('licitacao_publicada', 'contrato_publicado', 'contrato_atualizado', 'pagamento_registrado', 'receita_registrada', 'ato_publicado', 'proposta_legislativa', 'indicacao_zeladoria', 'sancao_registrada', 'relacionamento_documentado', 'limitacao_detectada', 'revisao_aplicada');--> statement-breakpoint
CREATE TYPE "public"."money_flow_type" AS ENUM('previsto', 'contratado', 'empenhado', 'liquidado', 'pago', 'anulado', 'reforcado', 'aditado', 'receita_arrecadada');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('socio_oficial', 'administrador_oficial', 'fornecedor', 'orgao_responsavel', 'doacao_eleitoral_oficial', 'sancao_oficial', 'mencao_documentada', 'representante_legal');--> statement-breakpoint
CREATE TYPE "public"."source_coverage_status" AS ENUM('fresh', 'partial', 'no_data', 'unavailable', 'error', 'pending');--> statement-breakpoint
CREATE TABLE "civic_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"source_key" text NOT NULL,
	"raw_record_id" uuid,
	"tipo" "civic_event_type" NOT NULL,
	"categoria" "civic_event_category" NOT NULL,
	"titulo" text NOT NULL,
	"resumo" text,
	"data_evento" date,
	"valor" numeric(18, 2),
	"moeda" text DEFAULT 'BRL' NOT NULL,
	"municipio_ibge" text,
	"uf" text,
	"territorio" jsonb,
	"entidades" jsonb,
	"limitacoes" jsonb,
	"source_url" text,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"search_document" "tsvector" GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(resumo, ''))) STORED,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_key" text NOT NULL,
	"civic_event_id" uuid,
	"raw_record_id" uuid,
	"source_id" text NOT NULL,
	"source_key" text,
	"field_path" text,
	"titulo" text NOT NULL,
	"source_url" text,
	"trecho" text,
	"pagina" integer,
	"posicao_inicio" integer,
	"posicao_fim" integer,
	"metodo_extracao" text NOT NULL,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_key" text NOT NULL,
	"from_entity_id" uuid NOT NULL,
	"to_entity_id" uuid NOT NULL,
	"tipo" "relationship_type" NOT NULL,
	"source_id" text NOT NULL,
	"source_key" text,
	"raw_record_id" uuid,
	"civic_event_id" uuid,
	"evidence_id" uuid,
	"descricao" text,
	"confianca" numeric(4, 3) DEFAULT '1.000' NOT NULL,
	"data_inicio" date,
	"data_fim" date,
	"metadata" jsonb,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "money_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flow_key" text NOT NULL,
	"source_id" text NOT NULL,
	"source_key" text NOT NULL,
	"raw_record_id" uuid,
	"civic_event_id" uuid,
	"contract_id" uuid,
	"orgao_entity_id" uuid,
	"counterparty_entity_id" uuid,
	"tipo" "money_flow_type" NOT NULL,
	"valor" numeric(18, 2) NOT NULL,
	"moeda" text DEFAULT 'BRL' NOT NULL,
	"data_competencia" date,
	"data_movimento" date,
	"exercicio" integer,
	"municipio_ibge" text,
	"uf" text,
	"descricao" text,
	"source_url" text,
	"published_at" timestamp with time zone,
	"fetched_at" timestamp with time zone,
	"trust_type" "trust_type" DEFAULT 'fato_oficial' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" text NOT NULL,
	"collector" text NOT NULL,
	"territory_ibge" text,
	"uf" text,
	"record_type" text NOT NULL,
	"status" "source_coverage_status" NOT NULL,
	"coverage_start" date,
	"coverage_end" date,
	"last_attempt_at" timestamp with time zone NOT NULL,
	"last_success_at" timestamp with time zone,
	"total_records" integer,
	"error_message" text,
	"limitations" text,
	"metadata" jsonb,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "civic_events" ADD CONSTRAINT "civic_events_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "civic_events" ADD CONSTRAINT "civic_events_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_civic_event_id_civic_events_id_fk" FOREIGN KEY ("civic_event_id") REFERENCES "public"."civic_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_from_entity_id_entities_id_fk" FOREIGN KEY ("from_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_to_entity_id_entities_id_fk" FOREIGN KEY ("to_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_civic_event_id_civic_events_id_fk" FOREIGN KEY ("civic_event_id") REFERENCES "public"."civic_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_flows" ADD CONSTRAINT "money_flows_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_flows" ADD CONSTRAINT "money_flows_raw_record_id_raw_records_id_fk" FOREIGN KEY ("raw_record_id") REFERENCES "public"."raw_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_flows" ADD CONSTRAINT "money_flows_civic_event_id_civic_events_id_fk" FOREIGN KEY ("civic_event_id") REFERENCES "public"."civic_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_flows" ADD CONSTRAINT "money_flows_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_flows" ADD CONSTRAINT "money_flows_orgao_entity_id_entities_id_fk" FOREIGN KEY ("orgao_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_flows" ADD CONSTRAINT "money_flows_counterparty_entity_id_entities_id_fk" FOREIGN KEY ("counterparty_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_coverage" ADD CONSTRAINT "source_coverage_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "civic_events_source_tipo_idx" ON "civic_events" USING btree ("source_id","source_key","tipo");--> statement-breakpoint
CREATE INDEX "civic_events_category_idx" ON "civic_events" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "civic_events_source_idx" ON "civic_events" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE INDEX "civic_events_municipio_idx" ON "civic_events" USING btree ("municipio_ibge");--> statement-breakpoint
CREATE INDEX "civic_events_data_idx" ON "civic_events" USING btree ("data_evento");--> statement-breakpoint
CREATE INDEX "civic_events_search_idx" ON "civic_events" USING gin ("search_document");--> statement-breakpoint
CREATE INDEX "civic_events_titulo_trgm_idx" ON "civic_events" USING gin ("titulo" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_key_idx" ON "evidence" USING btree ("evidence_key");--> statement-breakpoint
CREATE INDEX "evidence_event_idx" ON "evidence" USING btree ("civic_event_id");--> statement-breakpoint
CREATE INDEX "evidence_raw_idx" ON "evidence" USING btree ("raw_record_id");--> statement-breakpoint
CREATE INDEX "evidence_source_idx" ON "evidence" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_relationships_key_idx" ON "entity_relationships" USING btree ("relationship_key");--> statement-breakpoint
CREATE INDEX "entity_relationships_from_idx" ON "entity_relationships" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "entity_relationships_to_idx" ON "entity_relationships" USING btree ("to_entity_id");--> statement-breakpoint
CREATE INDEX "entity_relationships_source_idx" ON "entity_relationships" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE INDEX "entity_relationships_type_idx" ON "entity_relationships" USING btree ("tipo");--> statement-breakpoint
CREATE UNIQUE INDEX "money_flows_key_idx" ON "money_flows" USING btree ("flow_key");--> statement-breakpoint
CREATE INDEX "money_flows_source_idx" ON "money_flows" USING btree ("source_id","source_key");--> statement-breakpoint
CREATE INDEX "money_flows_type_idx" ON "money_flows" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "money_flows_contract_idx" ON "money_flows" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "money_flows_orgao_idx" ON "money_flows" USING btree ("orgao_entity_id");--> statement-breakpoint
CREATE INDEX "money_flows_counterparty_idx" ON "money_flows" USING btree ("counterparty_entity_id");--> statement-breakpoint
CREATE INDEX "money_flows_municipio_idx" ON "money_flows" USING btree ("municipio_ibge");--> statement-breakpoint
CREATE UNIQUE INDEX "source_coverage_unique_idx" ON "source_coverage" USING btree ("source_id","collector","territory_ibge","record_type");--> statement-breakpoint
CREATE INDEX "source_coverage_source_idx" ON "source_coverage" USING btree ("source_id","status");--> statement-breakpoint
CREATE INDEX "source_coverage_territory_idx" ON "source_coverage" USING btree ("territory_ibge");