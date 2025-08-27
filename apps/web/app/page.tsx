'use client';
import { useSession } from "next-auth/react";
import Navbar from "../src/components/navbar/Navbar";
import SigninComponent from "../src/components/ui/SigninComponent";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession()
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/tradingview");
    }
  }, [status, router])

  return (
    <div>
      <Navbar />
      <SigninComponent />
    </div>
  )
}