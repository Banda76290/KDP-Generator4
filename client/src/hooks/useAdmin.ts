import { useAuth } from "./useAuth";
import type { User } from "@shared/schema";

export function useAdmin() {
  const { user, isLoading } = useAuth();
  
  const typedUser = user as User | undefined;
  const isAdmin = typedUser?.role === 'admin' || typedUser?.role === 'superadmin';
  const isSuperAdmin = typedUser?.role === 'superadmin';
  
  return {
    isAdmin,
    isSuperAdmin,
    isLoading,
  };
}