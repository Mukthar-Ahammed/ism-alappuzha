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
          must_change_password: boolean;
          role: "admin" | "reviewer";
          updated_at: string;
        };
        Insert: {
          added_by?: string | null;
          created_at?: string;
          email: string;
          must_change_password?: boolean;
          role?: "admin" | "reviewer";
          updated_at?: string;
        };
        Update: {
          added_by?: string | null;
          created_at?: string;
          email?: string;
          must_change_password?: boolean;
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
      namaz_steps: {
        Row: {
          id: string;
          position: number;
          name: string;
          what_to_do: string;
          arabic: string;
          transliteration: string | null;
          malayalam: string | null;
          dos: string[];
          donts: string[];
          name_ml: string | null;
          what_to_do_ml: string | null;
          transliteration_ml: string | null;
          dos_ml: string[];
          donts_ml: string[];
          is_repeat_node: boolean;
          status: "draft" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          position: number;
          name: string;
          what_to_do: string;
          arabic: string;
          transliteration?: string | null;
          malayalam?: string | null;
          dos?: string[];
          donts?: string[];
          name_ml?: string | null;
          what_to_do_ml?: string | null;
          transliteration_ml?: string | null;
          dos_ml?: string[];
          donts_ml?: string[];
          is_repeat_node?: boolean;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["namaz_steps"]["Insert"]>;
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
          reference_ml: string | null;
          repeat_count: number | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          sort_order: number;
          status: "draft" | "published";
          title: string;
          transliteration: string | null;
          transliteration_ml: string | null;
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
          reference_ml?: string | null;
          repeat_count?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          sort_order?: number;
          status?: "draft" | "published";
          title: string;
          transliteration?: string | null;
          transliteration_ml?: string | null;
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
          cover_media_id: string | null;
          cover_path: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_featured: boolean;
          issue_date: string;
          pdf_bytes: number | null;
          pdf_path: string;
          status: "draft" | "published";
          title: string;
          title_ml: string | null;
          description_ml: string | null;
          updated_at: string;
        };
        Insert: {
          cover_media_id?: string | null;
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_featured?: boolean;
          issue_date: string;
          pdf_bytes?: number | null;
          pdf_path: string;
          status?: "draft" | "published";
          title: string;
          title_ml?: string | null;
          description_ml?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
        Relationships: [];
      };
      leaders: {
        Row: {
          bio: string;
          bio_ml: string | null;
          created_at: string;
          id: string;
          import_key: string | null;
          instagram_url: string | null;
          linkedin_url: string | null;
          name: string;
          name_ml: string | null;
          photo_media_id: string | null;
          role: string;
          role_ml: string | null;
          sort_order: number;
          status: "draft" | "published";
          updated_at: string;
        };
        Insert: {
          bio?: string;
          bio_ml?: string | null;
          created_at?: string;
          id?: string;
          import_key?: string | null;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          name: string;
          name_ml?: string | null;
          photo_media_id?: string | null;
          role: string;
          role_ml?: string | null;
          sort_order?: number;
          status?: "draft" | "published";
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leaders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "leaders_photo_media_id_fkey";
            columns: ["photo_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets: {
        Row: {
          alt: string;
          blur_data_url: string;
          bytes: number;
          content_hash: string;
          created_at: string;
          created_by: string | null;
          height: number;
          id: string;
          path: string;
          purpose: "leader_photo" | "issue_cover" | "program_poster" | "video_thumbnail";
          thumb_bytes: number;
          thumb_height: number;
          thumb_path: string;
          thumb_width: number;
          width: number;
        };
        Insert: {
          alt?: string;
          blur_data_url: string;
          bytes: number;
          content_hash: string;
          created_at?: string;
          created_by?: string | null;
          height: number;
          id?: string;
          path: string;
          purpose: "leader_photo" | "issue_cover" | "program_poster" | "video_thumbnail";
          thumb_bytes: number;
          thumb_height: number;
          thumb_path: string;
          thumb_width: number;
          width: number;
        };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Insert"]>;
        Relationships: [];
      };
      videos: {
        Row: {
          category: "Speeches" | "Campaigns" | "Youth";
          created_at: string;
          duration: string | null;
          id: string;
          platform: "youtube" | "facebook" | "instagram";
          recorded_on: string;
          speaker: string;
          speaker_ml: string | null;
          status: "draft" | "published";
          thumbnail_media_id: string | null;
          title: string;
          title_ml: string | null;
          updated_at: string;
          watch_url: string;
          youtube_id: string | null;
        };
        Insert: {
          category: "Speeches" | "Campaigns" | "Youth";
          created_at?: string;
          duration?: string | null;
          id?: string;
          platform: "youtube" | "facebook" | "instagram";
          recorded_on: string;
          speaker?: string;
          speaker_ml?: string | null;
          status?: "draft" | "published";
          thumbnail_media_id?: string | null;
          title: string;
          title_ml?: string | null;
          updated_at?: string;
          watch_url: string;
          youtube_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "videos_thumbnail_media_id_fkey";
            columns: ["thumbnail_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      live_status: {
        Row: {
          id: number;
          is_live: boolean;
          platform: "youtube" | "facebook" | "instagram";
          speaker: string | null;
          speaker_ml: string | null;
          title: string | null;
          title_ml: string | null;
          updated_at: string;
          updated_by: string | null;
          watch_url: string | null;
          youtube_id: string | null;
        };
        Insert: {
          id?: number;
          is_live?: boolean;
          platform?: "youtube" | "facebook" | "instagram";
          speaker?: string | null;
          speaker_ml?: string | null;
          title?: string | null;
          title_ml?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          watch_url?: string | null;
          youtube_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["live_status"]["Insert"]>;
        Relationships: [];
      };
      programs: {
        Row: {
          created_at: string;
          description: string | null;
          ends_at: string | null;
          format: "in_person" | "online" | "hybrid";
          id: string;
          link_url: string | null;
          poster_media_id: string | null;
          poster_path: string | null;
          speaker: string | null;
          starts_at: string;
          status: "scheduled" | "cancelled";
          title: string;
          updated_at: string;
          venue: string | null;
          title_ml: string | null;
          speaker_ml: string | null;
          venue_ml: string | null;
          description_ml: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          format?: "in_person" | "online" | "hybrid";
          id?: string;
          link_url?: string | null;
          poster_media_id?: string | null;
          poster_path?: string | null;
          speaker?: string | null;
          starts_at: string;
          status?: "scheduled" | "cancelled";
          title: string;
          updated_at?: string;
          venue?: string | null;
          title_ml?: string | null;
          speaker_ml?: string | null;
          venue_ml?: string | null;
          description_ml?: string | null;
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
      admin_archive_question: {
        Args: {
          p_actor_email: string;
          p_expected_updated_at: string;
          p_question_id: string;
          p_reason: string;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"];
      };
      admin_add_admin_allowlist: {
        Args: {
          p_actor_email: string;
          p_role: "admin" | "reviewer";
          p_target_email: string;
        };
        Returns: Database["public"]["Tables"]["admins"]["Row"];
      };
      admin_cancel_program: {
        Args: { p_id: string; p_actor_email: string };
        Returns: undefined;
      };
      admin_duplicate_program: {
        Args: { p_id: string; p_actor_email: string };
        Returns: string;
      };
      admin_end_live: {
        Args: { p_actor_email: string };
        Returns: Database["public"]["Tables"]["live_status"]["Row"];
      };
      admin_save_program: {
        Args: {
          p_id: string | null;
          p_title: string;
          p_speaker: string;
          p_starts_at: string;
          p_ends_at: string | null;
          p_format: string;
          p_venue: string;
          p_description: string | null;
          p_link_url: string | null;
          p_poster_media_id: string | null;
          p_poster_alt: string;
          p_title_ml: string | null;
          p_speaker_ml: string | null;
          p_venue_ml: string | null;
          p_description_ml: string | null;
          p_actor_email: string;
        };
        Returns: Json;
      };
      admin_delete_video: {
        Args: { p_id: string; p_actor_email: string };
        Returns: Json;
      };
      admin_save_video: {
        Args: {
          p_id: string | null;
          p_title: string;
          p_title_ml: string | null;
          p_speaker: string;
          p_speaker_ml: string | null;
          p_category: string;
          p_platform: string;
          p_watch_url: string;
          p_youtube_id: string | null;
          p_recorded_on: string;
          p_duration: string | null;
          p_thumbnail_media_id: string | null;
          p_thumbnail_alt: string;
          p_actor_email: string;
        };
        Returns: Json;
      };
      admin_set_video_status: {
        Args: { p_id: string; p_status: string; p_actor_email: string };
        Returns: undefined;
      };
      admin_set_live: {
        Args: {
          p_platform: string;
          p_youtube_id: string | null;
          p_watch_url: string;
          p_title: string;
          p_title_ml: string | null;
          p_speaker: string;
          p_speaker_ml: string | null;
          p_actor_email: string;
        };
        Returns: Database["public"]["Tables"]["live_status"]["Row"];
      };
      admin_save_dhikr: {
        Args: {
          p_id: string | null;
          p_title: string;
          p_category: string;
          p_arabic: string;
          p_transliteration: string | null;
          p_transliteration_ml: string | null;
          p_malayalam: string | null;
          p_reference: string | null;
          p_reference_ml: string | null;
          p_repeat_count: number | null;
          p_actor_email: string;
        };
        Returns: Json;
      };
      admin_set_dhikr_review: {
        Args: { p_id: string; p_reviewed: boolean; p_actor_email: string };
        Returns: undefined;
      };
      admin_set_dhikr_status: {
        Args: { p_id: string; p_status: "draft" | "published"; p_actor_email: string };
        Returns: undefined;
      };
      admin_move_dhikr: {
        Args: { p_id: string; p_direction: "up" | "down"; p_actor_email: string };
        Returns: undefined;
      };
      admin_delete_dhikr: {
        Args: { p_id: string; p_actor_email: string };
        Returns: undefined;
      };
      admin_delete_issue: {
        Args: { p_id: string; p_actor_email: string };
        Returns: Json;
      };
      admin_feature_issue: {
        Args: { p_id: string; p_actor_email: string };
        Returns: undefined;
      };
      admin_save_issue: {
        Args: {
          p_id: string | null;
          p_title: string;
          p_issue_date: string;
          p_description: string | null;
          p_cover_media_id: string;
          p_cover_alt: string;
          p_pdf_path: string;
          p_pdf_bytes: number;
          p_title_ml: string | null;
          p_description_ml: string | null;
          p_actor_email: string;
        };
        Returns: Json;
      };
      admin_set_issue_status: {
        Args: { p_id: string; p_status: string; p_actor_email: string };
        Returns: undefined;
      };
      admin_delete_leader: {
        Args: { p_id: string; p_actor_email: string };
        Returns: Json;
      };
      admin_import_leaders: {
        Args: { p_leaders: Json; p_actor_email: string };
        Returns: number;
      };
      admin_move_leader: {
        Args: { p_id: string; p_direction: string; p_actor_email: string };
        Returns: boolean;
      };
      admin_record_media_asset: {
        Args: {
          p_actor_email: string;
          p_purpose: string;
          p_path: string;
          p_thumb_path: string;
          p_width: number;
          p_height: number;
          p_thumb_width: number;
          p_thumb_height: number;
          p_bytes: number;
          p_thumb_bytes: number;
          p_blur_data_url: string;
          p_content_hash: string;
        };
        Returns: Database["public"]["Tables"]["media_assets"]["Row"];
      };
      admin_release_media_asset: {
        Args: { p_media_id: string; p_actor_email: string };
        Returns: Json;
      };
      admin_save_leader: {
        Args: {
          p_id: string | null;
          p_name: string;
          p_name_ml: string | null;
          p_role: string;
          p_role_ml: string | null;
          p_bio: string;
          p_bio_ml: string | null;
          p_linkedin_url: string | null;
          p_instagram_url: string | null;
          p_photo_media_id: string | null;
          p_photo_alt: string;
          p_actor_email: string;
        };
        Returns: Json;
      };
      admin_set_leader_status: {
        Args: { p_id: string; p_status: string; p_actor_email: string };
        Returns: undefined;
      };
      admin_audit_admin_event: {
        Args: {
          p_action: string;
          p_actor_email: string;
          p_detail?: Json;
          p_target_email: string;
        };
        Returns: number;
      };
      admin_delete_question: {
        Args: {
          p_actor_email: string;
          p_expected_updated_at: string;
          p_question_id: string;
        };
        Returns: string;
      };
      admin_list_questions: {
        Args: {
          p_category: string | null;
          p_has_email: boolean;
          p_limit: number;
          p_offset: number;
          p_private_only: boolean;
          p_published_only: boolean;
          p_search: string | null;
          p_sort: "newest" | "oldest";
          p_status: "pending" | "draft" | "answered" | "archived" | null;
        };
        Returns: {
          total_count: number;
          id: string;
          ticket_id: string;
          created_at: string;
          updated_at: string;
          category: string;
          question: string;
          status: string;
          is_private: boolean;
          is_published: boolean;
          email: string | null;
        }[];
      };
      admin_publish_question: {
        Args: {
          p_actor_email: string;
          p_expected_updated_at: string;
          p_public_question: string;
          p_question_id: string;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"];
      };
      admin_question_status_counts: {
        Args: {
          p_category: string | null;
          p_has_email: boolean;
          p_private_only: boolean;
          p_published_only: boolean;
          p_search: string | null;
        };
        Returns: {
          status: string;
          count: number;
        }[];
      };
      admin_restore_question: {
        Args: {
          p_actor_email: string;
          p_expected_updated_at: string;
          p_question_id: string;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"];
      };
      admin_remove_admin_allowlist: {
        Args: {
          p_actor_email: string;
          p_target_email: string;
        };
        Returns: string;
      };
      admin_save_question_draft: {
        Args: {
          p_actor_email: string;
          p_actor_id: string;
          p_answer: string;
          p_expected_updated_at: string;
          p_question_id: string;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"];
      };
      admin_save_question_notes: {
        Args: {
          p_actor_email: string;
          p_expected_updated_at: string;
          p_notes: string;
          p_question_id: string;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"];
      };
      admin_send_question_correction: {
        Args: {
          p_actor_email: string;
          p_actor_id: string;
          p_answer: string;
          p_expected_updated_at: string;
          p_question_id: string;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"];
      };
      admin_send_question_reply: {
        Args: {
          p_actor_email: string;
          p_actor_id: string;
          p_answer: string;
          p_expected_updated_at: string;
          p_question_id: string;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"];
      };
      admin_set_admin_role: {
        Args: {
          p_actor_email: string;
          p_new_role: "admin" | "reviewer";
          p_target_email: string;
        };
        Returns: Database["public"]["Tables"]["admins"]["Row"];
      };
      admin_unpublish_question: {
        Args: {
          p_actor_email: string;
          p_expected_updated_at: string;
          p_question_id: string;
        };
        Returns: Database["public"]["Tables"]["questions"]["Row"];
      };
      admin_revoke_user_sessions: {
        Args: {
          target_user_id: string;
        };
        Returns: void;
      };
      admin_session_is_active: {
        Args: {
          p_session_id: string;
        };
        Returns: boolean;
      };
      admin_get_guard_context: {
        Args: {
          p_email: string;
          p_session_id: string;
        };
        Returns: {
          role: "admin" | "reviewer" | null;
          session_active: boolean;
          /** Phase 10: why the session is no longer valid (it has then been revoked). */
          expired_reason?: "revoked" | "max_age" | "inactive" | null;
          must_change_password: boolean;
        };
      };
      admin_save_namaz_step: {
        Args: {
          p_id: string | null;
          p_name: string;
          p_name_ml: string | null;
          p_what_to_do: string;
          p_what_to_do_ml: string | null;
          p_arabic: string;
          p_transliteration: string | null;
          p_transliteration_ml: string | null;
          p_malayalam: string | null;
          p_dos: string[];
          p_dos_ml: string[];
          p_donts: string[];
          p_donts_ml: string[];
          p_is_repeat_node: boolean;
          p_actor_email: string;
        };
        Returns: Json;
      };
      admin_set_namaz_step_status: {
        Args: { p_id: string; p_status: "draft" | "published"; p_actor_email: string };
        Returns: undefined;
      };
      admin_move_namaz_step: {
        Args: { p_id: string; p_direction: "up" | "down"; p_actor_email: string };
        Returns: undefined;
      };
      admin_delete_namaz_step: {
        Args: { p_id: string; p_actor_email: string };
        Returns: undefined;
      };
      admin_end_session: {
        Args: { p_session_id: string };
        Returns: undefined;
      };
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
