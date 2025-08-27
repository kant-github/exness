import { create } from "zustand";

export enum SigninComponentRenderer {
    SIGNIN = "SIGNIN",
    SIGNUP = "SIGNUP",
}

interface SigninComponentRendererProps {
    state: SigninComponentRenderer,
    setState: (state: SigninComponentRenderer) => void,
}

export const useSigninComponentRenderer = create<SigninComponentRendererProps>((set) => ({
    state: SigninComponentRenderer.SIGNIN,
    setState: (state: SigninComponentRenderer) => set({ state }),
}))