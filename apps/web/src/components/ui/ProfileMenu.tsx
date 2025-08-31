'use client';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUserSessionStore } from '../../store/useUserSessionStore';
import UtilityCard from './UtilityCard';
import { SiGithub } from "react-icons/si";
import { IoMdLogOut } from 'react-icons/io';
import { GoDotFill } from "react-icons/go";
import { signOut } from 'next-auth/react';

export default function ProfileMenu() {
    const { session } = useUserSessionStore();
    const [dropdown, setDropdown] = useState<boolean>(false);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        right: 0,
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        function hndleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdown(false);
            }
        }

        document.addEventListener('mousedown', hndleClickOutside);
        return () => {
            document.removeEventListener('mousedown', hndleClickOutside);
        }
    }, [dropdownRef]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (dropdown && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8, // 8px gap
                right: window.innerWidth - rect.right - window.scrollX,
            });
        }
    }, [dropdown]);

    async function logoutHandler() {
        signOut({
            callbackUrl: '/',
        });
    }
    const dropdownContent =
        dropdown && mounted ? (
            <div
                ref={dropdownRef}
                className="fixed z-[99999] select-none"
                style={{
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                }}
            >
                <UtilityCard className="p-0 w-[10rem] overflow-hidden bg-[#141c23] border border-neutral-700 shadow-lg">
                    <div>
                        <div className="px-4 py-[11px] text-xs font-normal text-white border-b border-neutral-700 cursor-default">
                            My Profile
                        </div>
                        <a
                            href="https://github.com/celestium-x/triangulum-x/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-[11px] text-xs font-light text-white hover:bg-neutral-800 border-b border-neutral-700 flex justify-between"
                        >
                            Github
                            <SiGithub />
                        </a>
                        <div
                            className="px-4 py-[11px] text-xs font-normal text-red-500 hover:bg-neutral-800 flex justify-between cursor-pointer"
                            onClick={logoutHandler}
                        >
                            Sign Out
                            <IoMdLogOut size={14} />
                        </div>
                    </div>
                </UtilityCard>
            </div>
        ) : null;

    return (
        <div className="relative" ref={triggerRef}>
            {session?.user?.image && (
                <>
                    <Image
                        onClick={() => setDropdown(true)}
                        src={session?.user.image}
                        width={32}
                        height={32}
                        alt="user-logo"
                        className="rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    />
                    <GoDotFill className="absolute -bottom-0.5 -right-0 w-3 h-3 fill-green-500 text-green-500 rounded-full" />
                </>
            )}
            {mounted && createPortal(dropdownContent, document.body)}
        </div>
    );
}
