export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year: number
          class_director_id: string | null
          course_id: string
          created_at: string
          grade_level: number
          id: string
          max_students: number | null
          period: string
          section: string
          updated_at: string
        }
        Insert: {
          academic_year: number
          class_director_id?: string | null
          course_id: string
          created_at?: string
          grade_level: number
          id?: string
          max_students?: number | null
          period: string
          section: string
          updated_at?: string
        }
        Update: {
          academic_year?: number
          class_director_id?: string | null
          course_id?: string
          created_at?: string
          grade_level?: number
          id?: string
          max_students?: number | null
          period?: string
          section?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_director_fkey"
            columns: ["class_director_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_faltas: {
        Row: {
          ativo: boolean
          criado_em: string
          desconto_falta_justificada: number
          desconto_falta_nao_justificada: number
          id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          desconto_falta_justificada: number
          desconto_falta_nao_justificada: number
          id?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          desconto_falta_justificada?: number
          desconto_falta_nao_justificada?: number
          id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          coordinator_id: string | null
          created_at: string
          credential_fee: number | null
          defense_entry_fee: number | null
          id: string
          internship_fee: number | null
          monthly_fee_10: number | null
          monthly_fee_11: number | null
          monthly_fee_12: number | null
          monthly_fee_13: number | null
          name: string
          school_nucleus_id: string | null
          tutor_fee: number | null
          updated_at: string
        }
        Insert: {
          coordinator_id?: string | null
          created_at?: string
          credential_fee?: number | null
          defense_entry_fee?: number | null
          id?: string
          internship_fee?: number | null
          monthly_fee_10?: number | null
          monthly_fee_11?: number | null
          monthly_fee_12?: number | null
          monthly_fee_13?: number | null
          name: string
          school_nucleus_id?: string | null
          tutor_fee?: number | null
          updated_at?: string
        }
        Update: {
          coordinator_id?: string | null
          created_at?: string
          credential_fee?: number | null
          defense_entry_fee?: number | null
          id?: string
          internship_fee?: number | null
          monthly_fee_10?: number | null
          monthly_fee_11?: number | null
          monthly_fee_12?: number | null
          monthly_fee_13?: number | null
          name?: string
          school_nucleus_id?: string | null
          tutor_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_coordinator_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_school_nucleus_id_fkey"
            columns: ["school_nucleus_id"]
            isOneToOne: false
            referencedRelation: "school_nuclei"
            referencedColumns: ["id"]
          },
        ]
      }
      estagios: {
        Row: {
          created_at: string
          data_inicio: string | null
          data_termino: string | null
          id: string
          local_estagio: string | null
          observacoes: string | null
          status: string | null
          student_id: string
          supervisor_contacto: string | null
          supervisor_nome: string | null
          tempo_estagio_meses: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_inicio?: string | null
          data_termino?: string | null
          id?: string
          local_estagio?: string | null
          observacoes?: string | null
          status?: string | null
          student_id: string
          supervisor_contacto?: string | null
          supervisor_nome?: string | null
          tempo_estagio_meses?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_inicio?: string | null
          data_termino?: string | null
          id?: string
          local_estagio?: string | null
          observacoes?: string | null
          status?: string | null
          student_id?: string
          supervisor_contacto?: string | null
          supervisor_nome?: string | null
          tempo_estagio_meses?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estagios_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      faltas_professores: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_falta: string
          disciplina_id: string
          id: string
          justificativa_arquivo_url: string | null
          justificativa_texto: string | null
          motivo: string | null
          observacoes_admin: string | null
          professor_id: string
          status: Database["public"]["Enums"]["professor_absence_status"]
          tipo_desconto:
            | Database["public"]["Enums"]["professor_absence_discount_type"]
            | null
          valor_descontado: number | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_falta: string
          disciplina_id: string
          id?: string
          justificativa_arquivo_url?: string | null
          justificativa_texto?: string | null
          motivo?: string | null
          observacoes_admin?: string | null
          professor_id: string
          status?: Database["public"]["Enums"]["professor_absence_status"]
          tipo_desconto?:
            | Database["public"]["Enums"]["professor_absence_discount_type"]
            | null
          valor_descontado?: number | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_falta?: string
          disciplina_id?: string
          id?: string
          justificativa_arquivo_url?: string | null
          justificativa_texto?: string | null
          motivo?: string | null
          observacoes_admin?: string | null
          professor_id?: string
          status?: Database["public"]["Enums"]["professor_absence_status"]
          tipo_desconto?:
            | Database["public"]["Enums"]["professor_absence_discount_type"]
            | null
          valor_descontado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faltas_professores_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faltas_professores_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_change_requests: {
        Row: {
          created_at: string
          grade_id: string
          id: string
          new_mac: number | null
          new_mt: number | null
          new_npt: number | null
          old_mac: number | null
          old_mt: number | null
          old_npt: number | null
          reason: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          grade_id: string
          id?: string
          new_mac?: number | null
          new_mt?: number | null
          new_npt?: number | null
          old_mac?: number | null
          old_mt?: number | null
          old_npt?: number | null
          reason?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          grade_id?: string
          id?: string
          new_mac?: number | null
          new_mt?: number | null
          new_npt?: number | null
          old_mac?: number | null
          old_mt?: number | null
          old_npt?: number | null
          reason?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_change_requests_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          academic_year: number
          approved_at: string | null
          approved_by: string | null
          class_id: string
          created_at: string
          id: string
          mac: number | null
          mt: number | null
          npt: number | null
          observations: string | null
          pending_approval: boolean | null
          student_id: string
          subject_id: string
          teacher_id: string | null
          trimester: number
          updated_at: string
        }
        Insert: {
          academic_year: number
          approved_at?: string | null
          approved_by?: string | null
          class_id: string
          created_at?: string
          id?: string
          mac?: number | null
          mt?: number | null
          npt?: number | null
          observations?: string | null
          pending_approval?: boolean | null
          student_id: string
          subject_id: string
          teacher_id?: string | null
          trimester: number
          updated_at?: string
        }
        Update: {
          academic_year?: number
          approved_at?: string | null
          approved_by?: string | null
          class_id?: string
          created_at?: string
          id?: string
          mac?: number | null
          mt?: number | null
          npt?: number | null
          observations?: string | null
          pending_approval?: boolean | null
          student_id?: string
          subject_id?: string
          teacher_id?: string | null
          trimester?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          base_amount: number
          created_at: string
          id: string
          late_fee: number
          month_reference: number
          observations: string | null
          payment_date: string
          payment_method: string | null
          receipt_number: string | null
          recorded_by: string | null
          student_id: string
          year_reference: number
        }
        Insert: {
          amount: number
          base_amount?: number
          created_at?: string
          id?: string
          late_fee?: number
          month_reference: number
          observations?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          recorded_by?: string | null
          student_id: string
          year_reference: number
        }
        Update: {
          amount?: number
          base_amount?: number
          created_at?: string
          id?: string
          late_fee?: number
          month_reference?: number
          observations?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          recorded_by?: string | null
          student_id?: string
          year_reference?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bi_issue_date: string | null
          bi_number: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string
          full_name: string
          id: string
          must_change_password: boolean | null
          parent_names: string | null
          password_history: string[] | null
          phone: string | null
          province: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bi_issue_date?: string | null
          bi_number?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          full_name: string
          id?: string
          must_change_password?: boolean | null
          parent_names?: string | null
          password_history?: string[] | null
          phone?: string | null
          province?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bi_issue_date?: string | null
          bi_number?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          full_name?: string
          id?: string
          must_change_password?: boolean | null
          parent_names?: string | null
          password_history?: string[] | null
          phone?: string | null
          province?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      school_nuclei: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          bi_issue_date: string | null
          bi_number: string | null
          birth_date: string | null
          birthplace: string | null
          class_id: string | null
          created_at: string
          enrollment_number: string
          enrollment_year: number
          full_name: string
          gender: string | null
          guardian_contact: string | null
          guardian_name: string | null
          id: string
          parent_names: string | null
          photo_url: string | null
          province: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          bi_issue_date?: string | null
          bi_number?: string | null
          birth_date?: string | null
          birthplace?: string | null
          class_id?: string | null
          created_at?: string
          enrollment_number: string
          enrollment_year: number
          full_name: string
          gender?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          id?: string
          parent_names?: string | null
          photo_url?: string | null
          province?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          bi_issue_date?: string | null
          bi_number?: string | null
          birth_date?: string | null
          birthplace?: string | null
          class_id?: string | null
          created_at?: string
          enrollment_number?: string
          enrollment_year?: number
          full_name?: string
          gender?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          id?: string
          parent_names?: string | null
          photo_url?: string | null
          province?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          course_id: string
          created_at: string
          grade_level: number
          id: string
          name: string
        }
        Insert: {
          course_id: string
          created_at?: string
          grade_level: number
          id?: string
          name: string
        }
        Update: {
          course_id?: string
          created_at?: string
          grade_level?: number
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_class_assignments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          periods: string[]
          schedule: Json | null
          subject_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          periods?: string[]
          schedule?: Json | null
          subject_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          periods?: string[]
          schedule?: Json | null
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_class_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_class_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          degree: string | null
          degree_area: string | null
          employee_number: string
          full_name: string
          functions: string[] | null
          gross_salary: number | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          profile_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          degree?: string | null
          degree_area?: string | null
          employee_number: string
          full_name?: string
          functions?: string[] | null
          gross_salary?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          degree?: string | null
          degree_area?: string | null
          employee_number?: string
          full_name?: string
          functions?: string[] | null
          gross_salary?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trabalhos_fim_curso: {
        Row: {
          created_at: string
          data_defesa: string | null
          id: string
          nota_final: number | null
          observacoes: string | null
          status: string | null
          student_id: string
          tema: string | null
          tutor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_defesa?: string | null
          id?: string
          nota_final?: number | null
          observacoes?: string | null
          status?: string | null
          student_id: string
          tema?: string | null
          tutor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_defesa?: string | null
          id?: string
          nota_final?: number | null
          observacoes?: string | null
          status?: string | null
          student_id?: string
          tema?: string | null
          tutor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trabalhos_fim_curso_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trabalhos_fim_curso_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "finance" | "professor"
      professor_absence_discount_type: "justificada" | "nao_justificada"
      professor_absence_status:
        | "registada"
        | "nao_justificada"
        | "justificativa_pendente"
        | "justificada"
        | "rejeitada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "finance", "professor"],
      professor_absence_discount_type: ["justificada", "nao_justificada"],
      professor_absence_status: [
        "registada",
        "nao_justificada",
        "justificativa_pendente",
        "justificada",
        "rejeitada",
      ],
    },
  },
} as const
