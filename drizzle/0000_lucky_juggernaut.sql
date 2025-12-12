CREATE TABLE "account_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_owner_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL,
	"status" varchar DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_event_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"user_id" varchar,
	"type" varchar NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alertas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tipo_alerta" varchar NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descricao" text,
	"prioridade" varchar DEFAULT 'media' NOT NULL,
	"lido" varchar DEFAULT 'nao' NOT NULL,
	"data_expiracao" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cartao_transacoes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fatura_id" varchar NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"data_compra" date NOT NULL,
	"categoria" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cartoes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"nome_cartao" varchar NOT NULL,
	"limite_total" numeric(10, 2) NOT NULL,
	"limite_usado" numeric(10, 2) DEFAULT '0' NOT NULL,
	"dia_fechamento" integer NOT NULL,
	"dia_vencimento" integer NOT NULL,
	"bandeira" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categorias_customizadas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"nome" varchar(50) NOT NULL,
	"emoji" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_logs" (
	"id" varchar(191) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(191),
	"event_type" varchar(200) NOT NULL,
	"message" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"nome_conta" varchar NOT NULL,
	"tipo_conta" varchar NOT NULL,
	"saldo_atual" numeric(10, 2) DEFAULT '0' NOT NULL,
	"banco" varchar,
	"cor_identificacao" varchar DEFAULT '#10B981',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"titulo" varchar NOT NULL,
	"descricao" text,
	"data" date NOT NULL,
	"hora" varchar,
	"lembrete_minutos" integer,
	"origem" varchar DEFAULT 'manual' NOT NULL,
	"whatsapp_message_id" varchar,
	"notificado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "faturas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cartao_id" varchar NOT NULL,
	"mes" integer NOT NULL,
	"ano" integer NOT NULL,
	"valor_fechado" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" varchar DEFAULT 'aberta' NOT NULL,
	"data_fechamento" date,
	"data_pagamento" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"nome" varchar NOT NULL,
	"descricao" text,
	"valor_alvo" numeric(10, 2) NOT NULL,
	"valor_atual" numeric(10, 2) DEFAULT '0' NOT NULL,
	"data_inicio" date NOT NULL,
	"data_fim" date,
	"prioridade" varchar DEFAULT 'media' NOT NULL,
	"status" varchar DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tipo_insight" varchar NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descricao" text NOT NULL,
	"valor_impacto" numeric(10, 2),
	"percentual_impacto" numeric(5, 2),
	"acao_sugerida" text,
	"data_geracao" timestamp DEFAULT now(),
	"data_expiracao" timestamp,
	"relevancia" varchar DEFAULT 'media' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investimentos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"nome_investimento" varchar NOT NULL,
	"tipo_investimento" varchar NOT NULL,
	"valor_aplicado" numeric(10, 2) NOT NULL,
	"valor_atual" numeric(10, 2) NOT NULL,
	"rentabilidade" numeric(5, 2) DEFAULT '0' NOT NULL,
	"data_aplicacao" date NOT NULL,
	"instituicao" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "latency_alerts" (
	"id" varchar(191) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"severity" varchar NOT NULL,
	"message" text NOT NULL,
	"total_latency_ms" integer NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monthly_savings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"saved_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "monthly_savings_user_id_year_month_unique" UNIQUE("user_id","year","month")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"alertas_orcamento" varchar DEFAULT 'ativo' NOT NULL,
	"vencimento_cartoes" varchar DEFAULT 'ativo' NOT NULL,
	"insights_semanais" varchar DEFAULT 'inativo' NOT NULL,
	"metas_atingidas" varchar DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY NOT NULL,
	"subscription_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar NOT NULL,
	"paid_at" timestamp,
	"due_date" timestamp,
	"payment_method" varchar,
	"installments" integer,
	"card_brand" varchar,
	"card_last_digits" varchar,
	"boleto_barcode" text,
	"pix_qr_code" text,
	"picpay_qr_code" text,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"telefone" varchar,
	"status" varchar NOT NULL,
	"purchase_id" varchar NOT NULL,
	"product_name" varchar,
	"amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "purchases_purchase_id_unique" UNIQUE("purchase_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spending_limits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tipo" varchar NOT NULL,
	"categoria" varchar,
	"valor_limite" numeric(10, 2) NOT NULL,
	"mes" integer,
	"ano" integer,
	"ativo" varchar DEFAULT 'sim' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" varchar,
	"client_id" varchar,
	"type" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"severity" varchar DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"payload" jsonb NOT NULL,
	"origin" varchar DEFAULT 'webhook' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"provider_subscription_id" varchar NOT NULL,
	"plan_name" varchar NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" varchar DEFAULT 'BRL' NOT NULL,
	"billing_interval" varchar NOT NULL,
	"interval" varchar DEFAULT 'monthly' NOT NULL,
	"status" varchar NOT NULL,
	"trial_ends_at" timestamp,
	"current_period_end" timestamp,
	"cancel_at" timestamp,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" varchar NOT NULL,
	"source" varchar NOT NULL,
	"message" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transacoes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tipo" varchar NOT NULL,
	"categoria" varchar NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"data_registro" timestamp DEFAULT now(),
	"data_real" date NOT NULL,
	"origem" varchar NOT NULL,
	"descricao" text,
	"media_url" varchar,
	"cartao_id" varchar,
	"goal_id" varchar,
	"status" varchar DEFAULT 'paid' NOT NULL,
	"pending_kind" varchar,
	"payment_method" varchar DEFAULT 'other' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"telefone" varchar,
	"plano" varchar DEFAULT 'free',
	"status" varchar DEFAULT 'awaiting_email',
	"role" varchar DEFAULT 'user' NOT NULL,
	"whatsapp_number" varchar,
	"plan_label" varchar,
	"billing_status" varchar DEFAULT 'none' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_telefone_unique" UNIQUE("telefone")
);
--> statement-breakpoint
CREATE TABLE "webhook_event_headers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_event_id" varchar NOT NULL,
	"headers" jsonb NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp,
	"processed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_event_id" varchar NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"step" text NOT NULL,
	"payload" jsonb,
	"error" text,
	"level" varchar DEFAULT 'info' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_processed_events" (
	"event_id" varchar PRIMARY KEY NOT NULL,
	"event_type" varchar NOT NULL,
	"webhook_event_id" varchar NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_latency" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_id" varchar(191),
	"wa_message_id" varchar(191),
	"response_message_id" varchar(191),
	"from_number" varchar(191),
	"message_type" varchar(50),
	"received_at" timestamp,
	"provider_received_at" timestamp,
	"processed_at" timestamp,
	"response_queued_at" timestamp,
	"provider_sent_at" timestamp,
	"provider_delivered_at" timestamp,
	"replied_to_client_at" timestamp,
	"bot_latency_ms" integer,
	"network_latency_ms" integer,
	"total_latency_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" varchar NOT NULL,
	"user_id" varchar,
	"email" varchar,
	"status" varchar DEFAULT 'awaiting_email' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_sessions_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_account_owner_id_users_id_fk" FOREIGN KEY ("account_owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_event_logs" ADD CONSTRAINT "admin_event_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_event_logs" ADD CONSTRAINT "admin_event_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cartao_transacoes" ADD CONSTRAINT "cartao_transacoes_fatura_id_faturas_id_fk" FOREIGN KEY ("fatura_id") REFERENCES "public"."faturas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cartoes" ADD CONSTRAINT "cartoes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorias_customizadas" ADD CONSTRAINT "categorias_customizadas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_logs" ADD CONSTRAINT "client_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contas" ADD CONSTRAINT "contas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_cartao_id_cartoes_id_fk" FOREIGN KEY ("cartao_id") REFERENCES "public"."cartoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investimentos" ADD CONSTRAINT "investimentos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_savings" ADD CONSTRAINT "monthly_savings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_limits" ADD CONSTRAINT "spending_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_cartao_id_cartoes_id_fk" FOREIGN KEY ("cartao_id") REFERENCES "public"."cartoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_event_headers" ADD CONSTRAINT "webhook_event_headers_webhook_event_id_webhook_events_id_fk" FOREIGN KEY ("webhook_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhook_event_id_webhook_events_id_fk" FOREIGN KEY ("webhook_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_processed_events" ADD CONSTRAINT "webhook_processed_events_webhook_event_id_webhook_events_id_fk" FOREIGN KEY ("webhook_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_latency" ADD CONSTRAINT "whatsapp_latency_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_eventos_user_id" ON "eventos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_eventos_data" ON "eventos" USING btree ("data");--> statement-breakpoint
CREATE INDEX "IDX_eventos_notificado" ON "eventos" USING btree ("notificado");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "IDX_subscription_events_subscription_id" ON "subscription_events" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "IDX_subscription_events_client_id" ON "subscription_events" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "IDX_subscription_events_type" ON "subscription_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "IDX_subscription_events_created_at" ON "subscription_events" USING btree ("created_at");