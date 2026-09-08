export const STATUSES = [
  'Interested',
  'Applied',
  'Waiting',
  'Interview #1',
  'Interview #2',
  'Interview #3',
  'Technical Interview',
  'Final Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Ghosted',
  'Withdrawn',
] as const;
export type Status = (typeof STATUSES)[number];
export type Application = {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  job_link: string;
  location: string;
  application_date: string;
  status: Status;
  notes: string;
  created_at: string;
  updated_at: string;
};
export type ApplicationInput = Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type Database = {
  public: {
    Tables: {
      applications: {
        Row: Application;
        Insert: ApplicationInput & {
          user_id: string;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ApplicationInput>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
