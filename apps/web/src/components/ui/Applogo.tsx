import { Noto_Sans_Mono } from 'next/font/google';
import { cn } from '../../lib/utils';

const noto = Noto_Sans_Mono({ subsets: ['latin'], weight: '400' });

interface ApplogoProps {
    className?: string;
}

export default function Applogo({ className }: ApplogoProps) {
    return (
        <div className={cn(`${noto.className} text-3xl font-black dark:text-neutral-200 text-neutral-900 tracking-wider`, className)}>
            exness
        </div>
    )
}