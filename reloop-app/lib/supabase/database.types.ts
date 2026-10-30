export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

/**
 * Hand-written stand-in for `supabase gen types`.
 * Replace this file when a Supabase project exists.
 * Authorization roles belong in app_metadata, never in user-editable metadata.
 */
export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        full_name: string;
        role: "donor" | "student" | "recycler" | "admin";
        city: string | null;
        points_month: number;
        points_lifetime: number;
        created_at: string;
      }>;
      devices: Table<{
        id: string;
        owner_id: string;
        category: string;
        brand: string;
        model: string;
        description: string;
        age_years: number;
        condition: string;
        working_status: string;
        estimated_value: number;
        points: number;
        status: string;
        created_at: string;
      }>;
      pickups: Table<{
        id: string;
        device_id: string;
        recycler_id: string | null;
        address: string;
        city: string;
        collection_date: string | null;
        status: string;
        created_at: string;
      }>;
      listings: Table<{
        id: string;
        device_id: string;
        student_price: number | null;
        donation_status: string;
        campus: string;
        note: string;
      }>;
      assistance_requests: Table<{
        id: string;
        student_id: string;
        category: string;
        need: string;
        campus: string;
        status: string;
      }>;
      reward_events: Table<{
        id: string;
        profile_id: string;
        label: string;
        points: number;
        created_at: string;
      }>;
      recycler_profiles: Table<{
        id: string;
        profile_id: string;
        org_name: string;
        license: string;
        city: string;
        status: string;
      }>;
      monthly_winners: Table<{
        id: string;
        month: string;
        profile_id: string;
        rank: number;
        points: number;
        published: boolean;
      }>;
      pickup_events: Table<{
        id: string;
        pickup_id: string;
        status: string;
        note: string;
        happened_at: string;
      }>;
    };
    Views: {
      leaderboard: {
        Row: {
          id: string;
          full_name: string;
          city: string | null;
          points_month: number;
          points_lifetime: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
