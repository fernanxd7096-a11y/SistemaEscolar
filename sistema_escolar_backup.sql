--
-- PostgreSQL database dump
--

\restrict 75E9DRYPRBvKdC4PYnB31vBYSahropuBaJgGm707ANRWPczYrjLcXvomxy99oS1

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_log (
    id bigint NOT NULL,
    log_name character varying(255),
    description text NOT NULL,
    subject_type character varying(255),
    subject_id bigint,
    causer_type character varying(255),
    causer_id bigint,
    properties json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    event character varying(255),
    batch_uuid uuid
);


--
-- Name: activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_log_id_seq OWNED BY public.activity_log.id;


--
-- Name: alumno_padre; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumno_padre (
    id bigint NOT NULL,
    alumno_id bigint NOT NULL,
    padre_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: alumno_padre_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alumno_padre_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alumno_padre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alumno_padre_id_seq OWNED BY public.alumno_padre.id;


--
-- Name: alumno_seccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumno_seccion (
    id bigint NOT NULL,
    alumno_id bigint NOT NULL,
    seccion_id bigint NOT NULL,
    "año_escolar" character varying(20) NOT NULL,
    estado character varying(255) DEFAULT 'activo'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT alumno_seccion_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'retirado'::character varying, 'trasladado'::character varying])::text[])))
);


--
-- Name: alumno_seccion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alumno_seccion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alumno_seccion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alumno_seccion_id_seq OWNED BY public.alumno_seccion.id;


--
-- Name: alumnos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumnos (
    id bigint NOT NULL,
    usuario_id bigint,
    dni character varying(20) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    fecha_nacimiento date,
    genero character varying(255),
    direccion character varying(255),
    telefono character varying(30),
    foto character varying(255),
    estado boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT alumnos_genero_check CHECK (((genero)::text = ANY ((ARRAY['M'::character varying, 'F'::character varying, 'O'::character varying])::text[])))
);


--
-- Name: alumnos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alumnos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alumnos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alumnos_id_seq OWNED BY public.alumnos.id;


--
-- Name: asistencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asistencias (
    id bigint NOT NULL,
    alumno_id bigint NOT NULL,
    seccion_id bigint NOT NULL,
    fecha date NOT NULL,
    estado character varying(255) DEFAULT 'presente'::character varying NOT NULL,
    observacion character varying(255),
    registrado_por bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT asistencias_estado_check CHECK (((estado)::text = ANY ((ARRAY['presente'::character varying, 'tardanza'::character varying, 'falta'::character varying, 'justificado'::character varying])::text[])))
);


--
-- Name: asistencias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asistencias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asistencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asistencias_id_seq OWNED BY public.asistencias.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: comunicados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comunicados (
    id bigint NOT NULL,
    titulo character varying(200) NOT NULL,
    contenido text NOT NULL,
    tipo character varying(255) DEFAULT 'general'::character varying NOT NULL,
    destinatarios character varying(255) DEFAULT 'todos'::character varying NOT NULL,
    publicado_por bigint,
    fecha_publicacion date,
    estado boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT comunicados_destinatarios_check CHECK (((destinatarios)::text = ANY ((ARRAY['todos'::character varying, 'padres'::character varying, 'docentes'::character varying, 'alumnos'::character varying])::text[]))),
    CONSTRAINT comunicados_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['general'::character varying, 'urgente'::character varying, 'informativo'::character varying])::text[])))
);


--
-- Name: comunicados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comunicados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comunicados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comunicados_id_seq OWNED BY public.comunicados.id;


--
-- Name: cursos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cursos (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    grado_id bigint NOT NULL,
    docente_id bigint,
    horas_semanales smallint DEFAULT '2'::smallint NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: cursos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cursos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cursos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cursos_id_seq OWNED BY public.cursos.id;


--
-- Name: docentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.docentes (
    id bigint NOT NULL,
    usuario_id bigint,
    dni character varying(20) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    especialidad character varying(150),
    titulo character varying(150),
    telefono character varying(30),
    email character varying(255),
    estado boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: docentes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.docentes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: docentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.docentes_id_seq OWNED BY public.docentes.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: grados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grados (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    nivel character varying(255) NOT NULL,
    descripcion character varying(255),
    estado boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT grados_nivel_check CHECK (((nivel)::text = ANY ((ARRAY['inicial'::character varying, 'primaria'::character varying, 'secundaria'::character varying])::text[])))
);


--
-- Name: grados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grados_id_seq OWNED BY public.grados.id;


--
-- Name: horarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horarios (
    id bigint NOT NULL,
    seccion_id bigint NOT NULL,
    curso_id bigint NOT NULL,
    docente_id bigint,
    dia_semana character varying(255) NOT NULL,
    hora_inicio time(0) without time zone NOT NULL,
    hora_fin time(0) without time zone NOT NULL,
    aula character varying(50),
    estado boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT horarios_dia_semana_check CHECK (((dia_semana)::text = ANY ((ARRAY['lunes'::character varying, 'martes'::character varying, 'miercoles'::character varying, 'jueves'::character varying, 'viernes'::character varying])::text[])))
);


--
-- Name: horarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: horarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horarios_id_seq OWNED BY public.horarios.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: model_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_permissions (
    permission_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


--
-- Name: model_has_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_roles (
    role_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


--
-- Name: notas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notas (
    id bigint NOT NULL,
    alumno_id bigint NOT NULL,
    curso_id bigint NOT NULL,
    seccion_id bigint NOT NULL,
    bimestre smallint NOT NULL,
    tipo character varying(255) DEFAULT 'examen'::character varying NOT NULL,
    calificacion numeric(5,2) NOT NULL,
    peso numeric(3,2) DEFAULT '1'::numeric NOT NULL,
    observacion character varying(255),
    registrado_por bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT notas_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['examen'::character varying, 'practica'::character varying, 'tarea'::character varying, 'participacion'::character varying])::text[])))
);


--
-- Name: notas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notas_id_seq OWNED BY public.notas.id;


--
-- Name: padres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.padres (
    id bigint NOT NULL,
    usuario_id bigint,
    dni character varying(20) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    relacion character varying(50),
    telefono character varying(30),
    email character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: padres_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.padres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: padres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.padres_id_seq OWNED BY public.padres.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: role_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_has_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: secciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secciones (
    id bigint NOT NULL,
    grado_id bigint NOT NULL,
    nombre character varying(20) NOT NULL,
    capacidad smallint DEFAULT '30'::smallint NOT NULL,
    docente_tutor_id bigint,
    estado boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: secciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.secciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: secciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.secciones_id_seq OWNED BY public.secciones.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    foto character varying(255),
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: activity_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN id SET DEFAULT nextval('public.activity_log_id_seq'::regclass);


--
-- Name: alumno_padre id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_padre ALTER COLUMN id SET DEFAULT nextval('public.alumno_padre_id_seq'::regclass);


--
-- Name: alumno_seccion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_seccion ALTER COLUMN id SET DEFAULT nextval('public.alumno_seccion_id_seq'::regclass);


--
-- Name: alumnos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos ALTER COLUMN id SET DEFAULT nextval('public.alumnos_id_seq'::regclass);


--
-- Name: asistencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias ALTER COLUMN id SET DEFAULT nextval('public.asistencias_id_seq'::regclass);


--
-- Name: comunicados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comunicados ALTER COLUMN id SET DEFAULT nextval('public.comunicados_id_seq'::regclass);


--
-- Name: cursos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos ALTER COLUMN id SET DEFAULT nextval('public.cursos_id_seq'::regclass);


--
-- Name: docentes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.docentes ALTER COLUMN id SET DEFAULT nextval('public.docentes_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: grados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grados ALTER COLUMN id SET DEFAULT nextval('public.grados_id_seq'::regclass);


--
-- Name: horarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios ALTER COLUMN id SET DEFAULT nextval('public.horarios_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: notas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas ALTER COLUMN id SET DEFAULT nextval('public.notas_id_seq'::regclass);


--
-- Name: padres id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.padres ALTER COLUMN id SET DEFAULT nextval('public.padres_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: secciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secciones ALTER COLUMN id SET DEFAULT nextval('public.secciones_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_log (id, log_name, description, subject_type, subject_id, causer_type, causer_id, properties, created_at, updated_at, event, batch_uuid) FROM stdin;
1	default	created	App\\Models\\Usuario	1	\N	\N	{"attributes":{"nombre":"Admin","apellido":"Sistema","email":"admin@sanjudastadeo.edu.pe","estado":true}}	2026-07-28 00:49:00	2026-07-28 00:49:00	created	\N
\.


--
-- Data for Name: alumno_padre; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alumno_padre (id, alumno_id, padre_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: alumno_seccion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alumno_seccion (id, alumno_id, seccion_id, "año_escolar", estado, created_at, updated_at) FROM stdin;
1	1	1	2026	activo	2026-07-28 00:49:00	2026-07-28 00:49:00
2	2	1	2026	activo	2026-07-28 00:49:00	2026-07-28 00:49:00
3	3	1	2026	activo	2026-07-28 00:49:00	2026-07-28 00:49:00
4	4	1	2026	activo	2026-07-28 00:49:00	2026-07-28 00:49:00
\.


--
-- Data for Name: alumnos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alumnos (id, usuario_id, dni, nombres, apellidos, fecha_nacimiento, genero, direccion, telefono, foto, estado, created_at, updated_at) FROM stdin;
1	\N	80111222	José	Pérez López	2018-03-12	M	\N	\N	\N	t	2026-07-28 00:49:00	2026-07-28 00:49:00
2	\N	80333444	Lucía	García Méndez	2018-07-21	F	\N	\N	\N	t	2026-07-28 00:49:00	2026-07-28 00:49:00
3	\N	80555666	Diego	Salazar Ruiz	2018-01-05	M	\N	\N	\N	t	2026-07-28 00:49:00	2026-07-28 00:49:00
4	\N	80777888	Valentina	Castro Ríos	2017-11-30	F	\N	\N	\N	t	2026-07-28 00:49:00	2026-07-28 00:49:00
\.


--
-- Data for Name: asistencias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asistencias (id, alumno_id, seccion_id, fecha, estado, observacion, registrado_por, created_at, updated_at) FROM stdin;
1	1	1	2026-08-07	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
2	3	1	2026-08-07	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
3	4	1	2026-08-07	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
4	2	1	2026-08-07	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
5	1	1	2026-08-06	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
6	3	1	2026-08-06	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
7	4	1	2026-08-06	justificado	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
8	2	1	2026-08-06	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
9	1	1	2026-08-05	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
10	3	1	2026-08-05	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
11	4	1	2026-08-05	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
12	2	1	2026-08-05	tardanza	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
13	1	1	2026-08-04	falta	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
14	3	1	2026-08-04	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
15	4	1	2026-08-04	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
16	2	1	2026-08-04	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
17	1	1	2026-08-03	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
18	3	1	2026-08-03	falta	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
19	4	1	2026-08-03	presente	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
20	2	1	2026-08-03	tardanza	\N	\N	2026-08-09 00:02:54	2026-08-09 00:02:54
22	2	1	2026-08-09	presente	\N	1	2026-08-09 23:04:33	2026-08-09 23:04:33
23	1	1	2026-08-09	presente	\N	1	2026-08-09 23:04:33	2026-08-09 23:04:33
24	3	1	2026-08-09	presente	\N	1	2026-08-09 23:04:33	2026-08-09 23:04:33
21	4	1	2026-08-09	tardanza	\N	1	2026-08-09 23:04:33	2026-08-09 23:04:41
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cache (key, value, expiration) FROM stdin;
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: comunicados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comunicados (id, titulo, contenido, tipo, destinatarios, publicado_por, fecha_publicacion, estado, created_at, updated_at) FROM stdin;
1	Inicio del Año Escolar 2026	Estimados padres de familia y comunidad educativa:\n\nNos complace informarles que el año escolar 2026 dará inicio el día lunes 2 de marzo. Les recordamos que es importante que los alumnos se presenten con el uniforme completo y los útiles escolares correspondientes.\n\nLa matrícula estará disponible desde el 15 de febrero en la secretaría del colegio.\n\nCordialmente,\nDirección del Colegio Milagroso San Judas Tadeo	general	todos	1	2026-07-10	t	2026-08-09 21:45:40	2026-08-09 21:45:40
2	⚠️ Suspensión de clases por mantenimiento	Se comunica a toda la comunidad educativa que el día viernes se suspenderán las actividades académicas por trabajos de mantenimiento en las instalaciones del colegio.\n\nLas clases se reanudarán con normalidad el día lunes.\n\nAgradecemos su comprensión.	urgente	todos	1	2026-08-04	t	2026-08-09 21:45:40	2026-08-09 21:45:40
3	Reunión de Padres de Familia — I Bimestre	Estimados padres:\n\nSe convoca a la reunión de padres de familia para la entrega de libretas del I Bimestre.\n\n📅 Fecha: Viernes próximo\n🕐 Hora: 3:00 PM\n📍 Lugar: Auditorio del colegio\n\nSe ruega puntualidad. La asistencia es obligatoria.	informativo	padres	1	2026-08-06	t	2026-08-09 21:45:40	2026-08-09 21:45:40
4	Capacitación Docente — Nuevas Metodologías	Estimados docentes:\n\nSe les invita a la jornada de capacitación sobre nuevas metodologías de enseñanza que se realizará el próximo sábado de 9:00 AM a 1:00 PM.\n\nTemas:\n• Aprendizaje basado en proyectos\n• Herramientas digitales para el aula\n• Evaluación formativa\n\nLa asistencia es obligatoria y se entregará certificado.	informativo	docentes	1	2026-08-07	t	2026-08-09 21:45:40	2026-08-09 21:45:40
5	Concurso de Ciencias — ¡Inscríbete!	¡Atención alumnos!\n\nSe abre la convocatoria para el Concurso Interno de Ciencias 2026. Pueden participar alumnos de todos los grados.\n\n🔬 Categorías: Experimentos, Investigación, Innovación\n📅 Fecha límite de inscripción: Fin de mes\n📍 Inscripciones: Con su tutor de sección\n\n¡Anímate a participar y demuestra tu talento científico!	general	alumnos	1	2026-08-08	t	2026-08-09 21:45:40	2026-08-09 21:45:40
\.


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cursos (id, nombre, descripcion, grado_id, docente_id, horas_semanales, estado, created_at, updated_at) FROM stdin;
1	Matemáticas	\N	1	1	5	t	2026-08-07 22:46:25	2026-08-07 22:46:25
2	Comunicación	\N	1	2	5	t	2026-08-07 22:46:25	2026-08-07 22:46:25
3	Ciencia y Tecnología	\N	1	3	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
4	Personal Social	\N	1	1	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
5	Arte y Cultura	\N	1	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
6	Educación Física	\N	1	3	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
7	Educación Religiosa	\N	1	1	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
8	Inglés	\N	1	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
9	Tutoría	\N	1	3	1	t	2026-08-07 22:46:25	2026-08-07 22:46:25
10	Matemáticas	\N	2	1	5	t	2026-08-07 22:46:25	2026-08-07 22:46:25
11	Comunicación	\N	2	2	5	t	2026-08-07 22:46:25	2026-08-07 22:46:25
12	Ciencia y Tecnología	\N	2	3	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
13	Personal Social	\N	2	1	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
14	Arte y Cultura	\N	2	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
15	Educación Física	\N	2	3	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
16	Educación Religiosa	\N	2	1	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
17	Inglés	\N	2	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
18	Tutoría	\N	2	3	1	t	2026-08-07 22:46:25	2026-08-07 22:46:25
19	Matemáticas	\N	3	1	5	t	2026-08-07 22:46:25	2026-08-07 22:46:25
20	Comunicación	\N	3	2	5	t	2026-08-07 22:46:25	2026-08-07 22:46:25
21	Ciencia y Tecnología	\N	3	3	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
22	Personal Social	\N	3	1	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
23	Arte y Cultura	\N	3	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
24	Educación Física	\N	3	3	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
25	Educación Religiosa	\N	3	1	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
26	Inglés	\N	3	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
27	Tutoría	\N	3	3	1	t	2026-08-07 22:46:25	2026-08-07 22:46:25
28	Matemáticas	\N	4	1	6	t	2026-08-07 22:46:25	2026-08-07 22:46:25
29	Comunicación	\N	4	2	5	t	2026-08-07 22:46:25	2026-08-07 22:46:25
30	Ciencia y Tecnología	\N	4	3	4	t	2026-08-07 22:46:25	2026-08-07 22:46:25
31	Ciencias Sociales	\N	4	1	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
32	Desarrollo Personal	\N	4	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
33	Educación Física	\N	4	3	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
34	Arte y Cultura	\N	4	1	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
35	Educación Religiosa	\N	4	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
36	Inglés	\N	4	3	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
37	Educación para el Trabajo	\N	4	1	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
38	Tutoría	\N	4	2	1	t	2026-08-07 22:46:25	2026-08-07 22:46:25
39	Matemáticas	\N	5	1	6	t	2026-08-07 22:46:25	2026-08-07 22:46:25
40	Comunicación	\N	5	2	5	t	2026-08-07 22:46:25	2026-08-07 22:46:25
41	Ciencia y Tecnología	\N	5	3	4	t	2026-08-07 22:46:25	2026-08-07 22:46:25
42	Ciencias Sociales	\N	5	1	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
43	Desarrollo Personal	\N	5	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
44	Educación Física	\N	5	3	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
45	Arte y Cultura	\N	5	1	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
46	Educación Religiosa	\N	5	2	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
47	Inglés	\N	5	3	3	t	2026-08-07 22:46:25	2026-08-07 22:46:25
48	Educación para el Trabajo	\N	5	1	2	t	2026-08-07 22:46:25	2026-08-07 22:46:25
49	Tutoría	\N	5	2	1	t	2026-08-07 22:46:25	2026-08-07 22:46:25
\.


--
-- Data for Name: docentes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.docentes (id, usuario_id, dni, nombres, apellidos, especialidad, titulo, telefono, email, estado, created_at, updated_at) FROM stdin;
1	\N	40111222	María	Quispe Huamán	Matemáticas	Lic. Educación	\N	mquispe@sanjudastadeo.edu.pe	t	2026-07-28 00:49:00	2026-07-28 00:49:00
2	\N	40333444	Carlos	Ramos Díaz	Comunicación	Lic. Educación	\N	cramos@sanjudastadeo.edu.pe	t	2026-07-28 00:49:00	2026-07-28 00:49:00
3	\N	40555666	Ana	Torres Vega	Ciencias	Lic. Educación	\N	atorres@sanjudastadeo.edu.pe	t	2026-07-28 00:49:00	2026-07-28 00:49:00
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: grados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.grados (id, nombre, nivel, descripcion, estado, created_at, updated_at) FROM stdin;
1	1°	primaria	Primer grado de primaria	t	2026-07-28 00:49:00	2026-07-28 00:49:00
2	2°	primaria	Segundo grado de primaria	t	2026-07-28 00:49:00	2026-07-28 00:49:00
3	3°	primaria	Tercer grado de primaria	t	2026-07-28 00:49:00	2026-07-28 00:49:00
4	1°	secundaria	Primer grado de secundaria	t	2026-07-28 00:49:00	2026-07-28 00:49:00
5	2°	secundaria	Segundo grado de secundaria	t	2026-07-28 00:49:00	2026-07-28 00:49:00
\.


--
-- Data for Name: horarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.horarios (id, seccion_id, curso_id, docente_id, dia_semana, hora_inicio, hora_fin, aula, estado, created_at, updated_at) FROM stdin;
1	1	1	1	lunes	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
2	1	2	2	lunes	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
3	1	3	3	lunes	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
4	1	4	1	lunes	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
5	1	5	2	lunes	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
6	1	6	3	lunes	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
7	1	7	1	martes	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
8	1	8	2	martes	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
9	1	9	3	martes	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
10	1	1	1	martes	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
11	1	2	2	martes	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
12	1	3	3	martes	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
13	1	4	1	miercoles	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
14	1	5	2	miercoles	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
15	1	6	3	miercoles	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
16	1	7	1	miercoles	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
17	1	8	2	miercoles	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
18	1	9	3	miercoles	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
19	1	1	1	jueves	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
20	1	2	2	jueves	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
21	1	3	3	jueves	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
22	1	4	1	jueves	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
23	1	5	2	jueves	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
24	1	6	3	jueves	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
25	1	7	1	viernes	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
26	1	8	2	viernes	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
27	1	9	3	viernes	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
28	1	1	1	viernes	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
29	1	2	2	viernes	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
30	1	3	3	viernes	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
31	2	1	1	lunes	08:00:00	08:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
32	2	2	2	lunes	08:45:00	09:30:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
33	2	3	3	lunes	09:30:00	10:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
34	2	4	1	lunes	10:30:00	11:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
35	2	5	2	lunes	11:15:00	12:00:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
36	2	6	3	lunes	12:00:00	12:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
37	2	7	1	martes	08:00:00	08:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
38	2	8	2	martes	08:45:00	09:30:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
39	2	9	3	martes	09:30:00	10:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
40	2	1	1	martes	10:30:00	11:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
41	2	2	2	martes	11:15:00	12:00:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
42	2	3	3	martes	12:00:00	12:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
43	2	4	1	miercoles	08:00:00	08:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
44	2	5	2	miercoles	08:45:00	09:30:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
45	2	6	3	miercoles	09:30:00	10:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
46	2	7	1	miercoles	10:30:00	11:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
47	2	8	2	miercoles	11:15:00	12:00:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
48	2	9	3	miercoles	12:00:00	12:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
49	2	1	1	jueves	08:00:00	08:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
50	2	2	2	jueves	08:45:00	09:30:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
51	2	3	3	jueves	09:30:00	10:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
52	2	4	1	jueves	10:30:00	11:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
53	2	5	2	jueves	11:15:00	12:00:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
54	2	6	3	jueves	12:00:00	12:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
55	2	7	1	viernes	08:00:00	08:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
56	2	8	2	viernes	08:45:00	09:30:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
57	2	9	3	viernes	09:30:00	10:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
58	2	1	1	viernes	10:30:00	11:15:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
59	2	2	2	viernes	11:15:00	12:00:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
60	2	3	3	viernes	12:00:00	12:45:00	Aula B	t	2026-08-07 22:59:53	2026-08-07 22:59:53
61	3	10	1	lunes	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
62	3	11	2	lunes	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
63	3	12	3	lunes	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
64	3	13	1	lunes	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
65	3	14	2	lunes	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
66	3	15	3	lunes	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
67	3	16	1	martes	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
68	3	17	2	martes	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
69	3	18	3	martes	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
70	3	10	1	martes	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
71	3	11	2	martes	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
72	3	12	3	martes	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
73	3	13	1	miercoles	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
74	3	14	2	miercoles	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
75	3	15	3	miercoles	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
76	3	16	1	miercoles	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
77	3	17	2	miercoles	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
78	3	18	3	miercoles	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
79	3	10	1	jueves	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
80	3	11	2	jueves	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
81	3	12	3	jueves	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
82	3	13	1	jueves	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
83	3	14	2	jueves	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
84	3	15	3	jueves	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
85	3	16	1	viernes	08:00:00	08:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
86	3	17	2	viernes	08:45:00	09:30:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
87	3	18	3	viernes	09:30:00	10:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
88	3	10	1	viernes	10:30:00	11:15:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
89	3	11	2	viernes	11:15:00	12:00:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
90	3	12	3	viernes	12:00:00	12:45:00	Aula A	t	2026-08-07 22:59:53	2026-08-07 22:59:53
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2026_07_21_000001_crear_tabla_usuarios	1
5	2026_07_21_234014_create_permission_tables	1
6	2026_07_21_234015_create_personal_access_tokens_table	1
7	2026_07_21_234016_create_activity_log_table	1
8	2026_07_21_234017_add_event_column_to_activity_log_table	1
9	2026_07_21_234018_add_batch_uuid_column_to_activity_log_table	1
10	2026_07_22_000001_crear_tablas_fase2_academicas	1
11	2026_08_07_000001_crear_tabla_cursos	2
12	2026_08_07_000002_crear_tabla_horarios	3
13	2026_08_07_000003_crear_tabla_asistencias	4
14	2026_08_07_000004_crear_tabla_notas	4
15	2026_08_07_000005_crear_tabla_comunicados	4
\.


--
-- Data for Name: model_has_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.model_has_permissions (permission_id, model_type, model_id) FROM stdin;
\.


--
-- Data for Name: model_has_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.model_has_roles (role_id, model_type, model_id) FROM stdin;
1	App\\Models\\Usuario	1
\.


--
-- Data for Name: notas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notas (id, alumno_id, curso_id, seccion_id, bimestre, tipo, calificacion, peso, observacion, registrado_por, created_at, updated_at) FROM stdin;
1	1	1	1	1	examen	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
2	3	1	1	1	examen	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
3	4	1	1	1	examen	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
4	2	1	1	1	examen	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
5	1	1	1	1	practica	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
6	3	1	1	1	practica	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
7	4	1	1	1	practica	16.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
8	2	1	1	1	practica	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
9	1	1	1	1	tarea	12.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
10	3	1	1	1	tarea	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
11	4	1	1	1	tarea	9.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
12	2	1	1	1	tarea	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
13	1	1	1	1	participacion	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
14	3	1	1	1	participacion	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
15	4	1	1	1	participacion	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
16	2	1	1	1	participacion	17.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
17	1	1	1	2	examen	9.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
18	3	1	1	2	examen	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
19	4	1	1	2	examen	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
20	2	1	1	2	examen	9.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
21	1	1	1	2	practica	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
22	3	1	1	2	practica	17.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
23	4	1	1	2	practica	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
24	2	1	1	2	practica	17.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
25	1	1	1	2	tarea	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
26	3	1	1	2	tarea	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
27	4	1	1	2	tarea	14.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
28	2	1	1	2	tarea	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
29	1	1	1	2	participacion	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
30	3	1	1	2	participacion	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
31	4	1	1	2	participacion	17.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
32	2	1	1	2	participacion	9.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
33	1	2	1	1	examen	14.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
34	3	2	1	1	examen	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
35	4	2	1	1	examen	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
36	2	2	1	1	examen	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
37	1	2	1	1	practica	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
38	3	2	1	1	practica	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
39	4	2	1	1	practica	12.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
40	2	2	1	1	practica	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
41	1	2	1	1	tarea	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
42	3	2	1	1	tarea	16.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
43	4	2	1	1	tarea	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
44	2	2	1	1	tarea	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
45	1	2	1	1	participacion	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
46	3	2	1	1	participacion	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
47	4	2	1	1	participacion	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
48	2	2	1	1	participacion	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
49	1	2	1	2	examen	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
50	3	2	1	2	examen	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
51	4	2	1	2	examen	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
52	2	2	1	2	examen	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
53	1	2	1	2	practica	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
54	3	2	1	2	practica	16.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
55	4	2	1	2	practica	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
56	2	2	1	2	practica	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
57	1	2	1	2	tarea	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
58	3	2	1	2	tarea	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
59	4	2	1	2	tarea	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
60	2	2	1	2	tarea	12.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
61	1	2	1	2	participacion	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
62	3	2	1	2	participacion	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
63	4	2	1	2	participacion	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
64	2	2	1	2	participacion	9.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
65	1	3	1	1	examen	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
66	3	3	1	1	examen	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
67	4	3	1	1	examen	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
68	2	3	1	1	examen	17.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
69	1	3	1	1	practica	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
70	3	3	1	1	practica	12.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
71	4	3	1	1	practica	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
72	2	3	1	1	practica	16.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
73	1	3	1	1	tarea	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
74	3	3	1	1	tarea	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
75	4	3	1	1	tarea	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
76	2	3	1	1	tarea	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
77	1	3	1	1	participacion	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
78	3	3	1	1	participacion	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
79	4	3	1	1	participacion	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
80	2	3	1	1	participacion	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
81	1	3	1	2	examen	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
82	3	3	1	2	examen	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
83	4	3	1	2	examen	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
84	2	3	1	2	examen	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
85	1	3	1	2	practica	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
86	3	3	1	2	practica	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
87	4	3	1	2	practica	12.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
88	2	3	1	2	practica	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
89	1	3	1	2	tarea	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
90	3	3	1	2	tarea	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
91	4	3	1	2	tarea	16.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
92	2	3	1	2	tarea	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
93	1	3	1	2	participacion	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
94	3	3	1	2	participacion	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
95	4	3	1	2	participacion	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
96	2	3	1	2	participacion	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
97	1	4	1	1	examen	16.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
98	3	4	1	1	examen	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
99	4	4	1	1	examen	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
100	2	4	1	1	examen	12.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
101	1	4	1	1	practica	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
102	3	4	1	1	practica	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
103	4	4	1	1	practica	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
104	2	4	1	1	practica	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
105	1	4	1	1	tarea	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
106	3	4	1	1	tarea	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
107	4	4	1	1	tarea	16.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
108	2	4	1	1	tarea	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
109	1	4	1	1	participacion	9.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
110	3	4	1	1	participacion	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
111	4	4	1	1	participacion	9.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
112	2	4	1	1	participacion	8.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
113	1	4	1	2	examen	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
114	3	4	1	2	examen	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
115	4	4	1	2	examen	18.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
116	2	4	1	2	examen	11.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
117	1	4	1	2	practica	14.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
118	3	4	1	2	practica	12.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
119	4	4	1	2	practica	13.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
120	2	4	1	2	practica	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
121	1	4	1	2	tarea	9.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
122	3	4	1	2	tarea	20.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
123	4	4	1	2	tarea	15.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
124	2	4	1	2	tarea	14.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
125	1	4	1	2	participacion	17.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
126	3	4	1	2	participacion	10.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
127	4	4	1	2	participacion	19.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
128	2	4	1	2	participacion	14.00	1.00	\N	\N	2026-08-09 00:03:02	2026-08-09 00:03:02
\.


--
-- Data for Name: padres; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.padres (id, usuario_id, dni, nombres, apellidos, relacion, telefono, email, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
admin@sanjudastadeo.edu.pe	$2y$12$cUHXBNgZv4Rl5fmgUU4I1.lmjKhETHdLM4dxDfssV457dyAgvxl0W	2026-08-04 16:34:22
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, guard_name, created_at, updated_at) FROM stdin;
1	ver-alumnos	web	2026-07-28 00:48:57	2026-07-28 00:48:57
2	crear-alumnos	web	2026-07-28 00:48:57	2026-07-28 00:48:57
3	editar-alumnos	web	2026-07-28 00:48:57	2026-07-28 00:48:57
4	eliminar-alumnos	web	2026-07-28 00:48:57	2026-07-28 00:48:57
5	ver-docentes	web	2026-07-28 00:48:57	2026-07-28 00:48:57
6	crear-docentes	web	2026-07-28 00:48:57	2026-07-28 00:48:57
7	editar-docentes	web	2026-07-28 00:48:58	2026-07-28 00:48:58
8	eliminar-docentes	web	2026-07-28 00:48:58	2026-07-28 00:48:58
9	ver-usuarios	web	2026-07-28 00:48:58	2026-07-28 00:48:58
10	crear-usuarios	web	2026-07-28 00:48:58	2026-07-28 00:48:58
11	editar-usuarios	web	2026-07-28 00:48:58	2026-07-28 00:48:58
12	eliminar-usuarios	web	2026-07-28 00:48:58	2026-07-28 00:48:58
13	ver-roles	web	2026-07-28 00:48:58	2026-07-28 00:48:58
14	crear-roles	web	2026-07-28 00:48:58	2026-07-28 00:48:58
15	editar-roles	web	2026-07-28 00:48:58	2026-07-28 00:48:58
16	eliminar-roles	web	2026-07-28 00:48:58	2026-07-28 00:48:58
17	ver-grados	web	2026-07-28 00:48:58	2026-07-28 00:48:58
18	crear-grados	web	2026-07-28 00:48:58	2026-07-28 00:48:58
19	editar-grados	web	2026-07-28 00:48:58	2026-07-28 00:48:58
20	eliminar-grados	web	2026-07-28 00:48:58	2026-07-28 00:48:58
21	ver-cursos	web	2026-07-28 00:48:58	2026-07-28 00:48:58
22	crear-cursos	web	2026-07-28 00:48:58	2026-07-28 00:48:58
23	editar-cursos	web	2026-07-28 00:48:58	2026-07-28 00:48:58
24	eliminar-cursos	web	2026-07-28 00:48:58	2026-07-28 00:48:58
25	ver-horarios	web	2026-07-28 00:48:58	2026-07-28 00:48:58
26	crear-horarios	web	2026-07-28 00:48:58	2026-07-28 00:48:58
27	editar-horarios	web	2026-07-28 00:48:58	2026-07-28 00:48:58
28	eliminar-horarios	web	2026-07-28 00:48:58	2026-07-28 00:48:58
29	ver-asistencias	web	2026-07-28 00:48:58	2026-07-28 00:48:58
30	registrar-asistencias	web	2026-07-28 00:48:58	2026-07-28 00:48:58
31	editar-asistencias	web	2026-07-28 00:48:58	2026-07-28 00:48:58
32	ver-notas	web	2026-07-28 00:48:58	2026-07-28 00:48:58
33	registrar-notas	web	2026-07-28 00:48:58	2026-07-28 00:48:58
34	editar-notas	web	2026-07-28 00:48:58	2026-07-28 00:48:58
35	ver-comunicados	web	2026-07-28 00:48:58	2026-07-28 00:48:58
36	crear-comunicados	web	2026-07-28 00:48:58	2026-07-28 00:48:58
37	editar-comunicados	web	2026-07-28 00:48:58	2026-07-28 00:48:58
38	eliminar-comunicados	web	2026-07-28 00:48:58	2026-07-28 00:48:58
39	ver-reportes	web	2026-07-28 00:48:58	2026-07-28 00:48:58
40	exportar-reportes	web	2026-07-28 00:48:58	2026-07-28 00:48:58
41	ver-configuracion	web	2026-07-28 00:48:58	2026-07-28 00:48:58
42	editar-configuracion	web	2026-07-28 00:48:58	2026-07-28 00:48:58
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
1	App\\Models\\Usuario	1	token-acceso	4792fee620ba64a745164ed05f7f63a04f35b6300a65051b0a501f4f99cd48aa	["*"]	\N	\N	2026-07-28 00:51:10	2026-07-28 00:51:10
7	App\\Models\\Usuario	1	token-acceso	e4471938dfa92d676ba337872d86f699b6d21833df417cda40bd9847876f844e	["*"]	2026-08-09 00:06:26	\N	2026-08-08 23:20:13	2026-08-09 00:06:26
5	App\\Models\\Usuario	1	token-acceso	a5ac13092111207741322ee0115d68c4ad5cf0fd893cc43f288237369b96866c	["*"]	2026-08-04 16:24:21	\N	2026-08-04 16:15:47	2026-08-04 16:24:21
9	App\\Models\\Usuario	1	token-acceso	84c39e2ec2666996444102cfd27039558928c9dd817f9bb455167a75715fb7eb	["*"]	2026-08-12 03:31:06	\N	2026-08-09 23:34:05	2026-08-12 03:31:06
4	App\\Models\\Usuario	1	token-acceso	2f975b400cf3fb60141372de8f36778ced86ae96660cec792f04d36ab1a27adc	["*"]	2026-07-28 04:22:17	\N	2026-07-28 04:21:42	2026-07-28 04:22:17
3	App\\Models\\Usuario	1	token-acceso	e7e53ef7308b1eecc3f8335ac0fb81f4d4a6d2de073adce5461aa09bbfb07ffe	["*"]	2026-07-28 04:38:09	\N	2026-07-28 00:56:26	2026-07-28 04:38:09
8	App\\Models\\Usuario	1	token-acceso	6915b72b966d83b3ab4c1c9e4f1dddf7ebcb1565f2ee98425728afbc4fbd7f8e	["*"]	2026-08-09 23:12:42	\N	2026-08-09 23:03:34	2026-08-09 23:12:42
6	App\\Models\\Usuario	1	token-acceso	d9162ef903672f09a17a0a5e2fd4ad921df2e39e14760746fd86381e765b4fd8	["*"]	2026-08-07 23:39:00	\N	2026-08-07 22:48:26	2026-08-07 23:39:00
\.


--
-- Data for Name: role_has_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_has_permissions (permission_id, role_id) FROM stdin;
1	1
2	1
3	1
4	1
5	1
6	1
7	1
8	1
9	1
10	1
11	1
12	1
13	1
14	1
15	1
16	1
17	1
18	1
19	1
20	1
21	1
22	1
23	1
24	1
25	1
26	1
27	1
28	1
29	1
30	1
31	1
32	1
33	1
34	1
35	1
36	1
37	1
38	1
39	1
40	1
41	1
42	1
1	2
2	2
3	2
5	2
6	2
7	2
9	2
17	2
18	2
19	2
21	2
22	2
23	2
25	2
26	2
27	2
29	2
30	2
32	2
33	2
35	2
36	2
37	2
39	2
40	2
41	2
1	3
2	3
3	3
5	3
17	3
21	3
29	3
30	3
35	3
36	3
39	3
1	4
25	4
29	4
30	4
32	4
33	4
35	4
21	4
32	5
29	5
35	5
32	6
29	6
25	6
35	6
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, guard_name, created_at, updated_at) FROM stdin;
1	administrador	web	2026-07-28 00:48:57	2026-07-28 00:48:57
2	director	web	2026-07-28 00:48:57	2026-07-28 00:48:57
3	secretario	web	2026-07-28 00:48:57	2026-07-28 00:48:57
4	docente	web	2026-07-28 00:48:57	2026-07-28 00:48:57
5	padre	web	2026-07-28 00:48:57	2026-07-28 00:48:57
6	alumno	web	2026-07-28 00:48:57	2026-07-28 00:48:57
\.


--
-- Data for Name: secciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.secciones (id, grado_id, nombre, capacidad, docente_tutor_id, estado, created_at, updated_at) FROM stdin;
1	1	A	30	1	t	2026-07-28 00:49:00	2026-07-28 00:49:00
2	1	B	30	2	t	2026-07-28 00:49:00	2026-07-28 00:49:00
3	2	A	30	1	t	2026-07-28 00:49:00	2026-07-28 00:49:00
4	2	B	30	2	t	2026-07-28 00:49:00	2026-07-28 00:49:00
5	3	A	30	1	t	2026-07-28 00:49:00	2026-07-28 00:49:00
6	3	B	30	2	t	2026-07-28 00:49:00	2026-07-28 00:49:00
7	4	A	30	1	t	2026-07-28 00:49:00	2026-07-28 00:49:00
8	4	B	30	2	t	2026-07-28 00:49:00	2026-07-28 00:49:00
9	5	A	30	1	t	2026-07-28 00:49:00	2026-07-28 00:49:00
10	5	B	30	2	t	2026-07-28 00:49:00	2026-07-28 00:49:00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nombre, apellido, email, email_verified_at, password, estado, foto, remember_token, created_at, updated_at) FROM stdin;
1	Admin	Sistema	admin@sanjudastadeo.edu.pe	\N	$2y$12$ZZMONcyKWZ6DC4U/2zf7wu3Wdn.xt.5W3tGno9CQRBcgMfQH2yINe	t	\N	\N	2026-07-28 00:48:59	2026-07-28 00:48:59
\.


--
-- Name: activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_log_id_seq', 1, true);


--
-- Name: alumno_padre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alumno_padre_id_seq', 1, false);


--
-- Name: alumno_seccion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alumno_seccion_id_seq', 4, true);


--
-- Name: alumnos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alumnos_id_seq', 4, true);


--
-- Name: asistencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asistencias_id_seq', 24, true);


--
-- Name: comunicados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comunicados_id_seq', 5, true);


--
-- Name: cursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cursos_id_seq', 52, true);


--
-- Name: docentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.docentes_id_seq', 3, true);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: grados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.grados_id_seq', 5, true);


--
-- Name: horarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.horarios_id_seq', 92, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 15, true);


--
-- Name: notas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notas_id_seq', 128, true);


--
-- Name: padres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.padres_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 42, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 9, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 6, true);


--
-- Name: secciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.secciones_id_seq', 10, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: alumno_padre alumno_padre_alumno_id_padre_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_padre
    ADD CONSTRAINT alumno_padre_alumno_id_padre_id_unique UNIQUE (alumno_id, padre_id);


--
-- Name: alumno_padre alumno_padre_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_padre
    ADD CONSTRAINT alumno_padre_pkey PRIMARY KEY (id);


--
-- Name: alumno_seccion alumno_seccion_alumno_id_seccion_id_año_escolar_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_seccion
    ADD CONSTRAINT "alumno_seccion_alumno_id_seccion_id_año_escolar_unique" UNIQUE (alumno_id, seccion_id, "año_escolar");


--
-- Name: alumno_seccion alumno_seccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_seccion
    ADD CONSTRAINT alumno_seccion_pkey PRIMARY KEY (id);


--
-- Name: alumnos alumnos_dni_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_dni_unique UNIQUE (dni);


--
-- Name: alumnos alumnos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_pkey PRIMARY KEY (id);


--
-- Name: asistencias asistencia_unica_dia; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencia_unica_dia UNIQUE (alumno_id, seccion_id, fecha);


--
-- Name: asistencias asistencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: comunicados comunicados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comunicados
    ADD CONSTRAINT comunicados_pkey PRIMARY KEY (id);


--
-- Name: cursos cursos_nombre_grado_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_nombre_grado_id_unique UNIQUE (nombre, grado_id);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (id);


--
-- Name: docentes docentes_dni_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_dni_unique UNIQUE (dni);


--
-- Name: docentes docentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: grados grados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grados
    ADD CONSTRAINT grados_pkey PRIMARY KEY (id);


--
-- Name: horarios horario_bloque_unico; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horario_bloque_unico UNIQUE (seccion_id, dia_semana, hora_inicio);


--
-- Name: horarios horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (permission_id, model_id, model_type);


--
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (role_id, model_id, model_type);


--
-- Name: notas notas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_pkey PRIMARY KEY (id);


--
-- Name: padres padres_dni_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.padres
    ADD CONSTRAINT padres_dni_unique UNIQUE (dni);


--
-- Name: padres padres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.padres
    ADD CONSTRAINT padres_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: permissions permissions_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles roles_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: secciones secciones_grado_id_nombre_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secciones
    ADD CONSTRAINT secciones_grado_id_nombre_unique UNIQUE (grado_id, nombre);


--
-- Name: secciones secciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secciones
    ADD CONSTRAINT secciones_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_unique UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: activity_log_log_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_log_log_name_index ON public.activity_log USING btree (log_name);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: causer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX causer ON public.activity_log USING btree (causer_type, causer_id);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: model_has_permissions_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_permissions_model_id_model_type_index ON public.model_has_permissions USING btree (model_id, model_type);


--
-- Name: model_has_roles_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_roles_model_id_model_type_index ON public.model_has_roles USING btree (model_id, model_type);


--
-- Name: nota_alumno_curso_bimestre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX nota_alumno_curso_bimestre ON public.notas USING btree (alumno_id, curso_id, bimestre);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subject ON public.activity_log USING btree (subject_type, subject_id);


--
-- Name: alumno_padre alumno_padre_alumno_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_padre
    ADD CONSTRAINT alumno_padre_alumno_id_foreign FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: alumno_padre alumno_padre_padre_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_padre
    ADD CONSTRAINT alumno_padre_padre_id_foreign FOREIGN KEY (padre_id) REFERENCES public.padres(id) ON DELETE CASCADE;


--
-- Name: alumno_seccion alumno_seccion_alumno_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_seccion
    ADD CONSTRAINT alumno_seccion_alumno_id_foreign FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: alumno_seccion alumno_seccion_seccion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_seccion
    ADD CONSTRAINT alumno_seccion_seccion_id_foreign FOREIGN KEY (seccion_id) REFERENCES public.secciones(id) ON DELETE CASCADE;


--
-- Name: alumnos alumnos_usuario_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_usuario_id_foreign FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: asistencias asistencias_alumno_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_alumno_id_foreign FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: asistencias asistencias_registrado_por_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_registrado_por_foreign FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: asistencias asistencias_seccion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_seccion_id_foreign FOREIGN KEY (seccion_id) REFERENCES public.secciones(id) ON DELETE CASCADE;


--
-- Name: comunicados comunicados_publicado_por_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comunicados
    ADD CONSTRAINT comunicados_publicado_por_foreign FOREIGN KEY (publicado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: cursos cursos_docente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_docente_id_foreign FOREIGN KEY (docente_id) REFERENCES public.docentes(id) ON DELETE SET NULL;


--
-- Name: cursos cursos_grado_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_grado_id_foreign FOREIGN KEY (grado_id) REFERENCES public.grados(id) ON DELETE CASCADE;


--
-- Name: docentes docentes_usuario_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_usuario_id_foreign FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: horarios horarios_curso_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_curso_id_foreign FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- Name: horarios horarios_docente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_docente_id_foreign FOREIGN KEY (docente_id) REFERENCES public.docentes(id) ON DELETE SET NULL;


--
-- Name: horarios horarios_seccion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_seccion_id_foreign FOREIGN KEY (seccion_id) REFERENCES public.secciones(id) ON DELETE CASCADE;


--
-- Name: model_has_permissions model_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: model_has_roles model_has_roles_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: notas notas_alumno_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_alumno_id_foreign FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: notas notas_curso_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_curso_id_foreign FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- Name: notas notas_registrado_por_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_registrado_por_foreign FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: notas notas_seccion_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas
    ADD CONSTRAINT notas_seccion_id_foreign FOREIGN KEY (seccion_id) REFERENCES public.secciones(id) ON DELETE CASCADE;


--
-- Name: padres padres_usuario_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.padres
    ADD CONSTRAINT padres_usuario_id_foreign FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: role_has_permissions role_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: secciones secciones_docente_tutor_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secciones
    ADD CONSTRAINT secciones_docente_tutor_id_foreign FOREIGN KEY (docente_tutor_id) REFERENCES public.docentes(id) ON DELETE SET NULL;


--
-- Name: secciones secciones_grado_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secciones
    ADD CONSTRAINT secciones_grado_id_foreign FOREIGN KEY (grado_id) REFERENCES public.grados(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 75E9DRYPRBvKdC4PYnB31vBYSahropuBaJgGm707ANRWPczYrjLcXvomxy99oS1

