import type { Request } from "express";

// Custom user type for authenticated requests
export interface AuthenticatedUser {
  claims: {
    sub: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
  expires_at: number;
  access_token?: string;
  refresh_token?: string;
}

// Extend Express Request type to include authenticated user
export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user?: AuthenticatedUser;
  admin?: any;
}