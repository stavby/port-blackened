\connect shield

-- ---------------------------------------------------------------------------
-- shield mock DML (excluding auditing/audit_logs)
-- ---------------------------------------------------------------------------

-- Base dictionaries
INSERT INTO public.classifications (id, display_name, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Public', 'Publicly shareable data'),
  ('10000000-0000-0000-0000-000000000002', 'Internal', 'Internal organizational data'),
  ('10000000-0000-0000-0000-000000000003', 'Restricted', 'Restricted and sensitive data')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.domains (id, name, display_name) VALUES
  ('20000000-0000-0000-0000-000000000001', 'finance', 'Finance'),
  ('20000000-0000-0000-0000-000000000002', 'hr', 'Human Resources'),
  ('20000000-0000-0000-0000-000000000003', 'operations', 'Operations')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.domain_classifications (domain_id, classification_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')
ON CONFLICT (domain_id, classification_id) DO NOTHING;

INSERT INTO public.roles (id, name, display_name, color, display_order) VALUES
  ('30000000-0000-0000-0000-000000000001', 'viewer', 'Viewer', '#3b82f6', 1),
  ('30000000-0000-0000-0000-000000000002', 'editor', 'Editor', '#22c55e', 2),
  ('30000000-0000-0000-0000-000000000003', 'owner', 'Owner', '#a855f7', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_types (id, display_name) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Standard'),
  ('40000000-0000-0000-0000-000000000002', 'PowerUser')
ON CONFLICT (id) DO NOTHING;

-- Permission tables and filters
INSERT INTO public.permission_tables (id, name, display_name) VALUES
  ('50000000-0000-0000-0000-000000000001', 'events', 'Events'),
  ('50000000-0000-0000-0000-000000000002', 'employees', 'Employees')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permission_table_row_filters (
  id,
  permission_table_id,
  kod,
  display_name,
  dimensions_table,
  data_type,
  ui_control_type
) VALUES
  ('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'region', 'Region', 'dim_region', 'string', 'select'),
  ('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'event_type', 'Event Type', 'dim_event_type', 'string', 'select'),
  ('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'department', 'Department', 'dim_department', 'string', 'select')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permission_table_keys (id, permission_table_id, name, display_name, trino_type) VALUES
  ('52000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'event_id', 'Event ID', 'varchar'),
  ('52000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'employee_id', 'Employee ID', 'varchar')
ON CONFLICT (id) DO NOTHING;

-- Users and dependent tables
INSERT INTO public.users (
  id,
  user_id,
  first_name,
  last_name,
  should_apply_masking,
  can_view_deceased,
  user_type_id,
  can_impersonate,
  impersonate_expression,
  is_blocked,
  is_sap_permitted
) VALUES
  ('60000000-0000-0000-0000-000000000001', 'alice', 'Alice', 'Carter', false, false, '40000000-0000-0000-0000-000000000001', false, null, false, true),
  ('60000000-0000-0000-0000-000000000002', 'bob', 'Bob', 'Nguyen', true, false, '40000000-0000-0000-0000-000000000002', true, 'department = ''Engineering''', false, false),
  ('60000000-0000-0000-0000-000000000003', 'carla', 'Carla', 'Mendez', false, true, '40000000-0000-0000-0000-000000000001', false, null, false, false)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_catalogs (id, user_id, catalog_name, write_all, read_all) VALUES
  ('61000000-0000-0000-0000-000000000001', 'alice', 'datalake', true, true),
  ('61000000-0000-0000-0000-000000000002', 'bob', 'datalake', false, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_catalog_schemas (id, user_catalog_id, schema_name, write) VALUES
  ('61100000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'public', true),
  ('61100000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000002', 'analytics', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_unique_populations (user_id, value) VALUES
  ('alice', 1),
  ('alice', 2),
  ('bob', 2)
ON CONFLICT (user_id, value) DO NOTHING;

INSERT INTO public.user_domains (id, user_id, domain_id, given_by, created_at, last_updated_by, updated_at) VALUES
  ('62000000-0000-0000-0000-000000000001', 'alice', '20000000-0000-0000-0000-000000000001', 'system', now(), 'system', now()),
  ('62000000-0000-0000-0000-000000000002', 'bob', '20000000-0000-0000-0000-000000000002', 'system', now(), 'system', now()),
  ('62000000-0000-0000-0000-000000000003', 'carla', '20000000-0000-0000-0000-000000000003', 'system', now(), 'system', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_domain_classifications (user_domain_id, classification_id) VALUES
  ('62000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('62000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'),
  ('62000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001')
ON CONFLICT (user_domain_id, classification_id) DO NOTHING;

INSERT INTO public.user_row_filter_values (
  id,
  user_id,
  permission_table_id,
  permission_table_row_filter_id,
  value,
  display_name,
  given_by,
  created_at,
  last_updated_by,
  updated_at
) VALUES
  ('63000000-0000-0000-0000-000000000001', 'alice', '50000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'R001', 'North', 'system', now(), 'system', now()),
  ('63000000-0000-0000-0000-000000000002', 'bob', '50000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000003', 'D001', 'Engineering', 'system', now(), 'system', now())
ON CONFLICT (id) DO NOTHING;

-- Permission groups and dependent tables
INSERT INTO public.permission_groups (
  id,
  name,
  owner_id,
  owner_name,
  description,
  color,
  should_apply_masking,
  can_view_deceased
) VALUES
  ('70000000-0000-0000-0000-000000000001', 'Finance_Readers', 'alice', 'Alice Carter', 'Read-only finance access', '#06b6d4', false, false),
  ('70000000-0000-0000-0000-000000000002', 'HR_Operators', 'bob', 'Bob Nguyen', 'HR operations group', '#f59e0b', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permission_group_co_owners (id, permission_group_id, user_id, user_name) VALUES
  ('71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'carla', 'Carla Mendez')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permission_group_domains (
  id,
  permission_group_id,
  domain_id,
  given_by,
  created_at,
  last_updated_by,
  updated_at
) VALUES
  ('72000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'system', now(), 'system', now()),
  ('72000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'system', now(), 'system', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permission_group_domain_classifications (permission_group_domain_id, classification_id) VALUES
  ('72000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('72000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003')
ON CONFLICT (permission_group_domain_id, classification_id) DO NOTHING;

INSERT INTO public.permission_group_row_filter_values (
  id,
  permission_group_id,
  permission_table_id,
  permission_table_row_filter_id,
  value,
  display_name,
  given_by,
  created_at,
  last_updated_by,
  updated_at
) VALUES
  ('73000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'R002', 'Center', 'system', now(), 'system', now()),
  ('73000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000003', 'D002', 'Analytics', 'system', now(), 'system', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_permission_groups (id, user_id, permission_group_id, given_by, registration_date) VALUES
  ('74000000-0000-0000-0000-000000000001', 'alice', '70000000-0000-0000-0000-000000000001', 'system', now()),
  ('74000000-0000-0000-0000-000000000002', 'bob', '70000000-0000-0000-0000-000000000002', 'system', now())
ON CONFLICT (id) DO NOTHING;

-- Application users model
INSERT INTO public.application_users (
  id,
  user_id,
  first_name,
  last_name,
  is_admin,
  can_create_connections,
  can_manage_unique_population_indications,
  given_by,
  last_updated_by,
  created_at,
  updated_at
) VALUES
  ('80000000-0000-0000-0000-000000000001', 'alice', 'Alice', 'Carter', true, true, true, 'system', 'system', now(), now()),
  ('80000000-0000-0000-0000-000000000002', 'bob', 'Bob', 'Nguyen', false, true, false, 'system', 'system', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.application_user_domains (id, application_user_id, domain_id) VALUES
  ('81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.application_user_domain_roles (application_user_domain_id, role_id) VALUES
  ('81000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003'),
  ('81000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001')
ON CONFLICT (application_user_domain_id, role_id) DO NOTHING;

INSERT INTO public.application_user_domain_classifications (application_user_domain_id, classification_id) VALUES
  ('81000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('81000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003')
ON CONFLICT (application_user_domain_id, classification_id) DO NOTHING;

-- Data catalog tables
INSERT INTO public.column_masks (id, name, display_name) VALUES
  ('90000000-0000-0000-0000-000000000001', 'hash', 'Hash'),
  ('90000000-0000-0000-0000-000000000002', 'nullify', 'Nullify')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tables (
  id,
  catalog_name,
  schema_name,
  table_name,
  table_display_name,
  table_desc,
  domain_id,
  permission_table_id,
  owner_id,
  source_type,
  connection_display_name,
  is_test,
  application,
  query,
  schedule_type,
  process_type,
  schedule,
  last_verification_time,
  is_deprecated
) VALUES
  (
    '91000000-0000-0000-0000-000000000001',
    'datalake',
    'analytics',
    'events',
    'Events',
    'Main events table',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'alice',
    'trino',
    'datalake-main',
    false,
    'shield',
    'select * from analytics.events',
    'daily',
    'batch',
    '0 2 * * *',
    now(),
    false
  ),
  (
    '91000000-0000-0000-0000-000000000002',
    'datalake',
    'public',
    'employees',
    'Employees',
    'Employee master table',
    '20000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000002',
    'bob',
    'trino',
    'datalake-main',
    false,
    'shield',
    'select * from public.employees',
    'weekly',
    'batch',
    '0 4 * * 1',
    now(),
    false
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.table_columns (
  id,
  table_id,
  column_name,
  data_type,
  column_display_name,
  column_desc,
  is_key,
  auth_key,
  classification_id,
  mask_id
) VALUES
  ('92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'event_id', 'varchar', 'Event ID', 'Unique event identifier', true, 'event_id', '10000000-0000-0000-0000-000000000001', null),
  ('92000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', 'region', 'varchar', 'Region', 'Geographic region', false, 'region', '10000000-0000-0000-0000-000000000002', null),
  ('92000000-0000-0000-0000-000000000003', '91000000-0000-0000-0000-000000000002', 'employee_id', 'varchar', 'Employee ID', 'Unique employee id', true, 'employee_id', '10000000-0000-0000-0000-000000000001', null),
  ('92000000-0000-0000-0000-000000000004', '91000000-0000-0000-0000-000000000002', 'salary', 'numeric', 'Salary', 'Sensitive compensation field', false, 'salary', '10000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.table_co_owners (id, table_id, owner_id, owner_name) VALUES
  ('93000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'bob', 'Bob Nguyen'),
  ('93000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', 'carla', 'Carla Mendez')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.table_verification_stages (id, table_id, stage, is_checked) VALUES
  ('94000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'technical_correctness', true),
  ('94000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', 'business_correctness', true),
  ('94000000-0000-0000-0000-000000000003', '91000000-0000-0000-0000-000000000001', 'documentation_correctness', false),
  ('94000000-0000-0000-0000-000000000004', '91000000-0000-0000-0000-000000000002', 'technical_correctness', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (
  id,
  type,
  done,
  table_id,
  create_date,
  modify_date,
  aprroval_date,
  aprroval_id
) VALUES
  ('95000000-0000-0000-0000-000000000001', 'verify_columns', false, '91000000-0000-0000-0000-000000000001', now(), now(), null, null),
  ('95000000-0000-0000-0000-000000000002', 'review_access', true, '91000000-0000-0000-0000-000000000002', now(), now(), now(), 'alice')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sap_tables (id, schema_name, table_name) VALUES
  ('96000000-0000-0000-0000-000000000001', 'public', 'employees'),
  ('96000000-0000-0000-0000-000000000002', 'analytics', 'events')
ON CONFLICT (id) DO NOTHING;
