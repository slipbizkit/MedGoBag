export interface Medicine {
  id: number;
  user_id: number;
  generic_name: string;
  brand_name: string | null;
  expiration_date: string;
  production_date: string | null;
  used_for: string;
  dosage: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: number;
  email: string;
  role: 'admin' | 'user';
  is_active: boolean;
  otp_enabled: boolean;
  created_at: string;
}
