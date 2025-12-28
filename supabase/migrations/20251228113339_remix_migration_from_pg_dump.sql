CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'admin',
    'finance',
    'professor'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    COALESCE(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    grade_level integer NOT NULL,
    section text NOT NULL,
    period text NOT NULL,
    academic_year integer NOT NULL,
    max_students integer DEFAULT 40,
    class_director_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT classes_grade_level_check CHECK ((grade_level = ANY (ARRAY[10, 11, 12, 13]))),
    CONSTRAINT classes_period_check CHECK ((period = ANY (ARRAY['Manhã'::text, 'Tarde'::text])))
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_nucleus_id uuid,
    name text NOT NULL,
    coordinator_id uuid,
    monthly_fee_10 numeric(10,2) DEFAULT 0,
    monthly_fee_11 numeric(10,2) DEFAULT 0,
    monthly_fee_12 numeric(10,2) DEFAULT 0,
    monthly_fee_13 numeric(10,2) DEFAULT 0,
    internship_fee numeric(10,2) DEFAULT 0,
    credential_fee numeric(10,2) DEFAULT 0,
    defense_entry_fee numeric(10,2) DEFAULT 0,
    tutor_fee numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: grade_change_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grade_change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    grade_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    old_mac numeric(4,2),
    old_npt numeric(4,2),
    old_mt numeric(4,2),
    new_mac numeric(4,2),
    new_npt numeric(4,2),
    new_mt numeric(4,2),
    reason text,
    status text DEFAULT 'pending'::text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT grade_change_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    teacher_id uuid,
    academic_year integer NOT NULL,
    trimester integer NOT NULL,
    mac numeric(4,2),
    npt numeric(4,2),
    mt numeric(4,2),
    observations text,
    pending_approval boolean DEFAULT false,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT grades_mac_check CHECK (((mac >= (0)::numeric) AND (mac <= (20)::numeric))),
    CONSTRAINT grades_mt_check CHECK (((mt >= (0)::numeric) AND (mt <= (20)::numeric))),
    CONSTRAINT grades_npt_check CHECK (((npt >= (0)::numeric) AND (npt <= (20)::numeric))),
    CONSTRAINT grades_trimester_check CHECK ((trimester = ANY (ARRAY[1, 2, 3])))
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    month_reference integer NOT NULL,
    year_reference integer NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    payment_method text,
    receipt_number text,
    observations text,
    recorded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_month_reference_check CHECK (((month_reference >= 1) AND (month_reference <= 12))),
    CONSTRAINT payments_payment_method_check CHECK ((payment_method = ANY (ARRAY['Dinheiro'::text, 'Transferência'::text, 'Multicaixa Express'::text, 'Depósito'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    username text,
    phone text,
    avatar_url text,
    bi_number text,
    bi_issue_date date,
    birth_date date,
    birth_place text,
    province text,
    parent_names text,
    must_change_password boolean DEFAULT true,
    password_history text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: school_nuclei; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.school_nuclei (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    logo_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    enrollment_number text NOT NULL,
    full_name text NOT NULL,
    birth_date date,
    parent_names text,
    birthplace text,
    province text,
    bi_number text,
    bi_issue_date date,
    photo_url text,
    guardian_name text,
    guardian_contact text,
    class_id uuid,
    enrollment_year integer NOT NULL,
    status text DEFAULT 'active'::text,
    gender text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT students_gender_check CHECK ((gender = ANY (ARRAY['Masculino'::text, 'Feminino'::text]))),
    CONSTRAINT students_status_check CHECK ((status = ANY (ARRAY['active'::text, 'dropout'::text, 'graduated'::text, 'transferred'::text])))
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    name text NOT NULL,
    grade_level integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subjects_grade_level_check CHECK ((grade_level = ANY (ARRAY[10, 11, 12, 13])))
);


--
-- Name: teacher_class_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_class_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_id uuid NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    schedule jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    profile_id uuid,
    employee_number text NOT NULL,
    degree text,
    degree_area text,
    gross_salary numeric(10,2) DEFAULT 0,
    hire_date date,
    functions text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: grade_change_requests grade_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade_change_requests
    ADD CONSTRAINT grade_change_requests_pkey PRIMARY KEY (id);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: grades grades_student_id_subject_id_academic_year_trimester_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_student_id_subject_id_academic_year_trimester_key UNIQUE (student_id, subject_id, academic_year, trimester);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_student_id_month_reference_year_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_student_id_month_reference_year_reference_key UNIQUE (student_id, month_reference, year_reference);


--
-- Name: profiles profiles_bi_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_bi_number_key UNIQUE (bi_number);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: school_nuclei school_nuclei_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_nuclei
    ADD CONSTRAINT school_nuclei_pkey PRIMARY KEY (id);


--
-- Name: students students_bi_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_bi_number_key UNIQUE (bi_number);


--
-- Name: students students_enrollment_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_enrollment_number_key UNIQUE (enrollment_number);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: teacher_class_assignments teacher_class_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_class_assignments
    ADD CONSTRAINT teacher_class_assignments_pkey PRIMARY KEY (id);


--
-- Name: teacher_class_assignments teacher_class_assignments_teacher_id_class_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_class_assignments
    ADD CONSTRAINT teacher_class_assignments_teacher_id_class_id_subject_id_key UNIQUE (teacher_id, class_id, subject_id);


--
-- Name: teachers teachers_employee_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_employee_number_key UNIQUE (employee_number);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: classes update_classes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: courses update_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: grades update_grades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: school_nuclei update_school_nuclei_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_school_nuclei_updated_at BEFORE UPDATE ON public.school_nuclei FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: students update_students_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: teachers update_teachers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: classes classes_class_director_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_class_director_fkey FOREIGN KEY (class_director_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: classes classes_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: courses courses_coordinator_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_coordinator_fkey FOREIGN KEY (coordinator_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: courses courses_school_nucleus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_school_nucleus_id_fkey FOREIGN KEY (school_nucleus_id) REFERENCES public.school_nuclei(id) ON DELETE CASCADE;


--
-- Name: grade_change_requests grade_change_requests_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade_change_requests
    ADD CONSTRAINT grade_change_requests_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE CASCADE;


--
-- Name: grade_change_requests grade_change_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade_change_requests
    ADD CONSTRAINT grade_change_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id);


--
-- Name: grade_change_requests grade_change_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade_change_requests
    ADD CONSTRAINT grade_change_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: grades grades_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: grades grades_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: grades grades_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: grades grades_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: payments payments_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id);


--
-- Name: payments payments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- Name: subjects subjects_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: teacher_class_assignments teacher_class_assignments_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_class_assignments
    ADD CONSTRAINT teacher_class_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: teacher_class_assignments teacher_class_assignments_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_class_assignments
    ADD CONSTRAINT teacher_class_assignments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: teacher_class_assignments teacher_class_assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_class_assignments
    ADD CONSTRAINT teacher_class_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;


--
-- Name: teachers teachers_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: teachers teachers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: teacher_class_assignments Admins can manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage assignments" ON public.teacher_class_assignments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: classes Admins can manage classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage classes" ON public.classes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: students Admins can manage students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage students" ON public.students USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: teachers Admins can manage teachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage teachers" ON public.teachers USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: grade_change_requests Admins can update requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update requests" ON public.grade_change_requests FOR UPDATE USING ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: teacher_class_assignments Authenticated users can view assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view assignments" ON public.teacher_class_assignments FOR SELECT TO authenticated USING (true);


--
-- Name: classes Authenticated users can view classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);


--
-- Name: courses Authenticated users can view courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view courses" ON public.courses FOR SELECT TO authenticated USING (true);


--
-- Name: grades Authenticated users can view grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view grades" ON public.grades FOR SELECT TO authenticated USING (true);


--
-- Name: school_nuclei Authenticated users can view school nuclei; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view school nuclei" ON public.school_nuclei FOR SELECT TO authenticated USING (true);


--
-- Name: students Authenticated users can view students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT TO authenticated USING (true);


--
-- Name: subjects Authenticated users can view subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);


--
-- Name: teachers Authenticated users can view teachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view teachers" ON public.teachers FOR SELECT TO authenticated USING (true);


--
-- Name: grade_change_requests Authenticated users can view their requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view their requests" ON public.grade_change_requests FOR SELECT TO authenticated USING (((requested_by = auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: payments Finance and admins can view payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Finance and admins can view payments" ON public.payments FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'finance'::public.app_role)));


--
-- Name: payments Finance can manage payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Finance can manage payments" ON public.payments USING (public.has_role(auth.uid(), 'finance'::public.app_role));


--
-- Name: profiles Super admins can manage all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all profiles" ON public.profiles USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: user_roles Super admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: teacher_class_assignments Super admins can manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage assignments" ON public.teacher_class_assignments USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: classes Super admins can manage classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage classes" ON public.classes USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: courses Super admins can manage courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage courses" ON public.courses USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: grades Super admins can manage grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage grades" ON public.grades USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: payments Super admins can manage payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage payments" ON public.payments USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: school_nuclei Super admins can manage school nuclei; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage school nuclei" ON public.school_nuclei USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: students Super admins can manage students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage students" ON public.students USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: subjects Super admins can manage subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage subjects" ON public.subjects USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: teachers Super admins can manage teachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage teachers" ON public.teachers USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: audit_logs Super admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: grade_change_requests Teachers can create requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can create requests" ON public.grade_change_requests FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'professor'::public.app_role));


--
-- Name: grades Teachers can manage their own grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage their own grades" ON public.grades USING ((EXISTS ( SELECT 1
   FROM public.teachers t
  WHERE ((t.user_id = auth.uid()) AND (t.id = grades.teacher_id)))));


--
-- Name: teachers Teachers can view their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view their own data" ON public.teachers FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: grade_change_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grade_change_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: grades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: school_nuclei; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.school_nuclei ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: teacher_class_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teacher_class_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: teachers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;