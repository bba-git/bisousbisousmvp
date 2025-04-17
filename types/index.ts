export interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  description?: string;
  specialties?: string[];
  working_hours?: {
    day: string;
    start_time: string;
    end_time: string;
  }[];
} 