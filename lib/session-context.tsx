import { createContext, useContext } from 'react';

// Global auth context — Clerk tabanlı
// Tüm child ekranlar buradan userId/userRole okur.
export type AuthCtxType = {
  userId: string | null;
  userRole: string | null;
};

export const SessionCtx = createContext<AuthCtxType>({ userId: null, userRole: null });
export const useSession = () => useContext(SessionCtx);
