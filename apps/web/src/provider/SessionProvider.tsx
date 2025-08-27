import { SessionProvider as NextSessionProvider } from "next-auth/react"
import { CustomSession } from "../../app/api/auth/[...nextauth]/options";

interface Props {
    children: React.ReactNode;
    session?: CustomSession | null;
}

export default function SessionProvider({ children, session }: Props) {
    return (
        <NextSessionProvider session={session} >
            {children}
        </NextSessionProvider>
    )
}