'use client'

import { useSession } from "next-auth/react";
import { cn } from "../../src/lib/utils";
import SessionSetter from "../../src/store/sessionSetter";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { data: session } = useSession();
    return (
        <html lang="en" className={cn("bg-[#141d24] w-full h-screen")}>
            <body>
                {children}
                <SessionSetter session={session} />
            </body>
        </html>
    );
}
