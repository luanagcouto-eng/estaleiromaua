"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Image from "next/image";

export default function LoginCard() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleGoogleLogin() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: "estaleiromaua.ind.br", // hint de domínio para o Google
        },
      },
    });
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#364B59] to-[#2D3F4A] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo-maua.png"
            alt="Estaleiro Mauá"
            width={180}
            height={80}
            priority
            className="object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#364B59]">Metas Mauá 2026</h1>
            <p className="text-xs text-muted-foreground mt-1">Gestão de metas corporativas</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Botão Google */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-border rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-surface transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? "Redirecionando..." : "Entrar com Google"}
          </button>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Acesso restrito a colaboradores<br />
            <span className="font-medium text-[#364B59]">@estaleiromaua.ind.br</span>
          </p>
        </div>

      </div>
    </div>
  );
}
