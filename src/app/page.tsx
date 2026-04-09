"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { supabase } from "@/lib/supabase";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { Users, Target, Activity, ArrowUpRight, Smartphone, ShieldCheck, Building2, MapPin } from "lucide-react";

interface TopB2B {
  name: string;
  count: number;
}

interface DeviceState {
  state: string;
  mobile: number;
  desktop: number;
  tablet: number;
  total: number;
}

interface DashboardStats {
  totalVisits: number;
  humanVisits: number;
  totalLeads: number;
  healthRate: number;
  deviceDominant: string;
  dailyTraffic: { date: string; humans: number; bots: number }[];
  topB2B: TopB2B[];
  deviceStates: DeviceState[];
}

export default function Overview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVisits: 0,
    humanVisits: 0,
    totalLeads: 0,
    healthRate: 0,
    deviceDominant: "Calculando...",
    dailyTraffic: [],
    topB2B: [],
    deviceStates: []
  });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      
      // Exit animation
      gsap.to(containerRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power4.in",
        onComplete: () => {
          router.push("/login");
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  useGSAP(() => {
    if (loading) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 0.5 } });

    // Reveal Container
    tl.to(containerRef.current, { opacity: 1, duration: 0.2 });

    // Header Entrance
    tl.from(".animate-header", {
      y: -50,
      opacity: 0,
      stagger: 0.1,
    });

    // Stats Cards Stagger
    tl.from(".animate-stat-card", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.4,
    }, "-=0.2");

    // Sections Entrance
    tl.from(".animate-section", {
      y: 20,
      opacity: 0,
      stagger: 0.1,
    }, "-=0.2");

    // B2B Items Stagger
    tl.from(".animate-b2b-item", {
      x: -20,
      opacity: 0,
      stagger: 0.05,
      duration: 0.3,
    }, "-=0.3");

  }, { scope: containerRef, dependencies: [loading] });

  // Hover Handlers
  const onCardEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.02,
      borderColor: "#ff2a00",
      backgroundColor: "#161616",
      duration: 0.3,
      ease: "power2.out"
    });
    gsap.to(e.currentTarget.querySelector(".animate-icon"), {
      rotate: 5,
      scale: 1.1,
      color: "#ff2a00",
      duration: 0.3
    });
  };

  const onCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      borderColor: "#333",
      backgroundColor: "#111",
      duration: 0.3,
      ease: "power2.inOut"
    });
    gsap.to(e.currentTarget.querySelector(".animate-icon"), {
      rotate: 0,
      scale: 1,
      color: "#ff2a00", 
      duration: 0.3
    });
  };

  const onListItemEnter = (e: React.MouseEvent<HTMLLIElement>) => {
    gsap.to(e.currentTarget, {
      x: 10,
      backgroundColor: "#111",
      color: "#f4f4f5",
      paddingLeft: "12px",
      duration: 0.2,
      ease: "power2.out"
    });
  };

  const onListItemLeave = (e: React.MouseEvent<HTMLLIElement>) => {
    gsap.to(e.currentTarget, {
      x: 0,
      backgroundColor: "transparent",
      paddingLeft: "0px",
      duration: 0.2,
      ease: "power2.inOut"
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: visits } = await supabase
          .from("visits")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: leads } = await supabase
          .from("site-create")
          .select("*");

        if (visits && leads) {
          const processed = processData(visits, leads);
          setStats(processed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const processData = (visits: any[], leads: any[]): DashboardStats => {
    const genericISPs = ["vivo", "claro", "tim", "starlink", "oi", "amazon", "google", "microsoft", "unknown", "apple", "cloudflare", "facebook"];
    
    let humanCount = 0;
    const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
    
    const daily: Record<string, { humans: number; bots: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      daily[d.toISOString().split("T")[0]] = { humans: 0, bots: 0 };
    }

    const b2bCounts: Record<string, number> = {};
    const stateCounts: Record<string, { mobile: number; desktop: number; tablet: number; total: number }> = {};

    visits.forEach(v => {
      const isBot = v.bot_score !== null && v.bot_score < 30;
      const isHuman = !isBot;
      
      if (isHuman) humanCount++;

      const date = v.created_at.split("T")[0];
      if (daily[date]) {
        if (isHuman) daily[date].humans++;
        else daily[date].bots++;
      }

      if (isHuman) {
        // Device
        const dev = v.device_type || "Desktop";
        deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;

        // B2B
        const org = (v.as_organization || "Unknown").toLowerCase();
        if (!genericISPs.some(isp => org.includes(isp)) && org.length > 3) {
          const displayOrg = org.toUpperCase();
          b2bCounts[displayOrg] = (b2bCounts[displayOrg] || 0) + 1;
        }

        // States Region
        const region = (v.region || "Desconhecido").toUpperCase();
        if (region.length > 1 && region !== "UNKNOWN") {
          if (!stateCounts[region]) {
            stateCounts[region] = { mobile: 0, desktop: 0, tablet: 0, total: 0 };
          }
          stateCounts[region].total++;
          if (dev === "Mobile") stateCounts[region].mobile++;
          else if (dev === "Tablet") stateCounts[region].tablet++;
          else stateCounts[region].desktop++;
        }
      }
    });

    let deviceDominant = "N/A";
    let maxDev = 0;
    Object.entries(deviceCounts).forEach(([dev, count]) => {
      if (count > maxDev) {
        maxDev = count;
        deviceDominant = dev;
      }
    });
    
    const healthRate = visits.length > 0 ? ((humanCount / visits.length) * 100).toFixed(1) : 0;

    const topB2B = Object.entries(b2bCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const deviceStates = Object.entries(stateCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6)
      .map(([state, counts]) => ({ state, ...counts }));

    return {
      totalVisits: visits.length,
      humanVisits: humanCount,
      totalLeads: leads.length,
      healthRate: Number(healthRate),
      deviceDominant: humanCount > 0 ? `${deviceDominant} (${((maxDev / humanCount) * 100).toFixed(0)}%)` : "Nenhum",
      dailyTraffic: Object.entries(daily).map(([date, counts]) => ({
        date: date.split("-").slice(1).join("/"),
        ...counts
      })),
      topB2B,
      deviceStates
    };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-[#f4f4f5]">
      <div className="animate-pulse font-black text-4xl uppercase tracking-tighter">Sincronizando Sensor...</div>
    </div>
  );

  return (
    <div ref={containerRef} className="p-8 md:p-12 max-w-7xl mx-auto space-y-12 bg-[#0a0a0a] text-[#f4f4f5] opacity-0 animate-init overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-[#ff2a00] pl-6 animate-header">
        <div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
            Dashboard de<br/><span className="text-[#ff2a00]">Analytics.</span>
          </h1>
          <div className="mt-2 text-[#888] font-mono text-sm uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ff2a00]" /> 
            <span>Modo B2B Ativado — Tráfego Sanitizado</span>
          </div>
        </div>
        <div className="flex gap-4">
          <a href="/leads" className="bg-[#111] border border-[#333] px-6 py-3 uppercase font-bold text-xs tracking-widest hover:bg-[#ff2a00] hover:text-white transition-colors">
            Acessar Base de Leads
          </a>
          <button 
            onClick={handleLogout}
            className="bg-transparent border border-[#333] px-6 py-3 uppercase font-bold text-xs tracking-widest hover:border-[#ff2a00] hover:text-[#ff2a00] transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onMouseEnter={onCardEnter}
          onMouseLeave={onCardLeave}
          className="bg-[#111] border border-[#333] p-8 relative group overflow-hidden animate-stat-card cursor-pointer transition-colors"
        >
          <Users className="w-8 h-8 text-[#ff2a00] mb-4 animate-icon" />
          <h3 className="text-[#888] text-xs font-mono uppercase tracking-widest">Humanos Únicos</h3>
          <p className="text-4xl font-black mt-1">{stats.humanVisits.toLocaleString()}</p>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-[#ff2a00]" />
          </div>
        </div>

        <div 
          onMouseEnter={onCardEnter}
          onMouseLeave={onCardLeave}
          className="bg-[#111] border border-[#333] p-8 relative group overflow-hidden animate-stat-card cursor-pointer transition-colors"
        >
          <Target className="w-8 h-8 text-[#ff2a00] mb-4 animate-icon" />
          <h3 className="text-[#888] text-xs font-mono uppercase tracking-widest">Cadastros Realizados</h3>
          <p className="text-4xl font-black mt-1">{stats.totalLeads.toLocaleString()}</p>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-[#ff2a00]" />
          </div>
        </div>

        <div 
          onMouseEnter={onCardEnter}
          onMouseLeave={onCardLeave}
          className="bg-[#111] border border-[#333] p-8 relative group overflow-hidden animate-stat-card cursor-pointer transition-colors"
        >
          <Activity className="w-8 h-8 text-[#ff2a00] mb-4 animate-icon" />
          <h3 className="text-[#888] text-xs font-mono uppercase tracking-widest">Saúde do Tráfego</h3>
          <p className="text-4xl font-black mt-1">{stats.healthRate}%</p>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-[#ff2a00]" />
          </div>
        </div>

        <div 
          onMouseEnter={onCardEnter}
          onMouseLeave={onCardLeave}
          className="bg-[#111] border border-[#333] p-8 relative group overflow-hidden animate-stat-card cursor-pointer transition-colors"
        >
          <Smartphone className="w-8 h-8 text-[#ff2a00] mb-4 animate-icon" />
          <h3 className="text-[#888] text-xs font-mono uppercase tracking-widest">Disp. Principal</h3>
          <p className="text-2xl font-black mt-3">{stats.deviceDominant}</p>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-[#ff2a00]" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-section">
        <div className="lg:col-span-2 bg-[#111] border border-[#333] p-8">
          <h3 className="text-xl font-black uppercase tracking-tight mb-8 border-b border-[#333] pb-4 flex justify-between items-center">
            <span>Volume Analítico — <span className="text-[#ff2a00]">7 Dias</span></span>
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyTraffic}>
                <defs>
                  <linearGradient id="colorHumans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff2a00" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ff2a00" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBots" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#888" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#888" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#555" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#555" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #333", color: "#f4f4f5" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
                <Area 
                  name="Bots/Lixo"
                  type="monotone" 
                  dataKey="bots" 
                  stroke="#555" 
                  fillOpacity={1} 
                  fill="url(#colorBots)" 
                  stackId="1"
                />
                <Area 
                  name="Humanos"
                  type="monotone" 
                  dataKey="humans" 
                  stroke="#ff2a00" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHumans)" 
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111] border border-[#333] p-8">
          <h3 className="text-xl font-black uppercase tracking-tight mb-8 border-b border-[#333] pb-4">
            <Building2 className="inline w-5 h-5 mr-3 text-[#ff2a00] -mt-1"/> 
            Radar <span className="text-[#ff2a00]">B2B</span>
          </h3>
          <ul className="space-y-6">
            {stats.topB2B.map((org, idx) => (
              <li 
                key={idx} 
                onMouseEnter={onListItemEnter}
                onMouseLeave={onListItemLeave}
                className="flex items-center justify-between group border-b border-[#222] pb-3 last:border-0 last:pb-0 animate-b2b-item cursor-default"
              >
                <span className="text-[#888] font-mono text-xs max-w-[200px] overflow-hidden group-hover:text-[#f4f4f5] transition-colors leading-tight">
                  {org.name}
                </span>
                <span className="font-black text-lg text-[#ff2a00] ml-4">{org.count}</span>
              </li>
            ))}
            {stats.topB2B.length === 0 && (
              <li className="text-[#555] font-mono text-xs uppercase italic mt-10 text-center">Coletando amostras corporativas...</li>
            )}
          </ul>
        </div>
      </section>
      
      <section className="bg-[#111] border border-[#333] p-8 animate-section">
         <h3 className="text-xl font-black uppercase tracking-tight mb-8 border-b border-[#333] pb-4">
          <MapPin className="inline w-5 h-5 mr-3 text-[#ff2a00] -mt-1"/>
          Densidade <span className="text-[#ff2a00]">Regional</span> x Dispositivos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.deviceStates.map((st, i) => (
             <div 
               key={i} 
               onMouseEnter={onCardEnter}
               onMouseLeave={onCardLeave}
               className="border border-[#333] bg-black p-6 group hover:border-[#ff2a00] transition-colors animate-stat-card cursor-pointer"
             >
                <h4 className="text-xl font-black uppercase mb-4 text-[#f4f4f5] border-b border-[#222] pb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#ff2a00] animate-icon" />
                  {st.state}
                </h4>
                <div className="space-y-3 text-sm font-mono text-[#888]">
                  <div className="flex justify-between items-center">
                    <span>📱 Mobile:</span> <span className="text-white font-bold">{st.mobile}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>💻 Desktop:</span> <span className="text-white font-bold">{st.desktop}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#333] text-sm">
                     <span className="uppercase tracking-widest text-xs">Acessos Qualificados</span> 
                     <span className="text-[#ff2a00] font-black text-lg">{st.total}</span>
                  </div>
                </div>
             </div>
          ))}
          {stats.deviceStates.length === 0 && (
             <div className="col-span-full py-12 text-center text-[#555] font-mono text-xs uppercase italic">
               Aguardando mapeamento geográfico...
             </div>
          )}
        </div>
      </section>
    </div>
  );
}
