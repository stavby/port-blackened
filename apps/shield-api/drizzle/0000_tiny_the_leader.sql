CREATE TYPE "public"."operation_enum" AS ENUM('create', 'update', 'delete', 'clone');--> statement-breakpoint
CREATE TYPE "public"."resource_type_enum" AS ENUM('application_user', 'classification', 'domain', 'permission_table', 'table', 'task', 'user', 'permission_group');--> statement-breakpoint
CREATE TYPE "public"."permission_table_row_filter_query_builder_type" AS ENUM('select', 'tree', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."permission_table_row_filter_type" AS ENUM('integer', 'string', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."verification_stage_name" AS ENUM('technical_correctness', 'business_correctness', 'documentation_correctness');--> statement-breakpoint
CREATE TABLE "application_user_domain_classifications" (
	"application_user_domain_id" uuid NOT NULL,
	"classification_id" text NOT NULL,
	CONSTRAINT "app_usr_dom_cls_pk" PRIMARY KEY("application_user_domain_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE "application_user_domain_roles" (
	"application_user_domain_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "app_usr_dom_role_pk" PRIMARY KEY("application_user_domain_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "application_user_domains" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"application_user_id" text NOT NULL,
	"domain_id" text NOT NULL,
	CONSTRAINT "app_usr_dom_pk" PRIMARY KEY("id"),
	CONSTRAINT "app_usr_dom_uq" UNIQUE("application_user_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "application_users" (
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"is_admin" boolean NOT NULL,
	"can_create_connections" boolean NOT NULL,
	"can_manage_unique_population_indications" boolean NOT NULL,
	"given_by" text,
	"created_at" timestamp,
	"last_updated_by" text,
	"updated_at" timestamp,
	CONSTRAINT "app_usr_pk" PRIMARY KEY("user_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log_changes" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"audit_log_id" uuid NOT NULL,
	"difference" jsonb NOT NULL,
	CONSTRAINT "aud_log_chg_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"operation" "operation_enum" NOT NULL,
	"resource_type" "resource_type_enum" NOT NULL,
	"resource_id" uuid NOT NULL,
	"time" timestamp NOT NULL,
	"version" integer NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "aud_log_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "auditing" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"operation" "operation_enum" NOT NULL,
	"resource" "resource_type_enum" NOT NULL,
	"status" text NOT NULL,
	"resource_info" jsonb NOT NULL,
	"message" text NOT NULL,
	"difference" jsonb NOT NULL,
	"time" text NOT NULL,
	CONSTRAINT "aud_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "classifications" (
	"id" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "cls_pk" PRIMARY KEY("id"),
	CONSTRAINT "classifications_display_name_unique" UNIQUE("display_name")
);
--> statement-breakpoint
CREATE TABLE "domain_classifications" (
	"domain_id" text NOT NULL,
	"classification_id" text NOT NULL,
	CONSTRAINT "dom_cls_pk" PRIMARY KEY("domain_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "dom_pk" PRIMARY KEY("id"),
	CONSTRAINT "domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permission_group_co_owners" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	CONSTRAINT "perm_grp_co_pk" PRIMARY KEY("id"),
	CONSTRAINT "perm_grp_co_uq" UNIQUE("permission_group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "permission_group_domain_classifications" (
	"permission_group_domain_id" uuid NOT NULL,
	"classification_id" text NOT NULL,
	CONSTRAINT "perm_grp_dom_cls_pk" PRIMARY KEY("permission_group_domain_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE "permission_group_domains" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_group_id" text NOT NULL,
	"domain_id" text NOT NULL,
	"given_by" text,
	"created_at" timestamp,
	"last_updated_by" text,
	"updated_at" timestamp,
	CONSTRAINT "perm_grp_dom_pk" PRIMARY KEY("id"),
	CONSTRAINT "perm_grp_dom_uq" UNIQUE("permission_group_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "permission_group_row_filter_values" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_group_id" text NOT NULL,
	"permission_table_id" text NOT NULL,
	"permission_table_row_filter_id" uuid NOT NULL,
	"value" text NOT NULL,
	"display_name" text NOT NULL,
	"given_by" text,
	"created_at" timestamp,
	"last_updated_by" text,
	"updated_at" timestamp,
	CONSTRAINT "perm_grp_rfv_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "permission_groups" (
	"id" text NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"owner_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"color" text NOT NULL,
	"should_apply_masking" boolean DEFAULT false NOT NULL,
	"can_view_deceased" boolean DEFAULT false NOT NULL,
	CONSTRAINT "perm_grp_pk" PRIMARY KEY("id"),
	CONSTRAINT "permission_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permission_table_keys" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_table_id" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"trino_type" text NOT NULL,
	CONSTRAINT "perm_tbl_key_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "permission_table_row_filters" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_table_id" text NOT NULL,
	"kod" text NOT NULL,
	"display_name" text NOT NULL,
	"dimensions_table" text NOT NULL,
	"data_type" "permission_table_row_filter_type" NOT NULL,
	"ui_control_type" "permission_table_row_filter_query_builder_type" NOT NULL,
	CONSTRAINT "perm_tbl_rf_pk" PRIMARY KEY("id"),
	CONSTRAINT "perm_tbl_rf_id_tbl_uq" UNIQUE("id","permission_table_id"),
	CONSTRAINT "perm_tbl_rf_uq" UNIQUE("permission_table_id","kod")
);
--> statement-breakpoint
CREATE TABLE "permission_tables" (
	"id" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "perm_tbl_pk" PRIMARY KEY("id"),
	CONSTRAINT "permission_tables_name_unique" UNIQUE("name"),
	CONSTRAINT "perm_tbl_name_uq" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"color" text NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "role_pk" PRIMARY KEY("id"),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sap_tables" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"schema_name" text NOT NULL,
	"table_name" text NOT NULL,
	CONSTRAINT "sap_tbl_pk" PRIMARY KEY("id"),
	CONSTRAINT "sap_tbl_sch_tbl_uq" UNIQUE("schema_name","table_name")
);
--> statement-breakpoint
CREATE TABLE "column_masks" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "col_msk_pk" PRIMARY KEY("id"),
	CONSTRAINT "column_masks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "table_co_owners" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"owner_name" text NOT NULL,
	CONSTRAINT "tbl_co_own_pk" PRIMARY KEY("id"),
	CONSTRAINT "tbl_co_own_uq" UNIQUE("table_id","owner_id")
);
--> statement-breakpoint
CREATE TABLE "table_columns" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"column_name" text NOT NULL,
	"data_type" text NOT NULL,
	"column_display_name" text DEFAULT '' NOT NULL,
	"column_desc" text DEFAULT '' NOT NULL,
	"is_key" boolean DEFAULT false NOT NULL,
	"auth_key" text,
	"classification_id" text,
	"mask_id" uuid,
	CONSTRAINT "tbl_col_pk" PRIMARY KEY("id"),
	CONSTRAINT "tbl_col_uq" UNIQUE("table_id","column_name")
);
--> statement-breakpoint
CREATE TABLE "table_verification_stages" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"stage" "verification_stage_name" NOT NULL,
	"is_checked" boolean NOT NULL,
	CONSTRAINT "tbl_vrf_stg_pk" PRIMARY KEY("id"),
	CONSTRAINT "tbl_vrf_stg_uq" UNIQUE("table_id","stage")
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"catalog_name" text NOT NULL,
	"schema_name" text NOT NULL,
	"table_name" text NOT NULL,
	"table_display_name" text DEFAULT '' NOT NULL,
	"table_desc" text DEFAULT '' NOT NULL,
	"domain_id" text NOT NULL,
	"permission_table_id" text,
	"owner_id" text NOT NULL,
	"source_type" text,
	"connection_display_name" text,
	"is_test" boolean DEFAULT false NOT NULL,
	"application" text,
	"query" text,
	"schedule_type" text,
	"process_type" text,
	"schedule" text,
	"last_verification_time" timestamp,
	"is_deprecated" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tbl_pk" PRIMARY KEY("id"),
	CONSTRAINT "tbl_cat_sch_nm_uq" UNIQUE("catalog_name","schema_name","table_name")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"done" boolean NOT NULL,
	"table_id" uuid NOT NULL,
	"create_date" timestamp NOT NULL,
	"modify_date" timestamp NOT NULL,
	"aprroval_date" timestamp,
	"aprroval_id" text,
	CONSTRAINT "task_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "user_catalog_schemas" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_catalog_id" uuid NOT NULL,
	"schema_name" text NOT NULL,
	"write" boolean NOT NULL,
	CONSTRAINT "usr_cat_sch_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_cat_sch_uq" UNIQUE("user_catalog_id","schema_name")
);
--> statement-breakpoint
CREATE TABLE "user_catalogs" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"catalog_name" text NOT NULL,
	"write_all" boolean,
	"read_all" boolean,
	CONSTRAINT "usr_cat_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_cat_uq" UNIQUE("user_id","catalog_name")
);
--> statement-breakpoint
CREATE TABLE "user_domain_classifications" (
	"user_domain_id" uuid NOT NULL,
	"classification_id" text NOT NULL,
	CONSTRAINT "usr_dom_cls_pk" PRIMARY KEY("user_domain_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE "user_domains" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"domain_id" text NOT NULL,
	"given_by" text,
	"created_at" timestamp,
	"last_updated_by" text,
	"updated_at" timestamp,
	CONSTRAINT "usr_dom_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_dom_uq" UNIQUE("user_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "user_permission_groups" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"permission_group_id" text NOT NULL,
	"given_by" text NOT NULL,
	"registration_date" timestamp NOT NULL,
	CONSTRAINT "usr_pg_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_pg_uq" UNIQUE("user_id","permission_group_id")
);
--> statement-breakpoint
CREATE TABLE "user_row_filter_values" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"permission_table_id" text NOT NULL,
	"permission_table_row_filter_id" uuid NOT NULL,
	"value" text NOT NULL,
	"display_name" text NOT NULL,
	"given_by" text,
	"created_at" timestamp,
	"last_updated_by" text,
	"updated_at" timestamp,
	CONSTRAINT "usr_rfv_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "user_unique_populations" (
	"user_id" text NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "usr_up_pk" PRIMARY KEY("user_id","value")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"should_apply_masking" boolean DEFAULT false NOT NULL,
	"can_view_deceased" boolean DEFAULT false NOT NULL,
	"can_impersonate" boolean DEFAULT false NOT NULL,
	"impersonate_expression" text,
	"is_blocked" boolean,
	"is_sap_permitted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "usr_pk" PRIMARY KEY("user_id"),
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "usr_id_uq" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "application_user_domain_classifications" ADD CONSTRAINT "app_usr_dom_cls_cls_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domain_classifications" ADD CONSTRAINT "app_usr_dom_cls_fk_ud" FOREIGN KEY ("application_user_domain_id") REFERENCES "public"."application_user_domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domain_roles" ADD CONSTRAINT "app_usr_dom_role_dom_fk" FOREIGN KEY ("application_user_domain_id") REFERENCES "public"."application_user_domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domain_roles" ADD CONSTRAINT "app_usr_dom_role_role_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domains" ADD CONSTRAINT "app_usr_dom_usr_fk" FOREIGN KEY ("application_user_id") REFERENCES "public"."application_users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domains" ADD CONSTRAINT "app_usr_dom_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log_changes" ADD CONSTRAINT "aud_log_chg_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_classifications" ADD CONSTRAINT "dom_cls_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_classifications" ADD CONSTRAINT "dom_cls_cls_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_co_owners" ADD CONSTRAINT "perm_grp_co_grp_fk" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_domain_classifications" ADD CONSTRAINT "perm_grp_dom_cls_dom_fk" FOREIGN KEY ("permission_group_domain_id") REFERENCES "public"."permission_group_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_domain_classifications" ADD CONSTRAINT "perm_grp_dom_cls_cls_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_domains" ADD CONSTRAINT "perm_grp_dom_grp_fk" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_domains" ADD CONSTRAINT "perm_grp_dom_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_row_filter_values" ADD CONSTRAINT "perm_grp_rfv_grp_fk" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_row_filter_values" ADD CONSTRAINT "perm_grp_rfv_tbl_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_row_filter_values" ADD CONSTRAINT "perm_grp_rfv_rf_tbl_fk" FOREIGN KEY ("permission_table_row_filter_id","permission_table_id") REFERENCES "public"."permission_table_row_filters"("id","permission_table_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_table_keys" ADD CONSTRAINT "perm_tbl_key_tbl_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_table_row_filters" ADD CONSTRAINT "perm_tbl_rf_tbl_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_co_owners" ADD CONSTRAINT "tbl_co_own_tbl_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_columns" ADD CONSTRAINT "tbl_col_tbl_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_columns" ADD CONSTRAINT "tbl_col_cls_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_columns" ADD CONSTRAINT "tbl_col_msk_fk" FOREIGN KEY ("mask_id") REFERENCES "public"."column_masks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_verification_stages" ADD CONSTRAINT "tbl_vrf_stg_tbl_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tbl_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tbl_pt_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "task_tbl_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_catalog_schemas" ADD CONSTRAINT "usr_cat_sch_cat_fk" FOREIGN KEY ("user_catalog_id") REFERENCES "public"."user_catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_catalogs" ADD CONSTRAINT "usr_cat_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domain_classifications" ADD CONSTRAINT "usr_dom_cls_fk_ud" FOREIGN KEY ("user_domain_id") REFERENCES "public"."user_domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domain_classifications" ADD CONSTRAINT "usr_dom_cls_fk_cls" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domains" ADD CONSTRAINT "usr_dom_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domains" ADD CONSTRAINT "usr_dom_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "usr_pg_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "usr_pg_pg_fk" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_row_filter_values" ADD CONSTRAINT "usr_rfv_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_row_filter_values" ADD CONSTRAINT "usr_rfv_tbl_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_row_filter_values" ADD CONSTRAINT "usr_rfv_rf_tbl_fk" FOREIGN KEY ("permission_table_row_filter_id","permission_table_id") REFERENCES "public"."permission_table_row_filters"("id","permission_table_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_unique_populations" ADD CONSTRAINT "usr_up_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;