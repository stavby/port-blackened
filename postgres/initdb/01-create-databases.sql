DO $$
BEGIN
	IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'openfga_user') THEN
		CREATE ROLE openfga_user LOGIN PASSWORD 'openfga_pass';
	END IF;

	IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'keycloak_user') THEN
		CREATE ROLE keycloak_user LOGIN PASSWORD 'keycloak_pass';
	END IF;

	IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'trino') THEN
		CREATE ROLE trino LOGIN PASSWORD 'trino';
	END IF;

	IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'shield_user') THEN
		CREATE ROLE shield_user LOGIN PASSWORD 'shield_pass';
	END IF;
END
$$;

CREATE DATABASE datalake OWNER trino;
CREATE DATABASE openfga OWNER openfga_user;
CREATE DATABASE keycloak OWNER keycloak_user;
CREATE DATABASE shield OWNER shield_user;

\connect datalake
GRANT ALL PRIVILEGES ON DATABASE datalake TO trino;
ALTER SCHEMA public OWNER TO trino;
GRANT ALL ON SCHEMA public TO trino;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO trino;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO trino;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO trino;

-- ---------------------------------------------------------------------------
-- datalake mock DDL + DML
-- ---------------------------------------------------------------------------

-- Dimension tables based on row_filters from seed-mock-data.js
CREATE TABLE IF NOT EXISTS public.dim_department (
	id text PRIMARY KEY,
	name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dim_event_type (
	id text PRIMARY KEY,
	name text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dim_region (
	id text PRIMARY KEY,
	name text NOT NULL
);

INSERT INTO public.dim_department (id, name) VALUES
	('D001', 'Engineering'),
	('D002', 'Analytics'),
	('D003', 'Finance')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dim_event_type (id, name) VALUES
	('E001', 'Login'),
	('E002', 'Purchase'),
	('E003', 'Export')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dim_region (id, name) VALUES
	('R001', 'North'),
	('R002', 'Center'),
	('R003', 'South')
ON CONFLICT (id) DO NOTHING;

-- Mock HR table using HR_GENERAL_INFO_COLUMNS from user-info.service.ts
CREATE TABLE IF NOT EXISTS public.mock_users (
	mispar_ishi text PRIMARY KEY,
	shem_male text,
	shem_darga text,
	shem_yechida text,
	cell_phone text,
	tatash_date text,
	sabat text,
	shem_isuk text
);

INSERT INTO public.mock_users (
	mispar_ishi,
	shem_male,
	shem_darga,
	shem_yechida,
	cell_phone,
	tatash_date,
	sabat,
	shem_isuk
) VALUES
	('1001', 'Alice Carter', 'Captain', 'Unit Analytics', '050-1111111', '2020-01-15', '2024-12-31', 'Analyst'),
	('1002', 'Bob Nguyen', 'Major', 'Unit Sales', '050-2222222', '2019-06-01', '2025-06-30', 'Data Engineer'),
	('1003', 'Carla Mendez', 'Lieutenant', 'Unit Public', '050-3333333', '2021-03-20', '2026-03-31', 'Researcher'),
	('1004', 'David Khan', 'Colonel', 'Unit Security', '050-4444444', '2018-09-10', '2025-12-31', 'Supervisor'),
	('1005', 'Emma Rossi', 'Sergeant', 'Unit Operations', '050-5555555', '2022-02-11', '2026-08-31', 'Operator')
ON CONFLICT (mispar_ishi) DO NOTHING;

-- Mock SAP tables list
CREATE TABLE IF NOT EXISTS public.mock_sap_tables (
	dl_schema text,
	dl_table text,
	PRIMARY KEY (dl_schema, dl_table)
);

INSERT INTO public.mock_sap_tables (dl_schema, dl_table) VALUES
	('public', 'users'),
	('analytics', 'events')
ON CONFLICT (dl_schema, dl_table) DO NOTHING;

-- Mock SAP users list
CREATE TABLE IF NOT EXISTS public.mock_sap_users (
	user_id text PRIMARY KEY
);

INSERT INTO public.mock_sap_users (user_id) VALUES
	('alice'),
	('bob'),
	('emma')
ON CONFLICT (user_id) DO NOTHING;

-- Mock unique population table
CREATE TABLE IF NOT EXISTS public.unique_pop_mock (
	id text PRIMARY KEY,
	name text NOT NULL
);

INSERT INTO public.unique_pop_mock (id, name) VALUES
	('UP001', 'Population Alpha'),
	('UP002', 'Population Beta'),
	('UP003', 'Population Gamma')
ON CONFLICT (id) DO NOTHING;

\connect openfga
ALTER SCHEMA public OWNER TO openfga_user;
GRANT ALL ON SCHEMA public TO openfga_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO openfga_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO openfga_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO openfga_user;

\connect keycloak
ALTER SCHEMA public OWNER TO keycloak_user;
GRANT ALL ON SCHEMA public TO keycloak_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO keycloak_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO keycloak_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO keycloak_user;

-- Later, you can add your app DB + user here, for example:
-- CREATE ROLE app_user LOGIN PASSWORD 'app_pass';
-- CREATE DATABASE my_app OWNER app_user;
