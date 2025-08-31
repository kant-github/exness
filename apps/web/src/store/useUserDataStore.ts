import { create } from "zustand";
import { User } from "../types/prisma-types";

interface UserDataType {
    userData: User | null;
    setUserData: (user: Partial<User>) => void;
}

export const useUserDataStore = create<UserDataType>((set) => ({
    userData: null,
    setUserData: (user: Partial<User>) => 
        set((state) => ({
            userData: state.userData ?
                { ...state.userData, ...user } :
                (user as User)
        }))
}))