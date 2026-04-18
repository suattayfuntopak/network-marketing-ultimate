"use client";
import { useRouter } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const router = useRouter();
  return (
    <LandingPage
      onNavigateToRegister={() => router.push("/auth/signup")}
      onNavigateToLogin={() => router.push("/auth/login")}
    />
  );
}