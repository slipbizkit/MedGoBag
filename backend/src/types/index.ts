export interface JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
}

export interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  otp_secret: string;
  otp_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DbMedicine {
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
