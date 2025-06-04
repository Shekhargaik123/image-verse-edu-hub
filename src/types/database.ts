export interface Profile {
  id: string;
  name: string;
  department: string;
  semester: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface EducationalImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  preview_image_url?: string | null;
  subject: 'Engineering Drawing' | 'Thermodynamics' | 'Mechanics' | 'Materials Science' | 'Mathematics' | 'Physics' | 'Chemistry' | 'General';
  type: 'Diagrams' | 'Notes' | 'Charts' | 'Formulas' | 'Examples' | 'Reference' | '3D Model';
  tags: string[];
  semester: number;
  uploaded_by: string;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  image_id: string;
  created_at: string;
}
