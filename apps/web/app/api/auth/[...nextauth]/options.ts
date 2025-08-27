import { Account, AuthOptions, ISODateString } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';
import axios from 'axios';
import { SIGNIN_URL } from '../../../../src/routes/api_routes';

export interface UserType {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string | null;
    token?: string | null;
}

export interface CustomSession {
    user?: UserType;
    expires: ISODateString;
}

export const authOption: AuthOptions = {
    pages: {
        signIn: '/',
    },
    callbacks: {
        async signIn({ user, account }: { user: UserType; account: Account | null }) {
            console.log("started signin");
            try {
                if (account?.provider === 'google') {
                    console.log(SIGNIN_URL);
                    const response = await axios.post(`http://localhost:7001/api/auth/signin`, {
                        user,
                        account,
                    });

                    const result = response.data;
                    if (result?.success) {
                        user.id = result.user.id.toString();
                        user.token = result.token;
                        return true;
                    }
                }
                return false;
            } catch (err) {
                console.error(err);
                return false;
            }
        },
        async jwt({ token, user }) {
            if (user) {
                token.user = user as UserType;
            }
            return token;
        },
        async session({ session, token }: { session: CustomSession; token: JWT }) {
            session.user = token.user as UserType;
            return session;
        },
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code',
                },
            },
        }),
    ],
};
