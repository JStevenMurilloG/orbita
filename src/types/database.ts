
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "course_teachers": {
                  Row: {
                    "course_id": string,"created_at": string,"is_primary": boolean,"role": string | null,"teacher_id": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "course_id": string,"created_at"?: string,"is_primary"?: boolean,"role"?: string | null,"teacher_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"is_primary"?: boolean,"role"?: string | null,"teacher_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_teachers_course_fkey"
      columns: ["course_id","user_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "course_teachers_teacher_fkey"
      columns: ["teacher_id","user_id"]
isOneToOne: false
      referencedRelation: "teachers"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "code": string | null,"color": string,"created_at": string,"credits": number | null,"deleted_at": string | null,"description": string | null,"icon": string | null,"id": string,"name": string,"position": number,"room": string | null,"term_id": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "code"?: string | null,"color": string,"created_at"?: string,"credits"?: number | null,"deleted_at"?: string | null,"description"?: string | null,"icon"?: string | null,"id"?: string,"name": string,"position"?: number,"room"?: string | null,"term_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "code"?: string | null,"color"?: string,"created_at"?: string,"credits"?: number | null,"deleted_at"?: string | null,"description"?: string | null,"icon"?: string | null,"id"?: string,"name"?: string,"position"?: number,"room"?: string | null,"term_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "courses_term_fkey"
      columns: ["term_id","user_id"]
isOneToOne: false
      referencedRelation: "terms"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "active_term_id": string | null,"created_at": string,"full_name": string,"id": string,"onboarded_at": string | null,"theme": string,"timezone": string,"updated_at": string,"week_starts_on": number
                  }
                  Insert: {
                    "active_term_id"?: string | null,"created_at"?: string,"full_name": string,"id": string,"onboarded_at"?: string | null,"theme"?: string,"timezone"?: string,"updated_at"?: string,"week_starts_on"?: number
                  }
                  Update: {
                    "active_term_id"?: string | null,"created_at"?: string,"full_name"?: string,"id"?: string,"onboarded_at"?: string | null,"theme"?: string,"timezone"?: string,"updated_at"?: string,"week_starts_on"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_active_term_fkey"
      columns: ["active_term_id","id"]
isOneToOne: false
      referencedRelation: "terms"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"teachers": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string,"id": string,"notes": string | null,"office": string | null,"office_hours": string | null,"phone": string | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name": string,"id"?: string,"notes"?: string | null,"office"?: string | null,"office_hours"?: string | null,"phone"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"notes"?: string | null,"office"?: string | null,"office_hours"?: string | null,"phone"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"terms": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"description": string | null,"end_date": string,"finished_at": string | null,"id": string,"name": string,"start_date": string,"status": Database["public"]['Enums']["term_status"],"timezone": string,"updated_at": string,"user_id": string,"year": number
                  }
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"description"?: string | null,"end_date": string,"finished_at"?: string | null,"id"?: string,"name": string,"start_date": string,"status"?: Database["public"]['Enums']["term_status"],"timezone": string,"updated_at"?: string,"user_id"?: string,"year": number
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"description"?: string | null,"end_date"?: string,"finished_at"?: string | null,"id"?: string,"name"?: string,"start_date"?: string,"status"?: Database["public"]['Enums']["term_status"],"timezone"?: string,"updated_at"?: string,"user_id"?: string,"year"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "immutable_unaccent":
{ Args: { "input": string }; Returns: string
                           },
"is_valid_timezone":
{ Args: { "tz": string }; Returns: boolean
                           },
"reorder_courses":
{ Args: { "p_course_ids": (string)[],"p_term_id": string }; Returns: undefined
                           },
"set_course_primary_teacher":
{ Args: { "p_course_id": string,"p_teacher_id": string }; Returns: undefined
                           },
"tables_without_rls":
{ Args: Record<PropertyKey, never>; Returns: {
              "table_name": string
            }[]
                           }
          }
          Enums: {
            "term_status": "active"|"finished"|"archived"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "term_status": ["active", "finished", "archived"]
          }
        }
} as const

