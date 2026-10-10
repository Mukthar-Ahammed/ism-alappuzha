export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          added_by: string | null;
          created_at: string;
          email: string;
          role: "admin" | "reviewer";
          updated_at: string;
        };
        Insert: {
          added_by?: string | null;
          created_at?: string;
          email: string;
          role?: "admin" | "reviewer";
          updated_at?: string;
        };
        Update: {
          added_by?: string | null;
          created_at?: string;
          email?: string;
          role?: "admin" | "reviewer";
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor_email: string;
          created_at: string;
          detail: Json | null;
          entity: string;
          entity_id: string | null;
          id: number;
          question_id: string | null;
          ticket_id: string | null;
        };
        Insert: {
          action: string;
          actor_email: string;
          created_at?: string;
          detail?: Json | null;
          entity?: string;
          entity_id?: string | null;
          id?: never;
          question_id?: string | null;
          ticket_id?: string | null;
        };
        Update: {
          action?: string;
          actor_email?: string;
          created_at?: string;
          detail?: Json | null;
          entity?: string;
          entity_id?: string | null;
          id?: never;
          question_id?: string | null;
          ticket_id?: string | null;
        };
        Relationships: [];
      };
      dhikr_entries: {
        Row: {
          arabic: string;
          category: string;
          created_at: string;
          id: string;
          malayalam: string | null;
          occasion: string | null;
          reference: string | null;
          repeat_count: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          sort_order: number;
          status: "draft" | "published";
          title: string;
          transliteration: string | null;
          updated_at: string;
        };
        Insert: {
          arabic: string;
          category: string;
          created_at?: string;
          id?: string;
          malayalam?: string | null;
          occasion?: string | null;
          reference?: string | null;
          repeat_count?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          sort_order?: number;
          status?: "draft" | "published";
          title: string;
          transliteration?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dhikr_entries"]["Insert"]>;
        Relationships: [];
      };
      email_log: {
        Row: {
          created_at: string;
          error: string | null;
          id: number;
          kind: "reply" | "correction";
          question_id: string | null;
          status: "sent" | "failed";
          to_email: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: never;
          kind: "reply" | "correction";
          question_id?: string | null;
          status: "sent" | "failed";
          to_email: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_log"]["Insert"]>;
        Relationships: [];
      };
      issues: {
        Row: {
          cover_path: string;
          created_at: string;
          description: string | null;
          id: string;
          is_featured: boolean;
          issue_date: string;
          pdf_path: string;
          status: "draft" | "published";
          title: string;
          updated_at: string;
        };
        Insert: {
          cover_path: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_featured?: boolean;
          issue_date: string;
          pdf_path: string;
          status?: "draft" | "published";
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
        Relationships: [];
      };
      live_status: {
        Row: {
          id: number;
          is_live: boolean;
          speaker: string | null;
          title: string | null;
          updated_at: string;
          updated_by: string | null;
          youtube_id: string | null;
        };
        Insert: {
          id?: number;
          is_live?: boolean;
          speaker?: string | null;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          youtube_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["live_status"]["Insert"]>;
        Relationships: [];
      };
      programs: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          link_url: string | null;
          poster_path: string | null;
          speaker: string | null;
          starts_at: string;
          status: "scheduled" | "cancelled";
          title: string;
          updated_at: string;
          venue: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          link_url?: string | null;
          poster_path?: string | null;
          speaker?: string | null;
          starts_at: string;
          status?: "scheduled" | "cancelled";
          title: string;
          updated_at?: string;
          venue?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["programs"]["Insert"]>;
        Relationships: [];
      };
      questions: {
        Row: {
          answer: string | null;
          answered_at: string | null;
          answered_by: string | null;
          archive_reason: string | null;
          category: "Prayer" | "Faith" | "Daily life" | "Family" | "Other";
          created_at: string;
          draft_answer: string | null;
          email: string | null;
          id: string;
          internal_notes: string | null;
          is_private: boolean;
          is_published: boolean;
          name: string | null;
          needs_review: boolean;
          public_question: string | null;
          published_at: string | null;
          question: string;
          status: "pending" | "draft" | "answered" | "archived";
          ticket_id: string;
          updated_at: string;
        };
        Insert: {
          answer?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          archive_reason?: string | null;
          category: "Prayer" | "Faith" | "Daily life" | "Family" | "Other";
          created_at?: string;
          draft_answer?: string | null;
          email?: string | null;
          id?: string;
          internal_notes?: string | null;
          is_private?: boolean;
          is_published?: boolean;
          name?: string | null;
          needs_review?: boolean;
          public_question?: string | null;
          published_at?: string | null;
          question: string;
          status?: "pending" | "draft" | "answered" | "archived";
          ticket_id?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [];
      };
      rate_limits: {
        Row: {
          hit_count: number;
          key: string;
          updated_at: string;
          window_start: string;
        };
        Insert: {
          hit_count?: number;
          key: string;
          updated_at?: string;
          window_start?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limits"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_rate_limit: {
        Args: {
          key: string;
          max_hits: number;
          window_seconds: number;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
