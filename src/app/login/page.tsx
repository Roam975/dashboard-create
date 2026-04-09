"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Lock, User, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 0.8 } });

    tl.from(".animate-card", {
      scale: 0.9,
      opacity: 0,
    });

    tl.from(".animate-input", {
      x: -20,
      opacity: 0,
      stagger: 0.1,
    }, "-=0.4");

    tl.from(".animate-button", {
      y: 20,
      opacity: 0,
    }, "-=0.2");
  }, { scope: containerRef });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.5,
          onComplete: () => router.push("/")
        });
      } else {
        setError("Acesso Negado. Credenciais inválidas.");
        gsap.fromTo(".animate-error", 
          { x: -10 }, 
          { x: 10, repeat: 5, yoyo: true, duration: 0.05 }
        );
      }
    } catch (err) {
      setError("Erro ao conectar ao servidor de autenticação.");
    }
  };

  return (
    <div ref={containerRef} className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-[#f4f4f5] p-4">
      <div className="w-full max-w-md bg-[#111] border-l-4 border-[#ff2a00] p-10 animate-card">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#ff2a00] p-2">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Acesso Restrito</h1>
            <p className="text-[#888] font-mono text-xs uppercase tracking-widest">Protocolo de Segurança B2B</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="animate-input">
            <label className="block text-[#888] font-mono text-[10px] uppercase tracking-[0.2em] mb-2 px-1">Iteração Analista</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#161616] border border-[#333] px-12 py-4 font-mono focus:outline-none focus:border-[#ff2a00] transition-colors"
                placeholder="USUÁRIO"
                required
              />
            </div>
          </div>

          <div className="animate-input">
            <label className="block text-[#888] font-mono text-[10px] uppercase tracking-[0.2em] mb-2 px-1">Chave de Encriptação</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#161616] border border-[#333] px-12 py-4 font-mono focus:outline-none focus:border-[#ff2a00] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="animate-error flex items-center gap-2 text-[#ff2a00] font-mono text-xs uppercase bg-[#ff2a001a] p-3 border-l-2 border-[#ff2a00]">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#ff2a00] text-white py-5 font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer animate-button"
          >
            Autenticar Terminal
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[#222] text-center">
          <p className="text-[#444] font-mono text-[9px] uppercase tracking-[0.3em]">
            Sistema Protegido par Antigravity Sentinel v4.0.2
          </p>
        </div>
      </div>
    </div>
  );
}
