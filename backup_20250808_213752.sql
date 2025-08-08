--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: book_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.book_status AS ENUM (
    'draft',
    'writing',
    'editing',
    'design',
    'formatting',
    'marketing',
    'in_review',
    'published',
    'archived'
);


ALTER TYPE public.book_status OWNER TO neondb_owner;

--
-- Name: cron_job_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.cron_job_type AS ENUM (
    'exchange_rates_update',
    'data_cleanup',
    'backup_generation'
);


ALTER TYPE public.cron_job_type OWNER TO neondb_owner;

--
-- Name: format; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.format AS ENUM (
    'ebook',
    'paperback',
    'hardcover'
);


ALTER TYPE public.format OWNER TO neondb_owner;

--
-- Name: import_file_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.import_file_type AS ENUM (
    'sales_data',
    'royalty_payments',
    'advertisement_report',
    'other'
);


ALTER TYPE public.import_file_type OWNER TO neondb_owner;

--
-- Name: import_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.import_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE public.import_status OWNER TO neondb_owner;

--
-- Name: project_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.project_status AS ENUM (
    'draft',
    'in_review',
    'published',
    'archived'
);


ALTER TYPE public.project_status OWNER TO neondb_owner;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin',
    'superadmin'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_generations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_generations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    project_id character varying,
    book_id character varying,
    prompt_text text NOT NULL,
    generated_content text,
    content_type character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    tokens_used integer DEFAULT 0,
    model_used character varying,
    generation_time_ms integer,
    error_message text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_generations OWNER TO neondb_owner;

--
-- Name: ai_prompts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_prompts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    description text,
    category character varying NOT NULL,
    prompt_template text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb,
    model_config jsonb,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_prompts OWNER TO neondb_owner;

--
-- Name: author_biographies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.author_biographies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    author_id character varying NOT NULL,
    language character varying NOT NULL,
    biography text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.author_biographies OWNER TO neondb_owner;

--
-- Name: authors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.authors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    prefix character varying,
    first_name character varying NOT NULL,
    middle_name character varying,
    last_name character varying NOT NULL,
    suffix character varying,
    full_name character varying NOT NULL,
    profile_image_url character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.authors OWNER TO neondb_owner;

--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    description text,
    color character varying DEFAULT '#3b82f6'::character varying,
    is_active boolean DEFAULT true,
    post_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blog_categories OWNER TO neondb_owner;

--
-- Name: blog_comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_comments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    post_id character varying NOT NULL,
    author_id character varying,
    author_name character varying,
    author_email character varying,
    content text NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    parent_id character varying,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blog_comments OWNER TO neondb_owner;

--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_posts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    slug character varying NOT NULL,
    excerpt text,
    content text NOT NULL,
    featured_image character varying,
    author_id character varying NOT NULL,
    category_id character varying,
    status character varying DEFAULT 'draft'::character varying,
    published_at timestamp without time zone,
    meta_title character varying,
    meta_description text,
    tags text[] DEFAULT '{}'::text[],
    view_count integer DEFAULT 0,
    is_comment_enabled boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blog_posts OWNER TO neondb_owner;

--
-- Name: books; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.books (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    project_id character varying,
    title text NOT NULL,
    subtitle text,
    description text,
    categories text[],
    keywords text[],
    status public.book_status DEFAULT 'draft'::public.book_status,
    language character varying DEFAULT 'English'::character varying,
    series_title character varying,
    series_number integer,
    edition_number character varying,
    author_prefix character varying,
    author_first_name character varying,
    author_middle_name character varying,
    author_last_name character varying,
    author_suffix character varying,
    publishing_rights character varying DEFAULT 'owned'::character varying,
    has_explicit_content boolean DEFAULT false,
    reading_age_min character varying,
    reading_age_max character varying,
    primary_marketplace character varying DEFAULT 'Amazon.com'::character varying,
    is_low_content_book boolean DEFAULT false,
    is_large_print_book boolean DEFAULT false,
    publication_date date,
    previously_published boolean DEFAULT false,
    previous_publication_date date,
    release_option character varying DEFAULT 'immediate'::character varying,
    scheduled_release_date date,
    use_ai boolean DEFAULT false,
    ai_prompt text,
    ai_content_type character varying,
    format public.format DEFAULT 'ebook'::public.format,
    publication_info jsonb,
    cover_image_url character varying,
    isbn character varying,
    isbn_placeholder character varying,
    asin character varying,
    total_sales integer DEFAULT 0,
    total_revenue numeric(10,2) DEFAULT 0.00,
    monthly_revenue numeric(10,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.books OWNER TO neondb_owner;

--
-- Name: consolidated_sales_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.consolidated_sales_data (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    currency character varying NOT NULL,
    marketplace character varying NOT NULL,
    total_earnings numeric(15,2) DEFAULT 0 NOT NULL,
    total_earnings_usd numeric(15,2) DEFAULT 0 NOT NULL,
    exchange_rate numeric(10,6),
    payment_count integer DEFAULT 0,
    source_imports text[] DEFAULT '{}'::text[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.consolidated_sales_data OWNER TO neondb_owner;

--
-- Name: contributors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contributors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying,
    book_id character varying,
    name text NOT NULL,
    role character varying NOT NULL,
    prefix character varying,
    first_name character varying NOT NULL,
    middle_name character varying,
    last_name character varying NOT NULL,
    suffix character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contributors OWNER TO neondb_owner;

--
-- Name: cron_jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cron_jobs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_type public.cron_job_type NOT NULL,
    name character varying NOT NULL,
    description text,
    enabled boolean DEFAULT false,
    interval_hours numeric(10,2) DEFAULT 24,
    last_run timestamp without time zone,
    next_run timestamp without time zone,
    last_status character varying DEFAULT 'stopped'::character varying,
    last_error text,
    run_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cron_jobs OWNER TO neondb_owner;

--
-- Name: kdp_import_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.kdp_import_data (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    import_id character varying NOT NULL,
    user_id character varying NOT NULL,
    asin character varying,
    isbn character varying,
    title text,
    author_name character varying,
    marketplace character varying,
    sales_date date,
    units_sold integer DEFAULT 0,
    units_refunded integer DEFAULT 0,
    net_units_sold integer DEFAULT 0,
    currency character varying,
    list_price numeric(10,2),
    offer_price numeric(10,2),
    royalty numeric(10,2),
    royalty_rate character varying,
    earnings numeric(10,2),
    kenp_read integer DEFAULT 0,
    transaction_type character varying,
    payment_status character varying,
    format character varying,
    file_size numeric(6,2),
    delivery_cost numeric(10,2),
    manufacturing_cost numeric(10,2),
    row_index integer,
    sheet_name character varying,
    raw_row_data jsonb,
    is_processed boolean DEFAULT false,
    is_duplicate boolean DEFAULT false,
    matched_book_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.kdp_import_data OWNER TO neondb_owner;

--
-- Name: kdp_imports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.kdp_imports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    file_name character varying NOT NULL,
    file_type character varying NOT NULL,
    file_size integer NOT NULL,
    detected_type public.import_file_type,
    status public.import_status DEFAULT 'pending'::public.import_status,
    progress integer DEFAULT 0,
    total_records integer DEFAULT 0,
    processed_records integer DEFAULT 0,
    error_records integer DEFAULT 0,
    duplicate_records integer DEFAULT 0,
    raw_data jsonb,
    mapping_config jsonb,
    error_log text[] DEFAULT '{}'::text[],
    summary jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


ALTER TABLE public.kdp_imports OWNER TO neondb_owner;

--
-- Name: marketplace_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.marketplace_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    marketplace character varying NOT NULL,
    category_path text NOT NULL,
    parent_path text,
    level integer DEFAULT 1 NOT NULL,
    display_name character varying NOT NULL,
    is_selectable boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.marketplace_categories OWNER TO neondb_owner;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    categories text[],
    keywords text[],
    status public.project_status DEFAULT 'draft'::public.project_status,
    use_ai boolean DEFAULT false,
    ai_prompt text,
    ai_content_type character varying,
    formats text[],
    publication_info jsonb,
    cover_image_url character varying,
    total_sales integer DEFAULT 0,
    total_revenue numeric(10,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    language character varying DEFAULT 'English'::character varying,
    series_title character varying,
    series_number integer,
    edition_number character varying,
    author_prefix character varying,
    author_first_name character varying,
    author_middle_name character varying,
    author_last_name character varying,
    author_suffix character varying,
    publishing_rights character varying DEFAULT 'owned'::character varying,
    has_explicit_content boolean DEFAULT false,
    reading_age_min character varying,
    reading_age_max character varying,
    primary_marketplace character varying DEFAULT 'Amazon.com'::character varying,
    is_low_content_book boolean DEFAULT false,
    is_large_print_book boolean DEFAULT false,
    publication_date date,
    previously_published boolean DEFAULT false,
    previous_publication_date date,
    release_option character varying DEFAULT 'immediate'::character varying,
    scheduled_release_date date,
    name text
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- Name: sales_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_data (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    report_date timestamp without time zone NOT NULL,
    format public.format NOT NULL,
    marketplace character varying NOT NULL,
    units_sold integer DEFAULT 0,
    revenue numeric(10,2) DEFAULT 0.00,
    royalty numeric(10,2) DEFAULT 0.00,
    file_name character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_data OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role public.user_role DEFAULT 'user'::public.user_role,
    subscription_tier character varying DEFAULT 'free'::character varying,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    is_active boolean DEFAULT true,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: ai_generations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_generations (id, user_id, project_id, book_id, prompt_text, generated_content, content_type, status, tokens_used, model_used, generation_time_ms, error_message, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_prompts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_prompts (id, name, description, category, prompt_template, variables, model_config, is_active, usage_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: author_biographies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.author_biographies (id, author_id, language, biography, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.authors (id, user_id, prefix, first_name, middle_name, last_name, suffix, full_name, profile_image_url, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: blog_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.blog_categories (id, name, slug, description, color, is_active, post_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: blog_comments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.blog_comments (id, post_id, author_id, author_name, author_email, content, status, parent_id, is_verified, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.blog_posts (id, title, slug, excerpt, content, featured_image, author_id, category_id, status, published_at, meta_title, meta_description, tags, view_count, is_comment_enabled, is_featured, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.books (id, user_id, project_id, title, subtitle, description, categories, keywords, status, language, series_title, series_number, edition_number, author_prefix, author_first_name, author_middle_name, author_last_name, author_suffix, publishing_rights, has_explicit_content, reading_age_min, reading_age_max, primary_marketplace, is_low_content_book, is_large_print_book, publication_date, previously_published, previous_publication_date, release_option, scheduled_release_date, use_ai, ai_prompt, ai_content_type, format, publication_info, cover_image_url, isbn, isbn_placeholder, asin, total_sales, total_revenue, monthly_revenue, created_at, updated_at) FROM stdin;
1e5d96a3-e5b4-40cb-b2be-a3b55d8c56ce	dev-user-123	b5f3abb4-6dda-43bd-9f1a-45d57d0450a0	hrhtr	htrhtr		{}	{}	draft	English	\N	\N	\N						owned	f	\N	\N	Amazon.com	f	f	\N	f	\N	immediate	\N	f	\N	\N	ebook	\N	\N	\N	PlaceHolder-61285922	\N	0	0.00	0.00	2025-08-08 21:10:28.620739	2025-08-08 21:10:28.620739
\.


--
-- Data for Name: consolidated_sales_data; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.consolidated_sales_data (id, user_id, period_start, period_end, currency, marketplace, total_earnings, total_earnings_usd, exchange_rate, payment_count, source_imports, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contributors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contributors (id, project_id, book_id, name, role, prefix, first_name, middle_name, last_name, suffix, created_at) FROM stdin;
\.


--
-- Data for Name: cron_jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cron_jobs (id, job_type, name, description, enabled, interval_hours, last_run, next_run, last_status, last_error, run_count, created_at, updated_at) FROM stdin;
34b8d637-222c-4218-a91b-e103a4d4ce3d	exchange_rates_update	Exchange Rates Update	Updates currency exchange rates from external API	f	24.00	\N	\N	stopped	\N	0	2025-08-08 21:02:47.804451	2025-08-08 21:29:33.852
\.


--
-- Data for Name: kdp_import_data; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.kdp_import_data (id, import_id, user_id, asin, isbn, title, author_name, marketplace, sales_date, units_sold, units_refunded, net_units_sold, currency, list_price, offer_price, royalty, royalty_rate, earnings, kenp_read, transaction_type, payment_status, format, file_size, delivery_cost, manufacturing_cost, row_index, sheet_name, raw_row_data, is_processed, is_duplicate, matched_book_id, created_at) FROM stdin;
\.


--
-- Data for Name: kdp_imports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.kdp_imports (id, user_id, file_name, file_type, file_size, detected_type, status, progress, total_records, processed_records, error_records, duplicate_records, raw_data, mapping_config, error_log, summary, created_at, updated_at, completed_at) FROM stdin;
\.


--
-- Data for Name: marketplace_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.marketplace_categories (id, marketplace, category_path, parent_path, level, display_name, is_selectable, sort_order, is_active, created_at, updated_at) FROM stdin;
3e5fb8a9-424c-4154-b18c-afde9891a4bf	Amazon.it	Books > kindle_ebook	\N	2	kindle_ebook	t	1	t	2025-08-08 21:29:13.258012	2025-08-08 21:29:13.258012
f5f8ba6e-3bfd-411c-a906-006ab3f2280e	Amazon.it	Books > kindle_ebook > Affari e Finanza	Books > kindle_ebook	3	Affari e Finanza	t	1	t	2025-08-08 21:29:13.30227	2025-08-08 21:29:13.30227
2fc55932-238e-42d0-a38a-abdc887b63a4	Amazon.it	Books > kindle_ebook > Affari e Finanza > Imprenditoria	Books > kindle_ebook > Affari e Finanza	4	Imprenditoria	t	1	t	2025-08-08 21:29:13.346164	2025-08-08 21:29:13.346164
f6a21d4a-7fbc-4b54-aa60-f548555c0bd6	Amazon.it	Books > kindle_ebook > Affari e Finanza > Imprenditoria > Startup	Books > kindle_ebook > Affari e Finanza > Imprenditoria	5	Startup	t	1	t	2025-08-08 21:29:13.390314	2025-08-08 21:29:13.390314
71516e43-aec2-46d9-a6e4-60c7d7534b3b	Amazon.it	Books > kindle_ebook > Affari e Finanza > Imprenditoria > Startup > Raccolta fondi	Books > kindle_ebook > Affari e Finanza > Imprenditoria > Startup	6	Raccolta fondi	t	1	t	2025-08-08 21:29:13.434314	2025-08-08 21:29:13.434314
5c0e47b6-0d72-4e50-87ad-3939d000e1ab	Amazon.it	Books > print_kdp_paperback	\N	2	print_kdp_paperback	t	1	t	2025-08-08 21:29:13.478588	2025-08-08 21:29:13.478588
4f0be11b-fed1-4958-9e3f-0e1adf74afe8	Amazon.it	Books > print_kdp_paperback > Affari e Finanza	Books > print_kdp_paperback	3	Affari e Finanza	t	1	t	2025-08-08 21:29:13.523399	2025-08-08 21:29:13.523399
b940b4bf-54b8-447a-9831-1387b6bf618a	Amazon.it	Books > print_kdp_paperback > Affari e Finanza > Imprenditoria	Books > print_kdp_paperback > Affari e Finanza	4	Imprenditoria	t	1	t	2025-08-08 21:29:13.567279	2025-08-08 21:29:13.567279
e30bd6af-bf46-40dc-a131-9df6c7c78712	Amazon.it	Books > print_kdp_paperback > Affari e Finanza > Imprenditoria > Startup	Books > print_kdp_paperback > Affari e Finanza > Imprenditoria	5	Startup	t	1	t	2025-08-08 21:29:13.611287	2025-08-08 21:29:13.611287
89ec2659-95d2-427c-872f-9379c98aa1eb	Amazon.it	Books > print_kdp_paperback > Affari e Finanza > Imprenditoria > Startup > Raccolta fondi	Books > print_kdp_paperback > Affari e Finanza > Imprenditoria > Startup	6	Raccolta fondi	t	1	t	2025-08-08 21:29:13.655318	2025-08-08 21:29:13.655318
e3d02820-f378-4181-a9c5-f97c5e3e5956	Amazon.it	Books > kindle_ebook > Bambini e Ragazzi	Books > kindle_ebook	3	Bambini e Ragazzi	t	1	t	2025-08-08 21:29:13.69923	2025-08-08 21:29:13.69923
13231bd1-a70e-4119-861e-ed27f6c4a1da	Amazon.it	Books > kindle_ebook > Bambini e Ragazzi > Libri per bambini	Books > kindle_ebook > Bambini e Ragazzi	4	Libri per bambini	t	1	t	2025-08-08 21:29:13.74328	2025-08-08 21:29:13.74328
23b8c113-3609-4feb-9a59-15ee45b5118f	Amazon.it	Books > kindle_ebook > Bambini e Ragazzi > Libri per bambini > Libri illustrati	Books > kindle_ebook > Bambini e Ragazzi > Libri per bambini	5	Libri illustrati	t	1	t	2025-08-08 21:29:13.787214	2025-08-08 21:29:13.787214
9da9e64c-b4d1-44d2-a42b-5e8e027f8bc9	Amazon.it	Books > kindle_ebook > Bambini e Ragazzi > Libri per bambini > Libri illustrati > Animali	Books > kindle_ebook > Bambini e Ragazzi > Libri per bambini > Libri illustrati	6	Animali	t	1	t	2025-08-08 21:29:13.831152	2025-08-08 21:29:13.831152
34d17db0-42ef-4f86-b427-14e72d33cb7c	Amazon.it	Books > print_kdp_paperback > Bambini e Ragazzi	Books > print_kdp_paperback	3	Bambini e Ragazzi	t	1	t	2025-08-08 21:29:13.875242	2025-08-08 21:29:13.875242
af294d7e-5f51-4da3-9884-a51aade40071	Amazon.it	Books > print_kdp_paperback > Bambini e Ragazzi > Libri per bambini	Books > print_kdp_paperback > Bambini e Ragazzi	4	Libri per bambini	t	1	t	2025-08-08 21:29:13.919375	2025-08-08 21:29:13.919375
4694bbe9-d598-4ad2-9678-55b6775b2fbb	Amazon.it	Books > print_kdp_paperback > Bambini e Ragazzi > Libri per bambini > Libri illustrati	Books > print_kdp_paperback > Bambini e Ragazzi > Libri per bambini	5	Libri illustrati	t	1	t	2025-08-08 21:29:13.963645	2025-08-08 21:29:13.963645
b2f09e87-583a-4254-810e-336ef49d96d9	Amazon.it	Books > print_kdp_paperback > Bambini e Ragazzi > Libri per bambini > Libri illustrati > Animali	Books > print_kdp_paperback > Bambini e Ragazzi > Libri per bambini > Libri illustrati	6	Animali	t	1	t	2025-08-08 21:29:14.007623	2025-08-08 21:29:14.007623
dd44c3ee-e024-4e5a-9fc9-a216d683db53	Amazon.co.uk	Books > print_kdp_paperback	\N	2	print_kdp_paperback	t	1	t	2025-08-08 21:29:14.051661	2025-08-08 21:29:14.051661
748230f7-a030-4441-a3a6-a1b39e68234b	Amazon.co.uk	Books > print_kdp_paperback > Business & Finance	Books > print_kdp_paperback	3	Business & Finance	t	1	t	2025-08-08 21:29:14.095775	2025-08-08 21:29:14.095775
59a1756b-5525-4afb-9278-796dd1c584d2	Amazon.co.uk	Books > print_kdp_paperback > Business & Finance > Entrepreneurship	Books > print_kdp_paperback > Business & Finance	4	Entrepreneurship	t	1	t	2025-08-08 21:29:14.139929	2025-08-08 21:29:14.139929
b6d118e3-6df1-4e05-a563-5a12ae9755a4	Amazon.co.uk	Books > print_kdp_paperback > Business & Finance > Entrepreneurship > Startups	Books > print_kdp_paperback > Business & Finance > Entrepreneurship	5	Startups	t	1	t	2025-08-08 21:29:14.18386	2025-08-08 21:29:14.18386
f18b3138-2232-4dc9-9dea-4dab4517d3c8	Amazon.co.uk	Books > print_kdp_paperback > Business & Finance > Entrepreneurship > Startups > Fundraising	Books > print_kdp_paperback > Business & Finance > Entrepreneurship > Startups	6	Fundraising	t	1	t	2025-08-08 21:29:14.227884	2025-08-08 21:29:14.227884
5fba1a22-935b-4a9e-b21d-8a1a30b52f29	Amazon.co.uk	Books > kindle_ebook	\N	2	kindle_ebook	t	1	t	2025-08-08 21:29:14.272036	2025-08-08 21:29:14.272036
27873b20-a64e-452d-9a7e-94f97d9c3d09	Amazon.co.uk	Books > kindle_ebook > Business & Finance	Books > kindle_ebook	3	Business & Finance	t	1	t	2025-08-08 21:29:14.316135	2025-08-08 21:29:14.316135
2c2ff24e-8705-4729-8195-ea6982dc2e85	Amazon.co.uk	Books > kindle_ebook > Business & Finance > Entrepreneurship	Books > kindle_ebook > Business & Finance	4	Entrepreneurship	t	1	t	2025-08-08 21:29:14.360049	2025-08-08 21:29:14.360049
1ead1a9e-f27a-44a2-a22f-e756776e300d	Amazon.co.uk	Books > kindle_ebook > Business & Finance > Entrepreneurship > Startups	Books > kindle_ebook > Business & Finance > Entrepreneurship	5	Startups	t	1	t	2025-08-08 21:29:14.404336	2025-08-08 21:29:14.404336
7e1a10fe-f926-4961-8bea-3a292ef4bdb0	Amazon.co.uk	Books > kindle_ebook > Business & Finance > Entrepreneurship > Startups > Fundraising	Books > kindle_ebook > Business & Finance > Entrepreneurship > Startups	6	Fundraising	t	1	t	2025-08-08 21:29:14.448273	2025-08-08 21:29:14.448273
34b72ca4-adfe-4c38-9b80-dfc9cf5ebb09	Amazon.de	Books > kindle_ebook	\N	2	kindle_ebook	t	1	t	2025-08-08 21:29:14.495164	2025-08-08 21:29:14.495164
634fd830-7dc4-4b04-b8c2-b4d744a94322	Amazon.de	Books > kindle_ebook > Bücher & Literatur	Books > kindle_ebook	3	Bücher & Literatur	t	1	t	2025-08-08 21:29:14.539321	2025-08-08 21:29:14.539321
2946777b-a7f5-474a-b5d3-eb310510deff	Amazon.de	Books > kindle_ebook > Bücher & Literatur > Fantasy	Books > kindle_ebook > Bücher & Literatur	4	Fantasy	t	1	t	2025-08-08 21:29:14.583285	2025-08-08 21:29:14.583285
d782d43b-d3c7-456b-9d01-92913c0ed65d	Amazon.de	Books > kindle_ebook > Bücher & Literatur > Fantasy > High Fantasy	Books > kindle_ebook > Bücher & Literatur > Fantasy	5	High Fantasy	t	1	t	2025-08-08 21:29:14.628041	2025-08-08 21:29:14.628041
65486cba-7240-4cf0-90b6-2baaf3928de2	Amazon.de	Books > kindle_ebook > Bücher & Literatur > Fantasy > High Fantasy > Episch	Books > kindle_ebook > Bücher & Literatur > Fantasy > High Fantasy	6	Episch	t	1	t	2025-08-08 21:29:14.67196	2025-08-08 21:29:14.67196
432cfcc5-2d4d-4069-abf2-af61e8e53743	Amazon.de	Books > kindle_ebook > Bücher & Literatur > Fantasy > High Fantasy > Episch > Mittelalterlich	Books > kindle_ebook > Bücher & Literatur > Fantasy > High Fantasy > Episch	7	Mittelalterlich	t	1	t	2025-08-08 21:29:14.715993	2025-08-08 21:29:14.715993
630b9aed-7280-4598-8149-0b665ef1d48b	Amazon.de	Books > print_kdp_paperback	\N	2	print_kdp_paperback	t	1	t	2025-08-08 21:29:14.760178	2025-08-08 21:29:14.760178
764ed07f-da2b-4690-8aab-132bb09d3d1a	Amazon.de	Books > print_kdp_paperback > Bücher & Literatur	Books > print_kdp_paperback	3	Bücher & Literatur	t	1	t	2025-08-08 21:29:14.804109	2025-08-08 21:29:14.804109
cb40686b-df2c-409b-9a2d-b88f522e57fa	Amazon.de	Books > print_kdp_paperback > Bücher & Literatur > Fantasy	Books > print_kdp_paperback > Bücher & Literatur	4	Fantasy	t	1	t	2025-08-08 21:29:14.849262	2025-08-08 21:29:14.849262
e789dff9-c202-4a13-a315-364a6cb7cb7a	Amazon.de	Books > print_kdp_paperback > Bücher & Literatur > Fantasy > High Fantasy	Books > print_kdp_paperback > Bücher & Literatur > Fantasy	5	High Fantasy	t	1	t	2025-08-08 21:29:14.893282	2025-08-08 21:29:14.893282
e7ab356a-692a-4345-9024-eb8328119ef8	Amazon.de	Books > print_kdp_paperback > Bücher & Literatur > Fantasy > High Fantasy > Episch	Books > print_kdp_paperback > Bücher & Literatur > Fantasy > High Fantasy	6	Episch	t	1	t	2025-08-08 21:29:14.937702	2025-08-08 21:29:14.937702
ebf61650-c1c2-4945-b845-5d4d8d76f666	Amazon.de	Books > print_kdp_paperback > Bücher & Literatur > Fantasy > High Fantasy > Episch > Mittelalterlich	Books > print_kdp_paperback > Bücher & Literatur > Fantasy > High Fantasy > Episch	7	Mittelalterlich	t	1	t	2025-08-08 21:29:14.982971	2025-08-08 21:29:14.982971
0639ddf1-ae94-4f5f-a740-ae5984190c10	Amazon.co.uk	Books > print_kdp_paperback > Children & Teens	Books > print_kdp_paperback	3	Children & Teens	t	1	t	2025-08-08 21:29:15.033868	2025-08-08 21:29:15.033868
a3d3baca-d746-495e-912a-65460041ba77	Amazon.co.uk	Books > print_kdp_paperback > Children & Teens > Children's Books	Books > print_kdp_paperback > Children & Teens	4	Children's Books	t	1	t	2025-08-08 21:29:15.081663	2025-08-08 21:29:15.081663
3e5c2d31-44c3-4153-ae0e-dea963f80f28	Amazon.co.uk	Books > print_kdp_paperback > Children & Teens > Children's Books > Picture Books	Books > print_kdp_paperback > Children & Teens > Children's Books	5	Picture Books	t	1	t	2025-08-08 21:29:15.125576	2025-08-08 21:29:15.125576
6779781b-a97c-44ee-b5ac-f6c534de3421	Amazon.co.uk	Books > print_kdp_paperback > Children & Teens > Children's Books > Picture Books > Animals	Books > print_kdp_paperback > Children & Teens > Children's Books > Picture Books	6	Animals	t	1	t	2025-08-08 21:29:15.170123	2025-08-08 21:29:15.170123
25a74ccf-3bd1-4879-8a71-568b1829d7a0	Amazon.co.uk	Books > kindle_ebook > Children & Teens	Books > kindle_ebook	3	Children & Teens	t	1	t	2025-08-08 21:29:15.214309	2025-08-08 21:29:15.214309
47f4a898-720b-406d-9bb9-734a5b8832f9	Amazon.co.uk	Books > kindle_ebook > Children & Teens > Children's Books	Books > kindle_ebook > Children & Teens	4	Children's Books	t	1	t	2025-08-08 21:29:15.258466	2025-08-08 21:29:15.258466
2ce4352c-e7e4-465d-a119-b07c741ca106	Amazon.co.uk	Books > kindle_ebook > Children & Teens > Children's Books > Picture Books	Books > kindle_ebook > Children & Teens > Children's Books	5	Picture Books	t	1	t	2025-08-08 21:29:15.302443	2025-08-08 21:29:15.302443
6e9877e0-8a18-4850-8eef-d083fddf3304	Amazon.co.uk	Books > kindle_ebook > Children & Teens > Children's Books > Picture Books > Animals	Books > kindle_ebook > Children & Teens > Children's Books > Picture Books	6	Animals	t	1	t	2025-08-08 21:29:15.346496	2025-08-08 21:29:15.346496
f34be675-047e-48c8-bf0a-6b51e47dbbcc	Amazon.es	Books > kindle_ebook	\N	2	kindle_ebook	t	1	t	2025-08-08 21:29:15.390362	2025-08-08 21:29:15.390362
cbd479f6-1755-4056-8ee9-20a2701d54d3	Amazon.es	Books > kindle_ebook > Ciencia, Tecnología y Medicina	Books > kindle_ebook	3	Ciencia, Tecnología y Medicina	t	1	t	2025-08-08 21:29:15.434326	2025-08-08 21:29:15.434326
d0377650-b88f-4fef-88a0-e313631abe65	Amazon.es	Books > kindle_ebook > Ciencia, Tecnología y Medicina > Informática	Books > kindle_ebook > Ciencia, Tecnología y Medicina	4	Informática	t	1	t	2025-08-08 21:29:15.482456	2025-08-08 21:29:15.482456
fd19fd56-4ab2-470a-920b-926914007375	Amazon.es	Books > kindle_ebook > Ciencia, Tecnología y Medicina > Informática > Programación	Books > kindle_ebook > Ciencia, Tecnología y Medicina > Informática	5	Programación	t	1	t	2025-08-08 21:29:15.527057	2025-08-08 21:29:15.527057
4190bf26-2bf6-4d51-bb0b-4a4b54eb110f	Amazon.es	Books > kindle_ebook > Ciencia, Tecnología y Medicina > Informática > Programación > Python	Books > kindle_ebook > Ciencia, Tecnología y Medicina > Informática > Programación	6	Python	t	1	t	2025-08-08 21:29:15.577252	2025-08-08 21:29:15.577252
c4bf1f7f-a6ab-4698-b3b8-b46145e75018	Amazon.es	Books > kindle_ebook > Ciencia, Tecnología y Medicina > Informática > Programación > Python > Ciencia de datos	Books > kindle_ebook > Ciencia, Tecnología y Medicina > Informática > Programación > Python	7	Ciencia de datos	t	1	t	2025-08-08 21:29:15.622033	2025-08-08 21:29:15.622033
5c8778e7-bf50-4548-a4ce-219f3d652e10	Amazon.es	Books > print_kdp_paperback	\N	2	print_kdp_paperback	t	1	t	2025-08-08 21:29:15.66621	2025-08-08 21:29:15.66621
9fe163c8-b581-4fac-a647-da173d20183b	Amazon.es	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina	Books > print_kdp_paperback	3	Ciencia, Tecnología y Medicina	t	1	t	2025-08-08 21:29:15.710531	2025-08-08 21:29:15.710531
d8e2b938-bc5d-4fc6-933e-5a0acf8573b2	Amazon.es	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina > Informática	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina	4	Informática	t	1	t	2025-08-08 21:29:15.754602	2025-08-08 21:29:15.754602
d28a44f2-1486-415d-9ab7-4761b546d2ca	Amazon.es	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina > Informática > Programación	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina > Informática	5	Programación	t	1	t	2025-08-08 21:29:15.798557	2025-08-08 21:29:15.798557
e12f98d5-8de9-4f06-9457-d770376880b4	Amazon.es	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina > Informática > Programación > Python	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina > Informática > Programación	6	Python	t	1	t	2025-08-08 21:29:15.84259	2025-08-08 21:29:15.84259
09a5e3b0-2b94-4554-b991-6c7f0d63758a	Amazon.es	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina > Informática > Programación > Python > Ciencia de datos	Books > print_kdp_paperback > Ciencia, Tecnología y Medicina > Informática > Programación > Python	7	Ciencia de datos	t	1	t	2025-08-08 21:29:15.891575	2025-08-08 21:29:15.891575
a37bff66-78f8-4dd3-a11b-7939f9030b37	Amazon.fr	Books > print_kdp_paperback	\N	2	print_kdp_paperback	t	1	t	2025-08-08 21:29:15.935481	2025-08-08 21:29:15.935481
325fad69-49f9-47a0-8f9e-c859aa45272b	Amazon.fr	Books > print_kdp_paperback > Enfants & Adolescents	Books > print_kdp_paperback	3	Enfants & Adolescents	t	1	t	2025-08-08 21:29:15.979504	2025-08-08 21:29:15.979504
209b0219-b6a0-4a3b-a698-d9b7fe0310b4	Amazon.fr	Books > print_kdp_paperback > Enfants & Adolescents > Livres pour enfants	Books > print_kdp_paperback > Enfants & Adolescents	4	Livres pour enfants	t	1	t	2025-08-08 21:29:16.023966	2025-08-08 21:29:16.023966
ec1e281f-3df1-48ae-bfda-c59affd2eae4	Amazon.fr	Books > print_kdp_paperback > Enfants & Adolescents > Livres pour enfants > Albums illustrés	Books > print_kdp_paperback > Enfants & Adolescents > Livres pour enfants	5	Albums illustrés	t	1	t	2025-08-08 21:29:16.068617	2025-08-08 21:29:16.068617
87ecfa66-0917-4edf-bb74-c94f56c4fa92	Amazon.fr	Books > print_kdp_paperback > Enfants & Adolescents > Livres pour enfants > Albums illustrés > Animaux	Books > print_kdp_paperback > Enfants & Adolescents > Livres pour enfants > Albums illustrés	6	Animaux	t	1	t	2025-08-08 21:29:16.112994	2025-08-08 21:29:16.112994
69d35920-98d8-4edf-8aa8-a469f74773cc	Amazon.fr	Books > kindle_ebook	\N	2	kindle_ebook	t	1	t	2025-08-08 21:29:16.156966	2025-08-08 21:29:16.156966
7cb8895b-b66e-44e2-a765-373ed4dc626c	Amazon.fr	Books > kindle_ebook > Enfants & Adolescents	Books > kindle_ebook	3	Enfants & Adolescents	t	1	t	2025-08-08 21:29:16.20138	2025-08-08 21:29:16.20138
1d9afaed-45e3-4013-b280-d18e0aae520e	Amazon.fr	Books > kindle_ebook > Enfants & Adolescents > Livres pour enfants	Books > kindle_ebook > Enfants & Adolescents	4	Livres pour enfants	t	1	t	2025-08-08 21:29:16.245819	2025-08-08 21:29:16.245819
2fc4d8e0-22ef-4e5b-a6bd-19163e4dd318	Amazon.fr	Books > kindle_ebook > Enfants & Adolescents > Livres pour enfants > Albums illustrés	Books > kindle_ebook > Enfants & Adolescents > Livres pour enfants	5	Albums illustrés	t	1	t	2025-08-08 21:29:16.289813	2025-08-08 21:29:16.289813
c5fdf515-feb5-4858-aaf5-f3b6751ae1b9	Amazon.fr	Books > kindle_ebook > Enfants & Adolescents > Livres pour enfants > Albums illustrés > Animaux	Books > kindle_ebook > Enfants & Adolescents > Livres pour enfants > Albums illustrés	6	Animaux	t	1	t	2025-08-08 21:29:16.333665	2025-08-08 21:29:16.333665
e8525fbc-001d-4271-8052-4be773bf289b	Amazon.fr	Books > print_kdp_paperback > Entreprise & Bourse	Books > print_kdp_paperback	3	Entreprise & Bourse	t	1	t	2025-08-08 21:29:16.377769	2025-08-08 21:29:16.377769
5cbd6a84-e7cf-47d2-9f4e-e9d6eb102427	Amazon.fr	Books > print_kdp_paperback > Entreprise & Bourse > Entrepreneuriat	Books > print_kdp_paperback > Entreprise & Bourse	4	Entrepreneuriat	t	1	t	2025-08-08 21:29:16.421685	2025-08-08 21:29:16.421685
4d5ec743-f328-4124-b109-d436598a9c96	Amazon.fr	Books > print_kdp_paperback > Entreprise & Bourse > Entrepreneuriat > Start-up	Books > print_kdp_paperback > Entreprise & Bourse > Entrepreneuriat	5	Start-up	t	1	t	2025-08-08 21:29:16.465697	2025-08-08 21:29:16.465697
40b9a3fa-ff2a-4682-90b7-2e0461223793	Amazon.fr	Books > print_kdp_paperback > Entreprise & Bourse > Entrepreneuriat > Start-up > Levée de fonds	Books > print_kdp_paperback > Entreprise & Bourse > Entrepreneuriat > Start-up	6	Levée de fonds	t	1	t	2025-08-08 21:29:16.509679	2025-08-08 21:29:16.509679
24e115b1-5343-4207-a720-c431cae73985	Amazon.fr	Books > kindle_ebook > Entreprise & Bourse	Books > kindle_ebook	3	Entreprise & Bourse	t	1	t	2025-08-08 21:29:16.553575	2025-08-08 21:29:16.553575
5a867f2c-3483-4949-a608-e5f23f4e3fe2	Amazon.fr	Books > kindle_ebook > Entreprise & Bourse > Entrepreneuriat	Books > kindle_ebook > Entreprise & Bourse	4	Entrepreneuriat	t	1	t	2025-08-08 21:29:16.597757	2025-08-08 21:29:16.597757
8acce923-6787-4626-990d-3392163b1eb1	Amazon.fr	Books > kindle_ebook > Entreprise & Bourse > Entrepreneuriat > Start-up	Books > kindle_ebook > Entreprise & Bourse > Entrepreneuriat	5	Start-up	t	1	t	2025-08-08 21:29:16.641988	2025-08-08 21:29:16.641988
bed25549-9e87-4ea2-b757-0c140c7a25a0	Amazon.fr	Books > kindle_ebook > Entreprise & Bourse > Entrepreneuriat > Start-up > Levée de fonds	Books > kindle_ebook > Entreprise & Bourse > Entrepreneuriat > Start-up	6	Levée de fonds	t	1	t	2025-08-08 21:29:16.687366	2025-08-08 21:29:16.687366
b9b5ac75-7483-44f4-9b91-d88dbf4e4745	Amazon.fr	Books > kindle_ebook > Guide & Conseils	Books > kindle_ebook	3	Guide & Conseils	t	1	t	2025-08-08 21:29:16.731695	2025-08-08 21:29:16.731695
26bc1a8c-198f-485c-b601-915e6af4c1f4	Amazon.fr	Books > kindle_ebook > Guide & Conseils > Bien-être	Books > kindle_ebook > Guide & Conseils	4	Bien-être	t	1	t	2025-08-08 21:29:16.775981	2025-08-08 21:29:16.775981
d2418d29-b5d4-40a5-819d-dd4cbbacf544	Amazon.fr	Books > kindle_ebook > Guide & Conseils > Bien-être > Méditation	Books > kindle_ebook > Guide & Conseils > Bien-être	5	Méditation	t	1	t	2025-08-08 21:29:16.820639	2025-08-08 21:29:16.820639
34727dd7-da73-4fee-9892-cf37dced831d	Amazon.fr	Books > kindle_ebook > Guide & Conseils > Bien-être > Méditation > Pleine conscience	Books > kindle_ebook > Guide & Conseils > Bien-être > Méditation	6	Pleine conscience	t	1	t	2025-08-08 21:29:16.864841	2025-08-08 21:29:16.864841
daeda40c-1756-4b0d-b746-f405ecb95b93	Amazon.fr	Books > kindle_ebook > Guide & Conseils > Bien-être > Méditation > Pleine conscience > Yoga	Books > kindle_ebook > Guide & Conseils > Bien-être > Méditation > Pleine conscience	7	Yoga	t	1	t	2025-08-08 21:29:16.909107	2025-08-08 21:29:16.909107
1bc08321-3908-4a4c-9042-c6e9bb2d3201	Amazon.fr	Books > kindle_ebook > Guide & Conseils > Bien-être > Méditation > Pleine conscience > Yoga > Yoga sur chaise	Books > kindle_ebook > Guide & Conseils > Bien-être > Méditation > Pleine conscience > Yoga	8	Yoga sur chaise	t	1	t	2025-08-08 21:29:16.953343	2025-08-08 21:29:16.953343
73a656c6-2b55-4c52-85f9-2368051971ed	Amazon.fr	Books > print_kdp_paperback > Guide & Conseils	Books > print_kdp_paperback	3	Guide & Conseils	t	1	t	2025-08-08 21:29:16.997617	2025-08-08 21:29:16.997617
d335c73c-8b8d-4394-91e7-60bc09708f5a	Amazon.fr	Books > print_kdp_paperback > Guide & Conseils > Bien-être	Books > print_kdp_paperback > Guide & Conseils	4	Bien-être	t	1	t	2025-08-08 21:29:17.041502	2025-08-08 21:29:17.041502
5ef84848-99a4-4ea8-8bdd-86cda289372f	Amazon.fr	Books > print_kdp_paperback > Guide & Conseils > Bien-être > Méditation	Books > print_kdp_paperback > Guide & Conseils > Bien-être	5	Méditation	t	1	t	2025-08-08 21:29:17.085394	2025-08-08 21:29:17.085394
580c6847-7944-4a17-911b-ed10874ccf8b	Amazon.fr	Books > print_kdp_paperback > Guide & Conseils > Bien-être > Méditation > Pleine conscience	Books > print_kdp_paperback > Guide & Conseils > Bien-être > Méditation	6	Pleine conscience	t	1	t	2025-08-08 21:29:17.129474	2025-08-08 21:29:17.129474
d7f1e62c-c346-4ab4-acb0-b4a36e5f7907	Amazon.fr	Books > print_kdp_paperback > Guide & Conseils > Bien-être > Méditation > Pleine conscience > Yoga	Books > print_kdp_paperback > Guide & Conseils > Bien-être > Méditation > Pleine conscience	7	Yoga	t	1	t	2025-08-08 21:29:17.173439	2025-08-08 21:29:17.173439
040e99d3-08b7-4a58-bdbb-1ca8e730d392	Amazon.it	Books > kindle_ebook > Guide e Consigli	Books > kindle_ebook	3	Guide e Consigli	t	1	t	2025-08-08 21:29:17.217369	2025-08-08 21:29:17.217369
fec3f10b-c963-4cd7-8859-266423f1d92e	Amazon.it	Books > kindle_ebook > Guide e Consigli > Benessere	Books > kindle_ebook > Guide e Consigli	4	Benessere	t	1	t	2025-08-08 21:29:17.261334	2025-08-08 21:29:17.261334
c6a2ba2b-cc3d-4c61-9302-2d2496bf7ae0	Amazon.it	Books > kindle_ebook > Guide e Consigli > Benessere > Meditazione	Books > kindle_ebook > Guide e Consigli > Benessere	5	Meditazione	t	1	t	2025-08-08 21:29:17.305616	2025-08-08 21:29:17.305616
51e8c240-61e3-4ec5-9304-495105873cfb	Amazon.it	Books > kindle_ebook > Guide e Consigli > Benessere > Meditazione > Consapevolezza	Books > kindle_ebook > Guide e Consigli > Benessere > Meditazione	6	Consapevolezza	t	1	t	2025-08-08 21:29:17.34955	2025-08-08 21:29:17.34955
b468f6f4-3235-45ad-aef2-a7c5b8202854	Amazon.it	Books > kindle_ebook > Guide e Consigli > Benessere > Meditazione > Consapevolezza > Yoga	Books > kindle_ebook > Guide e Consigli > Benessere > Meditazione > Consapevolezza	7	Yoga	t	1	t	2025-08-08 21:29:17.393686	2025-08-08 21:29:17.393686
c3cb4536-d99e-41a5-a577-f98149f5669c	Amazon.it	Books > print_kdp_paperback > Guide e Consigli	Books > print_kdp_paperback	3	Guide e Consigli	t	1	t	2025-08-08 21:29:17.437703	2025-08-08 21:29:17.437703
b9b5ad17-580f-44a9-b610-6eca8e437fd9	Amazon.it	Books > print_kdp_paperback > Guide e Consigli > Benessere	Books > print_kdp_paperback > Guide e Consigli	4	Benessere	t	1	t	2025-08-08 21:29:17.481533	2025-08-08 21:29:17.481533
f82af29e-7258-4587-b038-7ba70b31a8b7	Amazon.it	Books > print_kdp_paperback > Guide e Consigli > Benessere > Meditazione	Books > print_kdp_paperback > Guide e Consigli > Benessere	5	Meditazione	t	1	t	2025-08-08 21:29:17.525488	2025-08-08 21:29:17.525488
2b8d12ba-01fd-451b-81bb-1f55cfe32300	Amazon.it	Books > print_kdp_paperback > Guide e Consigli > Benessere > Meditazione > Consapevolezza	Books > print_kdp_paperback > Guide e Consigli > Benessere > Meditazione	6	Consapevolezza	t	1	t	2025-08-08 21:29:17.56931	2025-08-08 21:29:17.56931
feaf5c0b-1fd2-41a2-8dc5-42e08e1a7a0e	Amazon.it	Books > print_kdp_paperback > Guide e Consigli > Benessere > Meditazione > Consapevolezza > Yoga	Books > print_kdp_paperback > Guide e Consigli > Benessere > Meditazione > Consapevolezza	7	Yoga	t	1	t	2025-08-08 21:29:17.613462	2025-08-08 21:29:17.613462
201c9612-1e07-4123-9058-40d1a16c64b6	Amazon.co.uk	Books > kindle_ebook > Guides & Advice	Books > kindle_ebook	3	Guides & Advice	t	1	t	2025-08-08 21:29:17.657375	2025-08-08 21:29:17.657375
6278f5e5-f77b-4d65-aec9-404bd3db3410	Amazon.co.uk	Books > kindle_ebook > Guides & Advice > Wellness	Books > kindle_ebook > Guides & Advice	4	Wellness	t	1	t	2025-08-08 21:29:17.701353	2025-08-08 21:29:17.701353
c649a7e4-31b5-410f-94cc-e3606868c4f6	Amazon.co.uk	Books > kindle_ebook > Guides & Advice > Wellness > Meditation	Books > kindle_ebook > Guides & Advice > Wellness	5	Meditation	t	1	t	2025-08-08 21:29:17.745391	2025-08-08 21:29:17.745391
a5a1a3fe-839f-49bc-9367-fb5013b3a629	Amazon.co.uk	Books > kindle_ebook > Guides & Advice > Wellness > Meditation > Mindfulness	Books > kindle_ebook > Guides & Advice > Wellness > Meditation	6	Mindfulness	t	1	t	2025-08-08 21:29:17.789316	2025-08-08 21:29:17.789316
57b207b6-ce5f-410c-9d86-ab225eb31dae	Amazon.co.uk	Books > kindle_ebook > Guides & Advice > Wellness > Meditation > Mindfulness > Yoga	Books > kindle_ebook > Guides & Advice > Wellness > Meditation > Mindfulness	7	Yoga	t	1	t	2025-08-08 21:29:17.833413	2025-08-08 21:29:17.833413
42857469-e547-4545-98d8-ad08f6e8ad61	Amazon.co.uk	Books > print_kdp_paperback > Guides & Advice	Books > print_kdp_paperback	3	Guides & Advice	t	1	t	2025-08-08 21:29:17.877402	2025-08-08 21:29:17.877402
a3628e1a-7a27-4857-bd4e-9bcf11965f5d	Amazon.co.uk	Books > print_kdp_paperback > Guides & Advice > Wellness	Books > print_kdp_paperback > Guides & Advice	4	Wellness	t	1	t	2025-08-08 21:29:17.921383	2025-08-08 21:29:17.921383
4a0b57d5-560c-4ec3-8a92-6ea74dafcb7b	Amazon.co.uk	Books > print_kdp_paperback > Guides & Advice > Wellness > Meditation	Books > print_kdp_paperback > Guides & Advice > Wellness	5	Meditation	t	1	t	2025-08-08 21:29:17.965448	2025-08-08 21:29:17.965448
fff26012-1666-4827-b8ce-3e97a0a0fef6	Amazon.co.uk	Books > print_kdp_paperback > Guides & Advice > Wellness > Meditation > Mindfulness	Books > print_kdp_paperback > Guides & Advice > Wellness > Meditation	6	Mindfulness	t	1	t	2025-08-08 21:29:18.009551	2025-08-08 21:29:18.009551
da713b41-9281-44c1-85a4-75afdba829c5	Amazon.co.uk	Books > print_kdp_paperback > Guides & Advice > Wellness > Meditation > Mindfulness > Yoga	Books > print_kdp_paperback > Guides & Advice > Wellness > Meditation > Mindfulness	7	Yoga	t	1	t	2025-08-08 21:29:18.053741	2025-08-08 21:29:18.053741
e7482b39-0b46-40f0-a474-a695f8e62758	Amazon.es	Books > kindle_ebook > Guías y Consejos	Books > kindle_ebook	3	Guías y Consejos	t	1	t	2025-08-08 21:29:18.097772	2025-08-08 21:29:18.097772
0d5166eb-0800-41c2-bc0c-2596b36796b1	Amazon.es	Books > kindle_ebook > Guías y Consejos > Bienestar	Books > kindle_ebook > Guías y Consejos	4	Bienestar	t	1	t	2025-08-08 21:29:18.141871	2025-08-08 21:29:18.141871
73922c44-64eb-4327-b29f-3776236a0c21	Amazon.es	Books > kindle_ebook > Guías y Consejos > Bienestar > Meditación	Books > kindle_ebook > Guías y Consejos > Bienestar	5	Meditación	t	1	t	2025-08-08 21:29:18.186267	2025-08-08 21:29:18.186267
a3bbe87b-a18e-4196-8a5d-cf8ec4a0ac64	Amazon.es	Books > kindle_ebook > Guías y Consejos > Bienestar > Meditación > Atención plena	Books > kindle_ebook > Guías y Consejos > Bienestar > Meditación	6	Atención plena	t	1	t	2025-08-08 21:29:18.230139	2025-08-08 21:29:18.230139
ad0590b9-af69-433c-94d9-c9321c3d8d34	Amazon.es	Books > kindle_ebook > Guías y Consejos > Bienestar > Meditación > Atención plena > Yoga	Books > kindle_ebook > Guías y Consejos > Bienestar > Meditación > Atención plena	7	Yoga	t	1	t	2025-08-08 21:29:18.27404	2025-08-08 21:29:18.27404
64c01809-4e0f-4aaa-912f-fed7418f8e0e	Amazon.es	Books > print_kdp_paperback > Guías y Consejos	Books > print_kdp_paperback	3	Guías y Consejos	t	1	t	2025-08-08 21:29:18.318111	2025-08-08 21:29:18.318111
2164dc01-312a-4198-bf00-e588adfa8c50	Amazon.es	Books > print_kdp_paperback > Guías y Consejos > Bienestar	Books > print_kdp_paperback > Guías y Consejos	4	Bienestar	t	1	t	2025-08-08 21:29:18.362039	2025-08-08 21:29:18.362039
eb8b58de-8b84-4f83-b929-2fec6d8320e5	Amazon.es	Books > print_kdp_paperback > Guías y Consejos > Bienestar > Meditación	Books > print_kdp_paperback > Guías y Consejos > Bienestar	5	Meditación	t	1	t	2025-08-08 21:29:18.406115	2025-08-08 21:29:18.406115
a1b5f0c9-9aed-404c-befb-ddbd23483bc9	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Fantasy > High Fantasy	Books > kindle_ebook > Littérature & Fiction > Fantasy	5	High Fantasy	t	1	t	2025-08-08 21:29:21.249168	2025-08-08 21:29:21.249168
53a83221-b85b-48e0-b11c-76a4af2a8d41	Amazon.es	Books > print_kdp_paperback > Guías y Consejos > Bienestar > Meditación > Atención plena	Books > print_kdp_paperback > Guías y Consejos > Bienestar > Meditación	6	Atención plena	t	1	t	2025-08-08 21:29:18.450135	2025-08-08 21:29:18.450135
cfea5371-91e9-4fe5-a97b-484f8b9d15ee	Amazon.es	Books > print_kdp_paperback > Guías y Consejos > Bienestar > Meditación > Atención plena > Yoga	Books > print_kdp_paperback > Guías y Consejos > Bienestar > Meditación > Atención plena	7	Yoga	t	1	t	2025-08-08 21:29:18.494174	2025-08-08 21:29:18.494174
1b7342d8-b4cf-4733-9a57-2accff65c005	Amazon.es	Books > kindle_ebook > Infantil y Juvenil	Books > kindle_ebook	3	Infantil y Juvenil	t	1	t	2025-08-08 21:29:18.538121	2025-08-08 21:29:18.538121
73d0ac6d-835a-4553-9f78-e881cd05fd7d	Amazon.es	Books > kindle_ebook > Infantil y Juvenil > Libros infantiles	Books > kindle_ebook > Infantil y Juvenil	4	Libros infantiles	t	1	t	2025-08-08 21:29:18.582213	2025-08-08 21:29:18.582213
cd090b7e-928f-46eb-8d57-be34b5c6a517	Amazon.es	Books > kindle_ebook > Infantil y Juvenil > Libros infantiles > Libros ilustrados	Books > kindle_ebook > Infantil y Juvenil > Libros infantiles	5	Libros ilustrados	t	1	t	2025-08-08 21:29:18.62634	2025-08-08 21:29:18.62634
c50805c2-ef49-4151-b17d-921afdb54490	Amazon.es	Books > kindle_ebook > Infantil y Juvenil > Libros infantiles > Libros ilustrados > Animales	Books > kindle_ebook > Infantil y Juvenil > Libros infantiles > Libros ilustrados	6	Animales	t	1	t	2025-08-08 21:29:18.670152	2025-08-08 21:29:18.670152
c302b7b7-4c5e-42ca-b785-305cb4931d36	Amazon.es	Books > print_kdp_paperback > Infantil y Juvenil	Books > print_kdp_paperback	3	Infantil y Juvenil	t	1	t	2025-08-08 21:29:18.714246	2025-08-08 21:29:18.714246
f23e0a5c-be91-484f-a05b-487fb2ba47cc	Amazon.es	Books > print_kdp_paperback > Infantil y Juvenil > Libros infantiles	Books > print_kdp_paperback > Infantil y Juvenil	4	Libros infantiles	t	1	t	2025-08-08 21:29:18.758219	2025-08-08 21:29:18.758219
e721219f-4572-4284-ac0b-b06d3492efe9	Amazon.es	Books > print_kdp_paperback > Infantil y Juvenil > Libros infantiles > Libros ilustrados	Books > print_kdp_paperback > Infantil y Juvenil > Libros infantiles	5	Libros ilustrados	t	1	t	2025-08-08 21:29:18.802231	2025-08-08 21:29:18.802231
fa0ff755-e3a6-4a90-9be8-00f3461fda3d	Amazon.es	Books > print_kdp_paperback > Infantil y Juvenil > Libros infantiles > Libros ilustrados > Animales	Books > print_kdp_paperback > Infantil y Juvenil > Libros infantiles > Libros ilustrados	6	Animales	t	1	t	2025-08-08 21:29:18.846296	2025-08-08 21:29:18.846296
0d32eb38-39f6-4328-99c5-29407228f8c8	Amazon.de	Books > kindle_ebook > Kinder & Jugendbücher	Books > kindle_ebook	3	Kinder & Jugendbücher	t	1	t	2025-08-08 21:29:18.890191	2025-08-08 21:29:18.890191
f3a9ddca-9a42-4a90-9104-7c24e11c9786	Amazon.de	Books > kindle_ebook > Kinder & Jugendbücher > Kinderbücher	Books > kindle_ebook > Kinder & Jugendbücher	4	Kinderbücher	t	1	t	2025-08-08 21:29:18.934904	2025-08-08 21:29:18.934904
65f48de9-8c5e-401b-9604-9a05b56a2742	Amazon.de	Books > kindle_ebook > Kinder & Jugendbücher > Kinderbücher > Bilderbücher	Books > kindle_ebook > Kinder & Jugendbücher > Kinderbücher	5	Bilderbücher	t	1	t	2025-08-08 21:29:18.979044	2025-08-08 21:29:18.979044
a55af6a4-cad1-410b-b11a-9702a56ef7c7	Amazon.de	Books > kindle_ebook > Kinder & Jugendbücher > Kinderbücher > Bilderbücher > Tiere	Books > kindle_ebook > Kinder & Jugendbücher > Kinderbücher > Bilderbücher	6	Tiere	t	1	t	2025-08-08 21:29:19.023173	2025-08-08 21:29:19.023173
e4246821-4b3f-4f25-9347-ce53ebcbeb72	Amazon.de	Books > print_kdp_paperback > Kinder & Jugendbücher	Books > print_kdp_paperback	3	Kinder & Jugendbücher	t	1	t	2025-08-08 21:29:19.067864	2025-08-08 21:29:19.067864
b7bddf87-2ab1-4fe3-874a-2ae424b74ef0	Amazon.de	Books > print_kdp_paperback > Kinder & Jugendbücher > Kinderbücher	Books > print_kdp_paperback > Kinder & Jugendbücher	4	Kinderbücher	t	1	t	2025-08-08 21:29:19.112492	2025-08-08 21:29:19.112492
47736a6c-fb83-4c67-b7a2-bd06ea5b3d59	Amazon.de	Books > print_kdp_paperback > Kinder & Jugendbücher > Kinderbücher > Bilderbücher	Books > print_kdp_paperback > Kinder & Jugendbücher > Kinderbücher	5	Bilderbücher	t	1	t	2025-08-08 21:29:19.156591	2025-08-08 21:29:19.156591
75910449-1490-4119-81b4-309ce12d8a9f	Amazon.de	Books > print_kdp_paperback > Kinder & Jugendbücher > Kinderbücher > Bilderbücher > Tiere	Books > print_kdp_paperback > Kinder & Jugendbücher > Kinderbücher > Bilderbücher	6	Tiere	t	1	t	2025-08-08 21:29:19.201386	2025-08-08 21:29:19.201386
6d03a523-ce43-4afe-a15b-feaa08639f2c	Amazon.it	Books > print_kdp_paperback > Libri e Letteratura	Books > print_kdp_paperback	3	Libri e Letteratura	t	1	t	2025-08-08 21:29:19.245532	2025-08-08 21:29:19.245532
f69fc81e-2747-453c-951c-fa43ef0bf00e	Amazon.it	Books > print_kdp_paperback > Libri e Letteratura > Fantasy	Books > print_kdp_paperback > Libri e Letteratura	4	Fantasy	t	1	t	2025-08-08 21:29:19.289379	2025-08-08 21:29:19.289379
3f166b85-90f7-4d52-a43c-63706f90abbd	Amazon.it	Books > print_kdp_paperback > Libri e Letteratura > Fantasy > High Fantasy	Books > print_kdp_paperback > Libri e Letteratura > Fantasy	5	High Fantasy	t	1	t	2025-08-08 21:29:19.333547	2025-08-08 21:29:19.333547
f6d08341-3ffa-4146-8b67-6acafef9f021	Amazon.it	Books > print_kdp_paperback > Libri e Letteratura > Fantasy > High Fantasy > Epico	Books > print_kdp_paperback > Libri e Letteratura > Fantasy > High Fantasy	6	Epico	t	1	t	2025-08-08 21:29:19.377503	2025-08-08 21:29:19.377503
60b528bb-5bad-446b-b426-ad47adc6e378	Amazon.it	Books > print_kdp_paperback > Libri e Letteratura > Fantasy > High Fantasy > Epico > Medievale	Books > print_kdp_paperback > Libri e Letteratura > Fantasy > High Fantasy > Epico	7	Medievale	t	1	t	2025-08-08 21:29:19.421974	2025-08-08 21:29:19.421974
13c2e4e4-92e3-4232-82b9-e03128eb7e39	Amazon.it	Books > kindle_ebook > Libri e Letteratura	Books > kindle_ebook	3	Libri e Letteratura	t	1	t	2025-08-08 21:29:19.465737	2025-08-08 21:29:19.465737
9b5dab52-85b3-4d13-b995-d8a7448ad819	Amazon.it	Books > kindle_ebook > Libri e Letteratura > Fantasy	Books > kindle_ebook > Libri e Letteratura	4	Fantasy	t	1	t	2025-08-08 21:29:19.515585	2025-08-08 21:29:19.515585
4b2db57d-1ece-4763-a64d-a14e73a0f36d	Amazon.it	Books > kindle_ebook > Libri e Letteratura > Fantasy > High Fantasy	Books > kindle_ebook > Libri e Letteratura > Fantasy	5	High Fantasy	t	1	t	2025-08-08 21:29:19.559849	2025-08-08 21:29:19.559849
1be6cfd3-4424-42ab-bb8a-0ab421482213	Amazon.it	Books > kindle_ebook > Libri e Letteratura > Fantasy > High Fantasy > Epico	Books > kindle_ebook > Libri e Letteratura > Fantasy > High Fantasy	6	Epico	t	1	t	2025-08-08 21:29:19.604032	2025-08-08 21:29:19.604032
50d96de1-0b1b-4899-8b71-e5bae99b4d96	Amazon.it	Books > kindle_ebook > Libri e Letteratura > Fantasy > High Fantasy > Epico > Medievale	Books > kindle_ebook > Libri e Letteratura > Fantasy > High Fantasy > Epico	7	Medievale	t	1	t	2025-08-08 21:29:19.648059	2025-08-08 21:29:19.648059
c808cc63-64a9-4917-9ff2-8aec97fdddaf	Amazon.es	Books > print_kdp_paperback > Libros y Literatura	Books > print_kdp_paperback	3	Libros y Literatura	t	1	t	2025-08-08 21:29:19.692104	2025-08-08 21:29:19.692104
8f174d09-9e76-4b12-ad30-66b6f345647f	Amazon.es	Books > print_kdp_paperback > Libros y Literatura > Fantasía	Books > print_kdp_paperback > Libros y Literatura	4	Fantasía	t	1	t	2025-08-08 21:29:19.736108	2025-08-08 21:29:19.736108
182625c3-17c1-4e1d-b84f-0794df3db643	Amazon.es	Books > print_kdp_paperback > Libros y Literatura > Fantasía > Alta fantasía	Books > print_kdp_paperback > Libros y Literatura > Fantasía	5	Alta fantasía	t	1	t	2025-08-08 21:29:19.780646	2025-08-08 21:29:19.780646
41dbe30f-a2c9-4e9e-a00f-93b7634b5a79	Amazon.es	Books > print_kdp_paperback > Libros y Literatura > Fantasía > Alta fantasía > Épica	Books > print_kdp_paperback > Libros y Literatura > Fantasía > Alta fantasía	6	Épica	t	1	t	2025-08-08 21:29:19.824517	2025-08-08 21:29:19.824517
82247326-0236-4b64-b546-6c9f0b3d2bb4	Amazon.es	Books > print_kdp_paperback > Libros y Literatura > Fantasía > Alta fantasía > Épica > Medieval	Books > print_kdp_paperback > Libros y Literatura > Fantasía > Alta fantasía > Épica	7	Medieval	t	1	t	2025-08-08 21:29:19.868429	2025-08-08 21:29:19.868429
4ec8d51f-843b-4888-893e-389b004d38c8	Amazon.es	Books > kindle_ebook > Libros y Literatura	Books > kindle_ebook	3	Libros y Literatura	t	1	t	2025-08-08 21:29:19.913712	2025-08-08 21:29:19.913712
f0d84af6-26fe-4f25-aaa7-19cdbc03dac6	Amazon.es	Books > kindle_ebook > Libros y Literatura > Fantasía	Books > kindle_ebook > Libros y Literatura	4	Fantasía	t	1	t	2025-08-08 21:29:19.957542	2025-08-08 21:29:19.957542
b7a0ff18-86a0-4375-ad0f-35d1936438c3	Amazon.es	Books > kindle_ebook > Libros y Literatura > Fantasía > Alta fantasía	Books > kindle_ebook > Libros y Literatura > Fantasía	5	Alta fantasía	t	1	t	2025-08-08 21:29:20.001556	2025-08-08 21:29:20.001556
5f57df72-a0ff-4668-b475-57bb65cf5934	Amazon.es	Books > kindle_ebook > Libros y Literatura > Fantasía > Alta fantasía > Épica	Books > kindle_ebook > Libros y Literatura > Fantasía > Alta fantasía	6	Épica	t	1	t	2025-08-08 21:29:20.045414	2025-08-08 21:29:20.045414
9a2bd4ca-2751-4a3f-a917-6f281ef79996	Amazon.es	Books > kindle_ebook > Libros y Literatura > Fantasía > Alta fantasía > Épica > Medieval	Books > kindle_ebook > Libros y Literatura > Fantasía > Alta fantasía > Épica	7	Medieval	t	1	t	2025-08-08 21:29:20.089428	2025-08-08 21:29:20.089428
5bddcc51-5d0e-4b5d-b3d2-936f688fc38e	Amazon.co.uk	Books > print_kdp_paperback > Literature & Fiction	Books > print_kdp_paperback	3	Literature & Fiction	t	1	t	2025-08-08 21:29:20.133452	2025-08-08 21:29:20.133452
6d9dfd9c-9159-4252-b3d8-8b44f18a89b0	Amazon.co.uk	Books > print_kdp_paperback > Literature & Fiction > Fantasy	Books > print_kdp_paperback > Literature & Fiction	4	Fantasy	t	1	t	2025-08-08 21:29:20.18148	2025-08-08 21:29:20.18148
5064feb7-e8f1-4480-8845-695b9517af01	Amazon.co.uk	Books > print_kdp_paperback > Literature & Fiction > Fantasy > High Fantasy	Books > print_kdp_paperback > Literature & Fiction > Fantasy	5	High Fantasy	t	1	t	2025-08-08 21:29:20.225477	2025-08-08 21:29:20.225477
77a8b197-a361-49c7-a262-d0b812b5f879	Amazon.co.uk	Books > print_kdp_paperback > Literature & Fiction > Fantasy > High Fantasy > Epic	Books > print_kdp_paperback > Literature & Fiction > Fantasy > High Fantasy	6	Epic	t	1	t	2025-08-08 21:29:20.269462	2025-08-08 21:29:20.269462
06eef0b5-e116-4c51-9808-824401875abd	Amazon.co.uk	Books > print_kdp_paperback > Literature & Fiction > Fantasy > High Fantasy > Epic > Medieval	Books > print_kdp_paperback > Literature & Fiction > Fantasy > High Fantasy > Epic	7	Medieval	t	1	t	2025-08-08 21:29:20.31339	2025-08-08 21:29:20.31339
a913dea5-b3d3-4632-a969-589e824b700c	Amazon.co.uk	Books > kindle_ebook > Literature & Fiction	Books > kindle_ebook	3	Literature & Fiction	t	1	t	2025-08-08 21:29:20.361529	2025-08-08 21:29:20.361529
14bdda55-1e4b-4ab8-8571-9c1f3767aa11	Amazon.co.uk	Books > kindle_ebook > Literature & Fiction > Fantasy	Books > kindle_ebook > Literature & Fiction	4	Fantasy	t	1	t	2025-08-08 21:29:20.405482	2025-08-08 21:29:20.405482
d2cd2b6d-bd7d-4622-a098-660f97235696	Amazon.co.uk	Books > kindle_ebook > Literature & Fiction > Fantasy > High Fantasy	Books > kindle_ebook > Literature & Fiction > Fantasy	5	High Fantasy	t	1	t	2025-08-08 21:29:20.450031	2025-08-08 21:29:20.450031
0079d098-e903-40c8-8c92-52adc01cae13	Amazon.co.uk	Books > kindle_ebook > Literature & Fiction > Fantasy > High Fantasy > Epic	Books > kindle_ebook > Literature & Fiction > Fantasy > High Fantasy	6	Epic	t	1	t	2025-08-08 21:29:20.493901	2025-08-08 21:29:20.493901
6ee9cba5-d35b-49e7-9e6b-3cb832b2e178	Amazon.co.uk	Books > kindle_ebook > Literature & Fiction > Fantasy > High Fantasy > Epic > Medieval	Books > kindle_ebook > Literature & Fiction > Fantasy > High Fantasy > Epic	7	Medieval	t	1	t	2025-08-08 21:29:20.539628	2025-08-08 21:29:20.539628
a3278943-97dc-4aeb-9413-19d9c066c153	Amazon.fr	Books > print_kdp_paperback > Littérature & Fiction	Books > print_kdp_paperback	3	Littérature & Fiction	t	1	t	2025-08-08 21:29:20.587447	2025-08-08 21:29:20.587447
9388b170-3caa-40b8-9f83-9f2b4185241a	Amazon.fr	Books > print_kdp_paperback > Littérature & Fiction > Fantasy	Books > print_kdp_paperback > Littérature & Fiction	4	Fantasy	t	1	t	2025-08-08 21:29:20.631406	2025-08-08 21:29:20.631406
06e4ce72-0c52-439c-8fa7-136a029ce452	Amazon.fr	Books > print_kdp_paperback > Littérature & Fiction > Fantasy > High Fantasy2	Books > print_kdp_paperback > Littérature & Fiction > Fantasy	5	High Fantasy2	t	1	t	2025-08-08 21:29:20.675325	2025-08-08 21:29:20.675325
f9066b85-7ba1-46a2-a52d-a766a2e2bc36	Amazon.fr	Books > print_kdp_paperback > Littérature & Fiction > Fantasy > High Fantasy2 > Épique	Books > print_kdp_paperback > Littérature & Fiction > Fantasy > High Fantasy2	6	Épique	t	1	t	2025-08-08 21:29:20.719437	2025-08-08 21:29:20.719437
30e3b7bd-2d26-4b2f-bdca-041ba8989f6e	Amazon.fr	Books > print_kdp_paperback > Littérature & Fiction > Fantasy > High Fantasy2 > Épique > Médiéval	Books > print_kdp_paperback > Littérature & Fiction > Fantasy > High Fantasy2 > Épique	7	Médiéval	t	1	t	2025-08-08 21:29:20.763427	2025-08-08 21:29:20.763427
0e248a66-1a89-4f83-bdb8-b26d14eebc0f	Amazon.fr	Books > kindle_ebook > Littérature & Fiction	Books > kindle_ebook	3	Littérature & Fiction	t	1	t	2025-08-08 21:29:20.807664	2025-08-08 21:29:20.807664
2f5ce03b-e94f-4f68-9073-cc14230fc842	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Roman	Books > kindle_ebook > Littérature & Fiction	4	Roman	t	1	t	2025-08-08 21:29:20.852138	2025-08-08 21:29:20.852138
3ebd1de0-60bf-4638-86a7-cf0c31558ca4	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Roman > Amour	Books > kindle_ebook > Littérature & Fiction > Roman	5	Amour	t	1	t	2025-08-08 21:29:20.89598	2025-08-08 21:29:20.89598
2ee3d68f-b621-465a-a01f-357054b975b0	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique	Books > kindle_ebook > Littérature & Fiction > Roman > Amour	6	Épique	t	1	t	2025-08-08 21:29:20.940088	2025-08-08 21:29:20.940088
6bc1e6c6-08e3-460c-9d95-1fb2eb9f3844	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique	7	Médiéval	t	1	t	2025-08-08 21:29:20.984426	2025-08-08 21:29:20.984426
4d5c6513-aa12-48d1-857b-e99ba293ae0e	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval > Tip	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval	8	Tip	t	1	t	2025-08-08 21:29:21.028906	2025-08-08 21:29:21.028906
636ae42d-1c9d-4b9e-8a6c-157c53e43f7a	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval > Tip > Top	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval > Tip	9	Top	t	1	t	2025-08-08 21:29:21.073097	2025-08-08 21:29:21.073097
b4e3ae13-66ab-41f3-863c-28e7841a7cc0	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval > Tip > Top > Cool	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval > Tip > Top	10	Cool	t	1	t	2025-08-08 21:29:21.117118	2025-08-08 21:29:21.117118
fd337b59-f0b5-4075-8488-b3052639508d	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval > Tip > Top > Cool > Moule	Books > kindle_ebook > Littérature & Fiction > Roman > Amour > Épique > Médiéval > Tip > Top > Cool	11	Moule	t	1	t	2025-08-08 21:29:21.161362	2025-08-08 21:29:21.161362
c36c2b43-c261-49c8-ac1b-568677ce2489	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Fantasy	Books > kindle_ebook > Littérature & Fiction	4	Fantasy	t	1	t	2025-08-08 21:29:21.205278	2025-08-08 21:29:21.205278
b4d5f8a4-64ee-4d16-bf3e-5d22851a6c01	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Fantasy > High Fantasy > Épique	Books > kindle_ebook > Littérature & Fiction > Fantasy > High Fantasy	6	Épique	t	1	t	2025-08-08 21:29:21.293323	2025-08-08 21:29:21.293323
a2702b0d-54a5-4a14-9bec-46321ee55317	Amazon.fr	Books > kindle_ebook > Littérature & Fiction > Fantasy > High Fantasy > Épique > Médiéval	Books > kindle_ebook > Littérature & Fiction > Fantasy > High Fantasy > Épique	7	Médiéval	t	1	t	2025-08-08 21:29:21.337315	2025-08-08 21:29:21.337315
ea608704-627e-4682-8735-5fda585481c5	Amazon.es	Books > print_kdp_paperback > Negocios y Finanzas	Books > print_kdp_paperback	3	Negocios y Finanzas	t	1	t	2025-08-08 21:29:21.381357	2025-08-08 21:29:21.381357
0dee7af9-07ab-4ede-9a24-f29941fcd76e	Amazon.es	Books > print_kdp_paperback > Negocios y Finanzas > Emprendimiento	Books > print_kdp_paperback > Negocios y Finanzas	4	Emprendimiento	t	1	t	2025-08-08 21:29:21.425244	2025-08-08 21:29:21.425244
cee37390-7624-4163-af1e-3abee63f93b1	Amazon.es	Books > print_kdp_paperback > Negocios y Finanzas > Emprendimiento > Startups	Books > print_kdp_paperback > Negocios y Finanzas > Emprendimiento	5	Startups	t	1	t	2025-08-08 21:29:21.469233	2025-08-08 21:29:21.469233
2087fab2-dfa0-452b-8273-e2d1eb9d495f	Amazon.es	Books > print_kdp_paperback > Negocios y Finanzas > Emprendimiento > Startups > Recaudación de fondos	Books > print_kdp_paperback > Negocios y Finanzas > Emprendimiento > Startups	6	Recaudación de fondos	t	1	t	2025-08-08 21:29:21.51316	2025-08-08 21:29:21.51316
2e067c20-c3b2-41b3-bbf5-b84eabdbe260	Amazon.es	Books > kindle_ebook > Negocios y Finanzas	Books > kindle_ebook	3	Negocios y Finanzas	t	1	t	2025-08-08 21:29:21.557575	2025-08-08 21:29:21.557575
6a96916c-4290-41ad-b186-6ffb634d1cf0	Amazon.es	Books > kindle_ebook > Negocios y Finanzas > Emprendimiento	Books > kindle_ebook > Negocios y Finanzas	4	Emprendimiento	t	1	t	2025-08-08 21:29:21.601413	2025-08-08 21:29:21.601413
f9f69306-92f7-4b1b-ba18-f089265c4e08	Amazon.es	Books > kindle_ebook > Negocios y Finanzas > Emprendimiento > Startups	Books > kindle_ebook > Negocios y Finanzas > Emprendimiento	5	Startups	t	1	t	2025-08-08 21:29:21.645383	2025-08-08 21:29:21.645383
bf375e18-4cbe-4079-a082-cdb5c38def44	Amazon.es	Books > kindle_ebook > Negocios y Finanzas > Emprendimiento > Startups > Recaudación de fondos	Books > kindle_ebook > Negocios y Finanzas > Emprendimiento > Startups	6	Recaudación de fondos	t	1	t	2025-08-08 21:29:21.689407	2025-08-08 21:29:21.689407
ea26dc6e-320c-481c-b660-a7389a06b20f	Amazon.de	Books > kindle_ebook > Ratgeber & Tipps	Books > kindle_ebook	3	Ratgeber & Tipps	t	1	t	2025-08-08 21:29:21.733633	2025-08-08 21:29:21.733633
e55a2da7-f407-4f72-bbfc-38d377f2da52	Amazon.de	Books > kindle_ebook > Ratgeber & Tipps > Wellness	Books > kindle_ebook > Ratgeber & Tipps	4	Wellness	t	1	t	2025-08-08 21:29:21.777475	2025-08-08 21:29:21.777475
5ee19ba1-a7cc-404b-b506-ad9a8fd47945	Amazon.de	Books > kindle_ebook > Ratgeber & Tipps > Wellness > Meditation	Books > kindle_ebook > Ratgeber & Tipps > Wellness	5	Meditation	t	1	t	2025-08-08 21:29:21.821369	2025-08-08 21:29:21.821369
02f7d00f-a148-4c19-ab60-4fd462e75e57	Amazon.de	Books > kindle_ebook > Ratgeber & Tipps > Wellness > Meditation > Achtsamkeit	Books > kindle_ebook > Ratgeber & Tipps > Wellness > Meditation	6	Achtsamkeit	t	1	t	2025-08-08 21:29:21.865301	2025-08-08 21:29:21.865301
98232666-3740-4324-a092-a8ac8a94afd6	Amazon.de	Books > kindle_ebook > Ratgeber & Tipps > Wellness > Meditation > Achtsamkeit > Yoga	Books > kindle_ebook > Ratgeber & Tipps > Wellness > Meditation > Achtsamkeit	7	Yoga	t	1	t	2025-08-08 21:29:21.909294	2025-08-08 21:29:21.909294
7d44cfcf-1171-477c-9b7d-0c86ae280be4	Amazon.de	Books > print_kdp_paperback > Ratgeber & Tipps	Books > print_kdp_paperback	3	Ratgeber & Tipps	t	1	t	2025-08-08 21:29:21.953134	2025-08-08 21:29:21.953134
6e320447-adeb-413a-a943-62c6cf3bbb70	Amazon.de	Books > print_kdp_paperback > Ratgeber & Tipps > Wellness	Books > print_kdp_paperback > Ratgeber & Tipps	4	Wellness	t	1	t	2025-08-08 21:29:21.997555	2025-08-08 21:29:21.997555
f700bb79-be48-4cec-8c46-8d3fc7ce5727	Amazon.de	Books > print_kdp_paperback > Ratgeber & Tipps > Wellness > Meditation	Books > print_kdp_paperback > Ratgeber & Tipps > Wellness	5	Meditation	t	1	t	2025-08-08 21:29:22.041492	2025-08-08 21:29:22.041492
ed81a1b6-4ae0-44e3-a8b3-4bc6f63f5640	Amazon.de	Books > print_kdp_paperback > Ratgeber & Tipps > Wellness > Meditation > Achtsamkeit	Books > print_kdp_paperback > Ratgeber & Tipps > Wellness > Meditation	6	Achtsamkeit	t	1	t	2025-08-08 21:29:22.08535	2025-08-08 21:29:22.08535
a8692ec7-cb50-4bd8-b6b5-be3543e80777	Amazon.de	Books > print_kdp_paperback > Ratgeber & Tipps > Wellness > Meditation > Achtsamkeit > Yoga	Books > print_kdp_paperback > Ratgeber & Tipps > Wellness > Meditation > Achtsamkeit	7	Yoga	t	1	t	2025-08-08 21:29:22.12941	2025-08-08 21:29:22.12941
1f866b49-f6dd-47b1-ae76-8c221fbe8199	Amazon.co.uk	Books > print_kdp_paperback > Science, Tech & Medical	Books > print_kdp_paperback	3	Science, Tech & Medical	t	1	t	2025-08-08 21:29:22.173278	2025-08-08 21:29:22.173278
c5e163d5-cec1-4e57-a4f7-c7b69945739a	Amazon.co.uk	Books > print_kdp_paperback > Science, Tech & Medical > Computers & Technology	Books > print_kdp_paperback > Science, Tech & Medical	4	Computers & Technology	t	1	t	2025-08-08 21:29:22.217169	2025-08-08 21:29:22.217169
a5e25e6b-84c8-4683-b567-9b590f021cc7	Amazon.co.uk	Books > print_kdp_paperback > Science, Tech & Medical > Computers & Technology > Programming	Books > print_kdp_paperback > Science, Tech & Medical > Computers & Technology	5	Programming	t	1	t	2025-08-08 21:29:22.260991	2025-08-08 21:29:22.260991
11ed335f-3f22-4562-8c13-83c0a3fab817	Amazon.co.uk	Books > print_kdp_paperback > Science, Tech & Medical > Computers & Technology > Programming > Python	Books > print_kdp_paperback > Science, Tech & Medical > Computers & Technology > Programming	6	Python	t	1	t	2025-08-08 21:29:22.304977	2025-08-08 21:29:22.304977
88a21dc0-d8a4-4c78-b6aa-ecd13179a27c	Amazon.co.uk	Books > print_kdp_paperback > Science, Tech & Medical > Computers & Technology > Programming > Python > Data Science	Books > print_kdp_paperback > Science, Tech & Medical > Computers & Technology > Programming > Python	7	Data Science	t	1	t	2025-08-08 21:29:22.348797	2025-08-08 21:29:22.348797
25cfc54d-7889-46af-8bc3-c2a7891f17fa	Amazon.co.uk	Books > kindle_ebook > Science, Tech & Medical	Books > kindle_ebook	3	Science, Tech & Medical	t	1	t	2025-08-08 21:29:22.392817	2025-08-08 21:29:22.392817
9304d1a2-2c6b-46ae-9a0d-1653aba0cf95	Amazon.co.uk	Books > kindle_ebook > Science, Tech & Medical > Computers & Technology	Books > kindle_ebook > Science, Tech & Medical	4	Computers & Technology	t	1	t	2025-08-08 21:29:22.436824	2025-08-08 21:29:22.436824
cd3b93db-0839-4a11-a98c-2ab92a38c7f7	Amazon.co.uk	Books > kindle_ebook > Science, Tech & Medical > Computers & Technology > Programming	Books > kindle_ebook > Science, Tech & Medical > Computers & Technology	5	Programming	t	1	t	2025-08-08 21:29:22.480884	2025-08-08 21:29:22.480884
fa73bada-0d77-4632-8519-275e68bd9ebd	Amazon.co.uk	Books > kindle_ebook > Science, Tech & Medical > Computers & Technology > Programming > Python	Books > kindle_ebook > Science, Tech & Medical > Computers & Technology > Programming	6	Python	t	1	t	2025-08-08 21:29:22.526731	2025-08-08 21:29:22.526731
23bee743-f813-42c9-9d26-0162ebbb06ae	Amazon.co.uk	Books > kindle_ebook > Science, Tech & Medical > Computers & Technology > Programming > Python > Data Science	Books > kindle_ebook > Science, Tech & Medical > Computers & Technology > Programming > Python	7	Data Science	t	1	t	2025-08-08 21:29:22.57067	2025-08-08 21:29:22.57067
2e172b32-0024-4934-a007-d1087ed5d7e0	Amazon.fr	Books > print_kdp_paperback > Sciences, Techniques & Médecine	Books > print_kdp_paperback	3	Sciences, Techniques & Médecine	t	1	t	2025-08-08 21:29:22.614627	2025-08-08 21:29:22.614627
971941f6-375d-4175-a028-dc744efb31e9	Amazon.fr	Books > print_kdp_paperback > Sciences, Techniques & Médecine > Informatique	Books > print_kdp_paperback > Sciences, Techniques & Médecine	4	Informatique	t	1	t	2025-08-08 21:29:22.658715	2025-08-08 21:29:22.658715
cc5881b3-013b-48c6-8dfc-160513459147	Amazon.fr	Books > print_kdp_paperback > Sciences, Techniques & Médecine > Informatique > Programmation	Books > print_kdp_paperback > Sciences, Techniques & Médecine > Informatique	5	Programmation	t	1	t	2025-08-08 21:29:22.706502	2025-08-08 21:29:22.706502
758193e1-be83-4ca1-9bf7-4d906dbd16df	Amazon.fr	Books > print_kdp_paperback > Sciences, Techniques & Médecine > Informatique > Programmation > Python	Books > print_kdp_paperback > Sciences, Techniques & Médecine > Informatique > Programmation	6	Python	t	1	t	2025-08-08 21:29:22.750339	2025-08-08 21:29:22.750339
9749ffe3-f36b-4cd0-9fb1-a2a5a1e72d16	Amazon.fr	Books > print_kdp_paperback > Sciences, Techniques & Médecine > Informatique > Programmation > Python > Data Science	Books > print_kdp_paperback > Sciences, Techniques & Médecine > Informatique > Programmation > Python	7	Data Science	t	1	t	2025-08-08 21:29:22.794538	2025-08-08 21:29:22.794538
f5bf49ec-e2ff-425c-b65e-357d84060825	Amazon.fr	Books > kindle_ebook > Sciences, Techniques & Médecine	Books > kindle_ebook	3	Sciences, Techniques & Médecine	t	1	t	2025-08-08 21:29:22.8384	2025-08-08 21:29:22.8384
55824934-27cc-4d08-9f97-2591a39a62c8	Amazon.fr	Books > kindle_ebook > Sciences, Techniques & Médecine > Informatique	Books > kindle_ebook > Sciences, Techniques & Médecine	4	Informatique	t	1	t	2025-08-08 21:29:22.886976	2025-08-08 21:29:22.886976
9c4f0b99-594e-4687-8f2c-be5bbe383b3b	Amazon.fr	Books > kindle_ebook > Sciences, Techniques & Médecine > Informatique > Programmation	Books > kindle_ebook > Sciences, Techniques & Médecine > Informatique	5	Programmation	t	1	t	2025-08-08 21:29:22.93093	2025-08-08 21:29:22.93093
1015c752-766d-4800-b464-01f58ad71a04	Amazon.fr	Books > kindle_ebook > Sciences, Techniques & Médecine > Informatique > Programmation > Python	Books > kindle_ebook > Sciences, Techniques & Médecine > Informatique > Programmation	6	Python	t	1	t	2025-08-08 21:29:22.974925	2025-08-08 21:29:22.974925
42de3297-0c8b-48da-9233-c7d74b2161d4	Amazon.fr	Books > kindle_ebook > Sciences, Techniques & Médecine > Informatique > Programmation > Python > Data Science	Books > kindle_ebook > Sciences, Techniques & Médecine > Informatique > Programmation > Python	7	Data Science	t	1	t	2025-08-08 21:29:23.018949	2025-08-08 21:29:23.018949
d77ab09d-12b4-4fe0-972e-6a8f18e31c4e	Amazon.it	Books > kindle_ebook > Scienza, Tecnologia e Medicina	Books > kindle_ebook	3	Scienza, Tecnologia e Medicina	t	1	t	2025-08-08 21:29:23.063049	2025-08-08 21:29:23.063049
e388d6b5-3e16-4cbc-be3e-0b839bc9dc2b	Amazon.it	Books > kindle_ebook > Scienza, Tecnologia e Medicina > Informatica	Books > kindle_ebook > Scienza, Tecnologia e Medicina	4	Informatica	t	1	t	2025-08-08 21:29:23.106956	2025-08-08 21:29:23.106956
33dde7a7-3e52-4165-bae1-266e55ba6390	Amazon.it	Books > kindle_ebook > Scienza, Tecnologia e Medicina > Informatica > Programmazione	Books > kindle_ebook > Scienza, Tecnologia e Medicina > Informatica	5	Programmazione	t	1	t	2025-08-08 21:29:23.150928	2025-08-08 21:29:23.150928
22ec4368-7969-48fb-8952-e29ece3af6d6	Amazon.it	Books > kindle_ebook > Scienza, Tecnologia e Medicina > Informatica > Programmazione > Python	Books > kindle_ebook > Scienza, Tecnologia e Medicina > Informatica > Programmazione	6	Python	t	1	t	2025-08-08 21:29:23.194865	2025-08-08 21:29:23.194865
7d1a3959-f064-4e17-b90d-dea59db59a45	Amazon.it	Books > kindle_ebook > Scienza, Tecnologia e Medicina > Informatica > Programmazione > Python > Data Science	Books > kindle_ebook > Scienza, Tecnologia e Medicina > Informatica > Programmazione > Python	7	Data Science	t	1	t	2025-08-08 21:29:23.238671	2025-08-08 21:29:23.238671
30aa38dd-608e-4c0a-ad39-a4b822dceec4	Amazon.it	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina	Books > print_kdp_paperback	3	Scienza, Tecnologia e Medicina	t	1	t	2025-08-08 21:29:23.282673	2025-08-08 21:29:23.282673
f70a1989-e0b7-4772-aff0-31cc8c274a6c	Amazon.it	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina > Informatica	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina	4	Informatica	t	1	t	2025-08-08 21:29:23.326484	2025-08-08 21:29:23.326484
5d94374a-2417-42a5-b7d3-da202f14085e	Amazon.it	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina > Informatica > Programmazione	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina > Informatica	5	Programmazione	t	1	t	2025-08-08 21:29:23.370522	2025-08-08 21:29:23.370522
1b95f134-2e61-49d2-8fd6-7a51417414f5	Amazon.it	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina > Informatica > Programmazione > Python	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina > Informatica > Programmazione	6	Python	t	1	t	2025-08-08 21:29:23.414283	2025-08-08 21:29:23.414283
be3f48b6-175b-4976-a602-f7d5469db8c1	Amazon.it	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina > Informatica > Programmazione > Python > Data Science	Books > print_kdp_paperback > Scienza, Tecnologia e Medicina > Informatica > Programmazione > Python	7	Data Science	t	1	t	2025-08-08 21:29:23.458167	2025-08-08 21:29:23.458167
8854e247-58ae-4c86-b5bb-d027681f8461	Amazon.de	Books > print_kdp_paperback > Wirtschaft & Finanzen	Books > print_kdp_paperback	3	Wirtschaft & Finanzen	t	1	t	2025-08-08 21:29:23.50201	2025-08-08 21:29:23.50201
505c1c5a-a3e3-42cd-8be2-f107db9b7036	Amazon.de	Books > print_kdp_paperback > Wirtschaft & Finanzen > Unternehmertum	Books > print_kdp_paperback > Wirtschaft & Finanzen	4	Unternehmertum	t	1	t	2025-08-08 21:29:23.54591	2025-08-08 21:29:23.54591
717ccb75-2d2c-4c7f-b75c-68de6e86e8eb	Amazon.de	Books > print_kdp_paperback > Wirtschaft & Finanzen > Unternehmertum > Startups	Books > print_kdp_paperback > Wirtschaft & Finanzen > Unternehmertum	5	Startups	t	1	t	2025-08-08 21:29:23.589912	2025-08-08 21:29:23.589912
18e9d3d2-8350-4a4a-937c-c6840c151d59	Amazon.de	Books > print_kdp_paperback > Wirtschaft & Finanzen > Unternehmertum > Startups > Finanzierung	Books > print_kdp_paperback > Wirtschaft & Finanzen > Unternehmertum > Startups	6	Finanzierung	t	1	t	2025-08-08 21:29:23.635005	2025-08-08 21:29:23.635005
b9da432d-e266-4ca9-a3db-d5c722437682	Amazon.de	Books > kindle_ebook > Wirtschaft & Finanzen	Books > kindle_ebook	3	Wirtschaft & Finanzen	t	1	t	2025-08-08 21:29:23.679006	2025-08-08 21:29:23.679006
21119c66-2a34-4069-bdf7-45c7a63b295d	Amazon.de	Books > kindle_ebook > Wirtschaft & Finanzen > Unternehmertum	Books > kindle_ebook > Wirtschaft & Finanzen	4	Unternehmertum	t	1	t	2025-08-08 21:29:23.723709	2025-08-08 21:29:23.723709
019f45f0-c48b-43af-84d6-23af88c6b40f	Amazon.de	Books > kindle_ebook > Wirtschaft & Finanzen > Unternehmertum > Startups	Books > kindle_ebook > Wirtschaft & Finanzen > Unternehmertum	5	Startups	t	1	t	2025-08-08 21:29:23.767944	2025-08-08 21:29:23.767944
f754c995-42c5-4863-92a1-06e32c1f8104	Amazon.de	Books > kindle_ebook > Wirtschaft & Finanzen > Unternehmertum > Startups > Finanzierung	Books > kindle_ebook > Wirtschaft & Finanzen > Unternehmertum > Startups	6	Finanzierung	t	1	t	2025-08-08 21:29:23.813265	2025-08-08 21:29:23.813265
d44f9ce3-9767-45b3-a27d-d5a2e358503c	Amazon.de	Books > kindle_ebook > Wissenschaft, Technik & Medizin	Books > kindle_ebook	3	Wissenschaft, Technik & Medizin	t	1	t	2025-08-08 21:29:23.857234	2025-08-08 21:29:23.857234
ba69ea74-18fe-4cf7-be87-de5bcca9ad24	Amazon.de	Books > kindle_ebook > Wissenschaft, Technik & Medizin > Computer & Technologie	Books > kindle_ebook > Wissenschaft, Technik & Medizin	4	Computer & Technologie	t	1	t	2025-08-08 21:29:23.901241	2025-08-08 21:29:23.901241
75e0500a-aa6b-4c5b-9f06-45d4909d23fb	Amazon.de	Books > kindle_ebook > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung	Books > kindle_ebook > Wissenschaft, Technik & Medizin > Computer & Technologie	5	Programmierung	t	1	t	2025-08-08 21:29:23.945291	2025-08-08 21:29:23.945291
c607bcd1-899b-4bbc-8a4a-74c149982c4f	Amazon.de	Books > kindle_ebook > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung > Python	Books > kindle_ebook > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung	6	Python	t	1	t	2025-08-08 21:29:23.989148	2025-08-08 21:29:23.989148
27144de5-9b5c-4044-97c2-0ffd0ab15835	Amazon.de	Books > kindle_ebook > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung > Python > Datenwissenschaft	Books > kindle_ebook > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung > Python	7	Datenwissenschaft	t	1	t	2025-08-08 21:29:24.03332	2025-08-08 21:29:24.03332
24e05668-8183-43db-ae7a-4dcfbfd741bf	Amazon.de	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin	Books > print_kdp_paperback	3	Wissenschaft, Technik & Medizin	t	1	t	2025-08-08 21:29:24.07751	2025-08-08 21:29:24.07751
5e4a3751-02a1-4a97-bb77-43a680e85ee1	Amazon.de	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin > Computer & Technologie	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin	4	Computer & Technologie	t	1	t	2025-08-08 21:29:24.121436	2025-08-08 21:29:24.121436
1b8666d8-5ce3-43c9-ac37-e619534d8675	Amazon.de	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin > Computer & Technologie	5	Programmierung	t	1	t	2025-08-08 21:29:24.165292	2025-08-08 21:29:24.165292
3a2edc5c-619e-48c8-994e-93b7450146b1	Amazon.de	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung > Python	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung	6	Python	t	1	t	2025-08-08 21:29:24.209851	2025-08-08 21:29:24.209851
348f72f8-1fc8-40b4-9c34-b8012879aeb7	Amazon.de	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung > Python > Datenwissenschaft	Books > print_kdp_paperback > Wissenschaft, Technik & Medizin > Computer & Technologie > Programmierung > Python	7	Datenwissenschaft	t	1	t	2025-08-08 21:29:24.253963	2025-08-08 21:29:24.253963
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, user_id, title, subtitle, description, categories, keywords, status, use_ai, ai_prompt, ai_content_type, formats, publication_info, cover_image_url, total_sales, total_revenue, created_at, updated_at, language, series_title, series_number, edition_number, author_prefix, author_first_name, author_middle_name, author_last_name, author_suffix, publishing_rights, has_explicit_content, reading_age_min, reading_age_max, primary_marketplace, is_low_content_book, is_large_print_book, publication_date, previously_published, previous_publication_date, release_option, scheduled_release_date, name) FROM stdin;
b5f3abb4-6dda-43bd-9f1a-45d57d0450a0	dev-user-123	trhrth	\N	hhrhr	\N	\N	draft	f	\N	\N	\N	\N	\N	0	0.00	2025-08-08 21:10:08.407961	2025-08-08 21:10:08.407961	English	\N	\N	\N	\N	\N	\N	\N	\N	owned	f	\N	\N	Amazon.com	f	f	\N	f	\N	immediate	\N	trhrth
\.


--
-- Data for Name: sales_data; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_data (id, user_id, book_id, report_date, format, marketplace, units_sold, revenue, royalty, file_name, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, role, subscription_tier, stripe_customer_id, stripe_subscription_id, is_active, last_login_at, created_at, updated_at) FROM stdin;
dev-user-123	dev@example.com	Developer	User	\N	superadmin	premium	\N	\N	t	\N	2025-08-08 21:02:47.736366	2025-08-08 21:29:33.612
\.


--
-- Name: ai_generations ai_generations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_pkey PRIMARY KEY (id);


--
-- Name: ai_prompts ai_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_prompts
    ADD CONSTRAINT ai_prompts_pkey PRIMARY KEY (id);


--
-- Name: author_biographies author_biographies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.author_biographies
    ADD CONSTRAINT author_biographies_pkey PRIMARY KEY (id);


--
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug);


--
-- Name: blog_comments blog_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: consolidated_sales_data consolidated_sales_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.consolidated_sales_data
    ADD CONSTRAINT consolidated_sales_data_pkey PRIMARY KEY (id);


--
-- Name: contributors contributors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contributors
    ADD CONSTRAINT contributors_pkey PRIMARY KEY (id);


--
-- Name: cron_jobs cron_jobs_job_type_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cron_jobs
    ADD CONSTRAINT cron_jobs_job_type_key UNIQUE (job_type);


--
-- Name: cron_jobs cron_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cron_jobs
    ADD CONSTRAINT cron_jobs_pkey PRIMARY KEY (id);


--
-- Name: kdp_import_data kdp_import_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kdp_import_data
    ADD CONSTRAINT kdp_import_data_pkey PRIMARY KEY (id);


--
-- Name: kdp_imports kdp_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kdp_imports
    ADD CONSTRAINT kdp_imports_pkey PRIMARY KEY (id);


--
-- Name: marketplace_categories marketplace_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.marketplace_categories
    ADD CONSTRAINT marketplace_categories_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sales_data sales_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_data
    ADD CONSTRAINT sales_data_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: ai_generations ai_generations_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: ai_generations ai_generations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: ai_generations ai_generations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_generations
    ADD CONSTRAINT ai_generations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: author_biographies author_biographies_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.author_biographies
    ADD CONSTRAINT author_biographies_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE CASCADE;


--
-- Name: authors authors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: blog_comments blog_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: blog_comments blog_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: blog_posts blog_posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id);


--
-- Name: books books_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: books books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: consolidated_sales_data consolidated_sales_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.consolidated_sales_data
    ADD CONSTRAINT consolidated_sales_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contributors contributors_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contributors
    ADD CONSTRAINT contributors_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: kdp_import_data kdp_import_data_import_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kdp_import_data
    ADD CONSTRAINT kdp_import_data_import_id_fkey FOREIGN KEY (import_id) REFERENCES public.kdp_imports(id) ON DELETE CASCADE;


--
-- Name: kdp_import_data kdp_import_data_matched_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kdp_import_data
    ADD CONSTRAINT kdp_import_data_matched_book_id_fkey FOREIGN KEY (matched_book_id) REFERENCES public.books(id);


--
-- Name: kdp_import_data kdp_import_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kdp_import_data
    ADD CONSTRAINT kdp_import_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: kdp_imports kdp_imports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.kdp_imports
    ADD CONSTRAINT kdp_imports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sales_data sales_data_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_data
    ADD CONSTRAINT sales_data_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: sales_data sales_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_data
    ADD CONSTRAINT sales_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

