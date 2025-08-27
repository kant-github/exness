import { signIn } from "next-auth/react";
import Image from "next/image";

export default function NewAccount() {

    async function signinHandler() {
        signIn('google', {
            redirect: false,
            callbackUrl: '/',
        });
    }


    return (
        <button onClick={signinHandler} type="button" className="w-full flex items-center justify-center gap-3 px-6 py-[10px] text-sm font-medium bg-neutral-200 hover:bg-neutral-200/70 dark:bg-dark-primary/30 hover:dark:bg-dark-primary/40 rounded-md border-[1px] border-neutral-300 dark:border-neutral-700 cursor-pointer">
            <Image src={'/images/image.png'} alt="google" width={24} height={24} />
            <span>Create account with Google</span>
        </button>
    )
}