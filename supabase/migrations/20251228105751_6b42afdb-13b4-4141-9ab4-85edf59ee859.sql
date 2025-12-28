
-- Create role enum for the 4 access levels
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'finance', 'professor');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    bi_number TEXT UNIQUE,
    bi_issue_date DATE,
    birth_date DATE,
    birth_place TEXT,
    province TEXT,
    parent_names TEXT,
    must_change_password BOOLEAN DEFAULT true,
    password_history TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all profiles" ON public.profiles
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- School Nuclei (Núcleos Escolares)
CREATE TABLE public.school_nuclei (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.school_nuclei ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view school nuclei" ON public.school_nuclei
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage school nuclei" ON public.school_nuclei
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_nucleus_id UUID REFERENCES public.school_nuclei(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    coordinator_id UUID,
    monthly_fee_10 DECIMAL(10,2) DEFAULT 0,
    monthly_fee_11 DECIMAL(10,2) DEFAULT 0,
    monthly_fee_12 DECIMAL(10,2) DEFAULT 0,
    monthly_fee_13 DECIMAL(10,2) DEFAULT 0,
    internship_fee DECIMAL(10,2) DEFAULT 0,
    credential_fee DECIMAL(10,2) DEFAULT 0,
    defense_entry_fee DECIMAL(10,2) DEFAULT 0,
    tutor_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view courses" ON public.courses
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage courses" ON public.courses
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Subjects/Disciplines table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level IN (10, 11, 12, 13)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subjects" ON public.subjects
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage subjects" ON public.subjects
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level IN (10, 11, 12, 13)),
    section TEXT NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('Manhã', 'Tarde')),
    academic_year INTEGER NOT NULL,
    max_students INTEGER DEFAULT 40,
    class_director_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view classes" ON public.classes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage classes" ON public.classes
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage classes" ON public.classes
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Teachers table
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_number TEXT UNIQUE NOT NULL,
    degree TEXT,
    degree_area TEXT,
    gross_salary DECIMAL(10,2) DEFAULT 0,
    hire_date DATE,
    functions TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view teachers" ON public.teachers
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage teachers" ON public.teachers
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage teachers" ON public.teachers
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view their own data" ON public.teachers
FOR SELECT USING (user_id = auth.uid());

-- Teacher class assignments
CREATE TABLE public.teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    schedule JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (teacher_id, class_id, subject_id)
);

ALTER TABLE public.teacher_class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assignments" ON public.teacher_class_assignments
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage assignments" ON public.teacher_class_assignments
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage assignments" ON public.teacher_class_assignments
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    birth_date DATE,
    parent_names TEXT,
    birthplace TEXT,
    province TEXT,
    bi_number TEXT UNIQUE,
    bi_issue_date DATE,
    photo_url TEXT,
    guardian_name TEXT,
    guardian_contact TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    enrollment_year INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropout', 'graduated', 'transferred')),
    gender TEXT CHECK (gender IN ('Masculino', 'Feminino')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view students" ON public.students
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage students" ON public.students
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage students" ON public.students
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Grades table
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    academic_year INTEGER NOT NULL,
    trimester INTEGER NOT NULL CHECK (trimester IN (1, 2, 3)),
    mac DECIMAL(4,2) CHECK (mac >= 0 AND mac <= 20),
    npt DECIMAL(4,2) CHECK (npt >= 0 AND npt <= 20),
    mt DECIMAL(4,2) CHECK (mt >= 0 AND mt <= 20),
    observations TEXT,
    pending_approval BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id, subject_id, academic_year, trimester)
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view grades" ON public.grades
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage grades" ON public.grades
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Teachers can manage their own grades" ON public.grades
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.teachers t 
        WHERE t.user_id = auth.uid() AND t.id = grades.teacher_id
    )
);

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    month_reference INTEGER NOT NULL CHECK (month_reference >= 1 AND month_reference <= 12),
    year_reference INTEGER NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT CHECK (payment_method IN ('Dinheiro', 'Transferência', 'Multicaixa Express', 'Depósito')),
    receipt_number TEXT,
    observations TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id, month_reference, year_reference)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admins can view payments" ON public.payments
FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'finance')
);

CREATE POLICY "Finance can manage payments" ON public.payments
FOR ALL USING (public.has_role(auth.uid(), 'finance'));

CREATE POLICY "Super admins can manage payments" ON public.payments
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view audit logs" ON public.audit_logs
FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (true);

-- Grade change requests (for professor approval workflow)
CREATE TABLE public.grade_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id UUID REFERENCES public.grades(id) ON DELETE CASCADE NOT NULL,
    requested_by UUID REFERENCES auth.users(id) NOT NULL,
    old_mac DECIMAL(4,2),
    old_npt DECIMAL(4,2),
    old_mt DECIMAL(4,2),
    new_mac DECIMAL(4,2),
    new_npt DECIMAL(4,2),
    new_mt DECIMAL(4,2),
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view their requests" ON public.grade_change_requests
FOR SELECT TO authenticated USING (
    requested_by = auth.uid() OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Teachers can create requests" ON public.grade_change_requests
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Admins can update requests" ON public.grade_change_requests
FOR UPDATE USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin')
);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_nuclei_updated_at BEFORE UPDATE ON public.school_nuclei
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add coordinator foreign key after teachers table exists
ALTER TABLE public.courses ADD CONSTRAINT courses_coordinator_fkey 
FOREIGN KEY (coordinator_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Add class director foreign key
ALTER TABLE public.classes ADD CONSTRAINT classes_class_director_fkey 
FOREIGN KEY (class_director_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
