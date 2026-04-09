"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ChevronLeft, Download, Filter, X, Copy, Check, Calendar, Building2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await supabase
        .from("site-create")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setLeads(data || []);
        setFilteredLeads(data || []);
      }
      setLoading(false);
    }

    fetchLeads();
  }, []);

  useEffect(() => {
    const filtered = leads.filter(lead => 
      (lead.nome?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (lead.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (lead.telefone?.toLowerCase() || "").includes(search.toLowerCase())
    );
    setFilteredLeads(filtered);
  }, [search, leads]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-[#f4f4f5]">
      <div className="animate-pulse font-black text-4xl uppercase tracking-tighter">Sincronizando Leads...</div>
    </div>
  );

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto min-h-screen bg-[#0a0a0a] text-[#f4f4f5] space-y-12 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-[#ff2a00] pl-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-[#888] hover:text-[#ff2a00] font-mono text-xs uppercase tracking-widest mb-4 transition-colors">
            <ChevronLeft size={14} /> Voltar ao Início
          </Link>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
            Leads<br/><span className="text-[#ff2a00]">Capturados.</span>
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444] w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111] border border-[#333] pl-12 pr-6 py-3 uppercase font-bold text-xs tracking-widest focus:border-[#ff2a00] outline-none transition-colors w-full sm:w-64"
            />
          </div>
          <button className="bg-white text-black px-6 py-3 uppercase font-black text-xs tracking-widest hover:bg-[#ff2a00] hover:text-white transition-colors inline-flex items-center gap-2">
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </header>

      <div className="bg-[#111] border border-[#333] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#333] bg-black">
              <th className="p-6 text-xs font-mono uppercase tracking-widest text-[#444]">Data</th>
              <th className="p-6 text-xs font-mono uppercase tracking-widest text-[#444]">Nome</th>
              <th className="p-6 text-xs font-mono uppercase tracking-widest text-[#444]">Contato</th>
              <th className="p-6 text-xs font-mono uppercase tracking-widest text-[#444]">Descrição</th>
              <th className="p-6 text-xs font-mono uppercase tracking-widest text-[#444]">Empresa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id} 
                onClick={() => setSelectedLead(lead)}
                className="hover:bg-[#151515] transition-colors group cursor-pointer"
              >
                <td className="p-6 text-xs font-mono text-[#888] whitespace-nowrap">
                  {formatDate(lead.created_at)}
                </td>
                <td className="p-6">
                  <span className="font-black uppercase tracking-tight group-hover:text-[#ff2a00] transition-colors block leading-tight">
                    {lead.nome}
                  </span>
                </td>
                <td className="p-6 space-y-1">
                  <span className="block text-sm font-mono text-[#888] group-hover:text-[#f4f4f5] transition-colors leading-none">{lead.email}</span>
                  <span className="block text-xs font-black tracking-widest text-[#ff2a00] leading-none">{lead.telefone}</span>
                </td>
                <td className="p-6 max-w-sm">
                  <p className="text-xs text-[#888] line-clamp-2 leading-relaxed italic">
                    "{lead.descricao}"
                  </p>
                </td>
                <td className="p-6">
                  <span className="inline-block bg-[#222] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#888]">
                    {lead.empresa || "N/A"}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={5} className="p-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-[#444]">
                    <Filter size={48} strokeWidth={1} />
                    <span className="font-black uppercase tracking-tighter text-2xl">Nenhum Lead Encontrado.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-default"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="relative w-full max-w-3xl bg-[#0a0a0a] border border-[#333] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="h-2 w-full bg-[#ff2a00]" />
              
              <div className="p-8 md:p-12">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="absolute top-8 right-8 text-[#555] hover:text-[#ff2a00] transition-colors"
                >
                  <X size={32} />
                </button>

                <div className="space-y-10">
                  <div>
                    <span className="text-[#ff2a00] font-mono text-xs uppercase tracking-[0.3em] font-black block mb-2">Identificador do Lead</span>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
                      {selectedLead.nome}
                    </h2>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <div className="flex items-center gap-2 bg-[#111] px-4 py-2 border border-[#333]">
                        <Calendar size={14} className="text-[#555]" />
                        <span className="text-xs font-mono text-[#888]">{formatDate(selectedLead.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#444] border-b border-[#222] block pb-1">Email Corporativo</label>
                        <div className="flex items-center justify-between group h-10">
                          <span className="text-lg font-bold group-hover:text-[#ff2a00] transition-colors">{selectedLead.email}</span>
                          <button 
                            onClick={() => copyToClipboard(selectedLead.email, "email")}
                            className="p-2 bg-[#111] border border-[#333] hover:border-[#ff2a00] transition-colors"
                          >
                            {copied === "email" ? <Check size={14} className="text-[#ff2a00]" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#444] border-b border-[#222] block pb-1">WhatsApp / Telefone</label>
                        <div className="flex items-center justify-between group h-10">
                          <span className="text-lg font-bold group-hover:text-[#ff2a00] transition-colors">{selectedLead.telefone}</span>
                          <button 
                            onClick={() => copyToClipboard(selectedLead.telefone, "phone")}
                            className="p-2 bg-[#111] border border-[#333] hover:border-[#ff2a00] transition-colors"
                          >
                            {copied === "phone" ? <Check size={14} className="text-[#ff2a00]" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#444] border-b border-[#222] block pb-1">Empresa / Instituição</label>
                        <div className="flex items-center h-10">
                          <Building2 size={16} className="text-[#ff2a00] mr-2" />
                          <span className="text-lg font-extrabold uppercase">{selectedLead.empresa || "Não Informado"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#444] border-b border-[#222] block pb-1">ID do Lead</label>
                        <span className="text-xs font-mono text-[#444] block truncate">{selectedLead.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#444] border-b border-[#222] block pb-1">Necessidade Estratégica</label>
                    <div className="bg-[#111] border border-[#333] p-6 relative">
                      <MessageSquare className="absolute top-4 right-4 text-[#222] w-12 h-12 -z-0" />
                      <p className="text-[#aaa] leading-relaxed text-sm md:text-base relative z-10 font-medium italic">
                        "{selectedLead.descricao}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="brutalist-button text-xs"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="pt-12 border-t border-[#222] flex justify-between items-center text-[#444] font-mono text-[10px] uppercase tracking-[0.2em]">
        <span>Sistema: Analytics Site-Create</span>
        <span>Hora Local: {new Date().toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}
