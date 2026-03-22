CREATE TYPE "public"."permission_table_row_filter_query_builder_type" AS ENUM('select', 'tree', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."permission_table_row_filter_type" AS ENUM('integer', 'string', 'boolean');--> statement-breakpoint
CREATE TABLE "application_user_domain_classifications" (
	"application_user_domain_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"classification_id" uuid NOT NULL,
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
	"application_user_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	CONSTRAINT "app_usr_dom_pk" PRIMARY KEY("id"),
	CONSTRAINT "app_usr_dom_id_dom_uq" UNIQUE("id","domain_id"),
	CONSTRAINT "app_usr_dom_uq" UNIQUE("application_user_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "application_users" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"is_admin" boolean NOT NULL,
	"can_create_connections" boolean NOT NULL,
	"can_manage_unique_population_indications" boolean NOT NULL,
	"given_by" text,
	"last_changed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_usr_pk" PRIMARY KEY("id"),
	CONSTRAINT "application_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"operation" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"difference" jsonb NOT NULL,
	"time" timestamp NOT NULL,
	"version" integer NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "aud_log_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "auditing" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"operation" text NOT NULL,
	"resource" text NOT NULL,
	"status" text NOT NULL,
	"resource_info" jsonb NOT NULL,
	"message" text NOT NULL,
	"difference" jsonb NOT NULL,
	"time" text NOT NULL,
	CONSTRAINT "aud_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "classifications" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "cls_pk" PRIMARY KEY("id"),
	CONSTRAINT "classifications_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "domain_classifications" (
	"domain_id" uuid NOT NULL,
	"classification_id" uuid NOT NULL,
	CONSTRAINT "dom_cls_pk" PRIMARY KEY("domain_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "dom_pk" PRIMARY KEY("id"),
	CONSTRAINT "domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permission_group_co_owners" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_group_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	CONSTRAINT "perm_grp_co_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "permission_group_domain_classifications" (
	"permission_group_domain_id" uuid NOT NULL,
	"classification_id" uuid NOT NULL,
	CONSTRAINT "perm_grp_dom_cls_pk" PRIMARY KEY("permission_group_domain_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE "permission_group_domains" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_group_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"given_by" text,
	"create_date" timestamp,
	"last_changed_by" text,
	"last_change" timestamp,
	CONSTRAINT "perm_grp_dom_pk" PRIMARY KEY("id"),
	CONSTRAINT "perm_grp_dom_uq" UNIQUE("permission_group_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "permission_group_permission_table_row_filter_values" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_group_permission_table_row_filter_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "perm_grp_pt_rfv_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "permission_group_permission_table_row_filters" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_group_permission_table_id" uuid NOT NULL,
	"kod" text NOT NULL,
	CONSTRAINT "perm_grp_pt_rf_pk" PRIMARY KEY("id"),
	CONSTRAINT "perm_grp_pt_rf_uq" UNIQUE("permission_group_permission_table_id","kod")
);
--> statement-breakpoint
CREATE TABLE "permission_group_permission_tables" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_group_id" uuid NOT NULL,
	"permission_table_id" uuid NOT NULL,
	"given_by" text,
	"last_changed_by" text,
	"last_change" timestamp,
	"create_date" timestamp,
	CONSTRAINT "perm_grp_pt_pk" PRIMARY KEY("id"),
	CONSTRAINT "perm_grp_pt_uq" UNIQUE("permission_group_id","permission_table_id")
);
--> statement-breakpoint
CREATE TABLE "permission_groups" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"owner_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"color" text NOT NULL,
	"mask" boolean NOT NULL,
	"deceased_population" boolean NOT NULL,
	CONSTRAINT "perm_grp_pk" PRIMARY KEY("id"),
	CONSTRAINT "permission_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permission_table_keys" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_table_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"trino_type" text NOT NULL,
	CONSTRAINT "perm_tbl_key_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "permission_table_row_filters" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"permission_table_id" uuid NOT NULL,
	"kod" text NOT NULL,
	"display_name" text NOT NULL,
	"dimensions_table" text NOT NULL,
	"type" "permission_table_row_filter_type" NOT NULL,
	"query_builder_type" "permission_table_row_filter_query_builder_type" NOT NULL,
	CONSTRAINT "perm_tbl_rf_pk" PRIMARY KEY("id"),
	CONSTRAINT "perm_tbl_rf_uq" UNIQUE("permission_table_id","kod")
);
--> statement-breakpoint
CREATE TABLE "permission_tables" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "perm_tbl_pk" PRIMARY KEY("id"),
	CONSTRAINT "permission_tables_name_unique" UNIQUE("name")
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
CREATE TABLE "sap_permitted_users" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "sap_usr_pk" PRIMARY KEY("id"),
	CONSTRAINT "sap_permitted_users_user_id_unique" UNIQUE("user_id")
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
	"domain_id" uuid NOT NULL,
	"column_name" text NOT NULL,
	"data_type" text NOT NULL,
	"column_display_name" text DEFAULT '' NOT NULL,
	"column_desc" text DEFAULT '' NOT NULL,
	"is_key" boolean DEFAULT false NOT NULL,
	"classification_id" uuid,
	"mask_id" uuid,
	CONSTRAINT "tbl_col_pk" PRIMARY KEY("id"),
	CONSTRAINT "tbl_col_uq" UNIQUE("table_id","column_name")
);
--> statement-breakpoint
CREATE TABLE "table_verification_stages" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"stage" text NOT NULL,
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
	"domain_id" uuid NOT NULL,
	"permission_keys" jsonb NOT NULL,
	"permission_table_id" uuid,
	"owner" text NOT NULL,
	"source_type" text NOT NULL,
	"connection" jsonb,
	"application" text,
	"query" text,
	"schedule_type" text,
	"process_type" text,
	"schedule" text,
	"updating_dependencies" jsonb,
	"last_verification_time" timestamp,
	"is_deprecated" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tbl_pk" PRIMARY KEY("id"),
	CONSTRAINT "tbl_id_dom_uq" UNIQUE("id","domain_id"),
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
	"user_id" uuid NOT NULL,
	"catalog_name" text NOT NULL,
	"write" boolean,
	"read_all" boolean,
	CONSTRAINT "usr_cat_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_cat_uq" UNIQUE("user_id","catalog_name")
);
--> statement-breakpoint
CREATE TABLE "user_domain_classifications" (
	"user_domain_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"classification_id" uuid NOT NULL,
	CONSTRAINT "usr_dom_cls_pk" PRIMARY KEY("user_domain_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE "user_domains" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"given_by" text,
	"create_date" timestamp,
	"last_changed_by" text,
	"last_change" timestamp,
	CONSTRAINT "usr_dom_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_dom_id_dom_uq" UNIQUE("id","domain_id"),
	CONSTRAINT "usr_dom_uq" UNIQUE("user_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "user_permission_groups" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"given_by" text NOT NULL,
	"registration_date" timestamp NOT NULL,
	CONSTRAINT "usr_pg_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_pg_uq" UNIQUE("user_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "user_permission_table_row_filter_values" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_permission_table_row_filter_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "usr_pt_rfv_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "user_permission_table_row_filters" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_permission_table_id" uuid NOT NULL,
	"kod" text NOT NULL,
	CONSTRAINT "usr_pt_rf_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_pt_rf_uq" UNIQUE("user_permission_table_id","kod")
);
--> statement-breakpoint
CREATE TABLE "user_permission_tables" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"permission_table_id" uuid NOT NULL,
	"given_by" text,
	"last_changed_by" text,
	"last_change" timestamp,
	"create_date" timestamp,
	CONSTRAINT "usr_pt_pk" PRIMARY KEY("id"),
	CONSTRAINT "usr_pt_uq" UNIQUE("user_id","permission_table_id")
);
--> statement-breakpoint
CREATE TABLE "user_types" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "usr_type_pk" PRIMARY KEY("id"),
	CONSTRAINT "user_types_display_name_unique" UNIQUE("display_name")
);
--> statement-breakpoint
CREATE TABLE "user_unique_populations" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "usr_up_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"mask" boolean NOT NULL,
	"deceased_population" boolean NOT NULL,
	"user_type_id" uuid NOT NULL,
	"impersonate_value" boolean NOT NULL,
	"impersonate_expression" text,
	"blocked" boolean,
	CONSTRAINT "usr_pk" PRIMARY KEY("id"),
	CONSTRAINT "users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "application_user_domain_classifications" ADD CONSTRAINT "app_usr_dom_cls_ud_fk" FOREIGN KEY ("application_user_domain_id") REFERENCES "public"."application_user_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domain_classifications" ADD CONSTRAINT "app_usr_dom_cls_cls_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domain_classifications" ADD CONSTRAINT "app_usr_dom_cls_fk_ud" FOREIGN KEY ("application_user_domain_id","domain_id") REFERENCES "public"."application_user_domains"("id","domain_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domain_classifications" ADD CONSTRAINT "app_usr_dom_cls_fk_dc" FOREIGN KEY ("domain_id","classification_id") REFERENCES "public"."domain_classifications"("domain_id","classification_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domain_roles" ADD CONSTRAINT "app_usr_dom_role_ud_fk" FOREIGN KEY ("application_user_domain_id") REFERENCES "public"."application_user_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domain_roles" ADD CONSTRAINT "app_usr_dom_role_role_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domains" ADD CONSTRAINT "app_usr_dom_usr_fk" FOREIGN KEY ("application_user_id") REFERENCES "public"."application_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_user_domains" ADD CONSTRAINT "app_usr_dom_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_classifications" ADD CONSTRAINT "dom_cls_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_classifications" ADD CONSTRAINT "dom_cls_cls_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_co_owners" ADD CONSTRAINT "perm_grp_co_grp_fk" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_domain_classifications" ADD CONSTRAINT "perm_grp_dom_cls_dom_fk" FOREIGN KEY ("permission_group_domain_id") REFERENCES "public"."permission_group_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_domain_classifications" ADD CONSTRAINT "perm_grp_dom_cls_cls_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_domains" ADD CONSTRAINT "perm_grp_dom_grp_fk" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_domains" ADD CONSTRAINT "perm_grp_dom_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_permission_table_row_filter_values" ADD CONSTRAINT "perm_grp_pt_rfv_rf_fk" FOREIGN KEY ("permission_group_permission_table_row_filter_id") REFERENCES "public"."permission_group_permission_table_row_filters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_permission_table_row_filters" ADD CONSTRAINT "perm_grp_pt_rf_pt_fk" FOREIGN KEY ("permission_group_permission_table_id") REFERENCES "public"."permission_group_permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_permission_tables" ADD CONSTRAINT "perm_grp_pt_grp_fk" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_permission_tables" ADD CONSTRAINT "perm_grp_pt_tbl_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_table_keys" ADD CONSTRAINT "perm_tbl_key_tbl_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_table_row_filters" ADD CONSTRAINT "perm_tbl_rf_tbl_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_co_owners" ADD CONSTRAINT "tbl_co_own_tbl_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_columns" ADD CONSTRAINT "tbl_col_tbl_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_columns" ADD CONSTRAINT "tbl_cols_tbl_dom_fk" FOREIGN KEY ("table_id","domain_id") REFERENCES "public"."tables"("id","domain_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_columns" ADD CONSTRAINT "tbl_cols_dom_cls_fk" FOREIGN KEY ("domain_id","classification_id") REFERENCES "public"."domain_classifications"("domain_id","classification_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_columns" ADD CONSTRAINT "tbl_col_msk_fk" FOREIGN KEY ("mask_id") REFERENCES "public"."column_masks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_verification_stages" ADD CONSTRAINT "tbl_vrf_stg_tbl_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tbl_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tbl_pt_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "task_tbl_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_catalog_schemas" ADD CONSTRAINT "usr_cat_sch_cat_fk" FOREIGN KEY ("user_catalog_id") REFERENCES "public"."user_catalogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_catalogs" ADD CONSTRAINT "usr_cat_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domain_classifications" ADD CONSTRAINT "usr_dom_cls_fk_ud" FOREIGN KEY ("user_domain_id") REFERENCES "public"."user_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domain_classifications" ADD CONSTRAINT "usr_dom_cls_fk_cls" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domain_classifications" ADD CONSTRAINT "usr_dom_cls_fk_ud_dom" FOREIGN KEY ("user_domain_id","domain_id") REFERENCES "public"."user_domains"("id","domain_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domain_classifications" ADD CONSTRAINT "usr_dom_cls_fk_dom_cls" FOREIGN KEY ("domain_id","classification_id") REFERENCES "public"."domain_classifications"("domain_id","classification_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domains" ADD CONSTRAINT "usr_dom_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_domains" ADD CONSTRAINT "usr_dom_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "usr_pg_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "usr_pg_dom_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_table_row_filter_values" ADD CONSTRAINT "usr_pt_rfv_rf_fk" FOREIGN KEY ("user_permission_table_row_filter_id") REFERENCES "public"."user_permission_table_row_filters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_table_row_filters" ADD CONSTRAINT "usr_pt_rf_pt_fk" FOREIGN KEY ("user_permission_table_id") REFERENCES "public"."user_permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_tables" ADD CONSTRAINT "usr_pt_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_tables" ADD CONSTRAINT "usr_pt_tbl_fk" FOREIGN KEY ("permission_table_id") REFERENCES "public"."permission_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_unique_populations" ADD CONSTRAINT "usr_up_usr_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "usr_type_fk" FOREIGN KEY ("user_type_id") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action;