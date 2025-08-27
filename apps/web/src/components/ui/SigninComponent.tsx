'use client'
import Image from "next/image";
import { cn } from "../../lib/utils";
import { SigninComponentRenderer, useSigninComponentRenderer } from "../../store/useSigninComponentRenderer"
import ExistingAccount from "./ExistingAccount";
import NewAccount from "./NewAccount";

export default function SigninComponent() {
    const { state, setState } = useSigninComponentRenderer();

    function renderSigninComponent() {
        switch (state) {
            case SigninComponentRenderer.SIGNIN:
                return <ExistingAccount />
            case SigninComponentRenderer.SIGNUP:
                return <NewAccount />
        }
    }

    return (
        <div className="w-full ">
            <div className="max-w-[26rem] mx-auto py-8 flex flex-col gap-y-8">
                <div className="dark:text-neutral-200 text-neutral-900 text-start text-3xl tracking-wider font-semibold">Welcome to exness</div>
                <div className="w-full grid grid-cols-2">
                    <button onClick={() => setState(SigninComponentRenderer.SIGNIN)} type="button"
                        className={cn(
                            "col-span-1 text-center text-md py-4 border-b-4 border-transparent",
                            state === SigninComponentRenderer.SIGNIN && "border-black"
                        )}
                    >
                        Sign in
                    </button>
                    <button onClick={() => setState(SigninComponentRenderer.SIGNUP)} type="button"
                        className={cn(
                            "col-span-1 text-center text-md py-4 border-b-4 border-transparent",
                            state === SigninComponentRenderer.SIGNUP && "border-black"
                        )}
                    >
                        Create an account
                    </button>
                </div>
                {renderSigninComponent()}
            </div>
        </div>
    )
}