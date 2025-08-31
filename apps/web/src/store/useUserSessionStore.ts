import { create } from 'zustand';
import { CustomSession } from '../../app/api/auth/[...nextauth]/options';

interface UserSessionStoreType {
    session: CustomSession | null;
    setSession: (data: CustomSession | null) => void;
}

export const useUserSessionStore = create<UserSessionStoreType>((set) => ({
    session: null,
    setSession: (data: CustomSession | null) => set({ session: data }),
}));
