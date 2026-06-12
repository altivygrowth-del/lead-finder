import React, { useState } from "react";

const STEPS = { INPUT: "input", SEARCHING: "searching", RESULTS: "results" };

function generateMessage(biz, segment, city) {
  if (biz.site && biz.site !== "Não encontrado") {
    return `Olá, ${biz.name}! Visitei o site de vocês (${biz.site}) e fiquei impressionado com o trabalho. Sou especialista em [seu serviço] e acredito que posso ajudar ${biz.name} a crescer ainda mais em ${city}. Posso apresentar uma proposta rápida? 🚀`;
  }
  return `Olá, ${biz.name}! Encontrei o contato de vocês buscando ${segment} em ${city} e gostaria de apresentar uma solução que pode ajudar muito o negócio de vocês. Tenho trabalhado com empresas do setor e os resultados têm sido excelentes. Podemos conversar rapidamente? 😊`;
}

function parseLeads(text, city, segment) {
  try {
    const jsonMatch =
      text.match(/```json\s*([\s\S]*?)\s*```/) ||
      text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    let raw = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    raw = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((item, i) => ({
          id: i + 1,
          name: item.name || item.nome || "—",
          phone: item.phone || item.telefone || item.whatsapp || "Não encontrado",
          site: item.site || item.website || item.url || "Não encontrado",
          hasSite:
            !!(item.site || item.website || item.url) &&
            (item.site || item.website || item.url) !== "Não encontrado" &&
            (item.site || item.website || item.url) !== null,
          address: item.address || item.endereco || item.endereço || "",
          message: generateMessage(
            { name: item.name || item.nome, site: item.site || item.website || item.url },
            segment,
            city
          ),
        }))
      : [];
  } catch {
    return [];
  }
}

export default function LeadFinder() {
  const [step, setStep] = useState(STEPS.INPUT);
  const [city, setCity] = useState("");
  const [segment, setSegment] = useState("");
  const [leads, setLeads] = useState([]);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);

  async function handleSearch() {
    if (!city.trim() || !segment.trim()) return;
    setStep(STEPS.SEARCHING);
    setError("");
    setProgress("🔍 Iniciando busca com IA...");

    try {
      setProgress("🌐 Pesquisando na web...");

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, segment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na API");
      }

      setProgress("📊 Processando resultados...");

      const textContent = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const parsed = parseLeads(textContent, city, segment);

      if (parsed.length === 0) {
        setError("Não foi possível estruturar os resultados. Tente novamente.");
        setStep(STEPS.INPUT);
        return;
      }

      setLeads(parsed);
      setStep(STEPS.RESULTS);
    } catch (e) {
      setError("Erro: " + e.message);
      setStep(STEPS.INPUT);
    }
  }

  function exportCSV() {
    const headers = ["#", "Nome", "Telefone", "Tem Site", "URL do Site", "Endereço", "Mensagem Pronta"];
    const rows = leads.map((l) => [
      l.id,
      `"${l.name}"`,
      `"${l.phone}"`,
      l.hasSite ? "Sim" : "Não",
      `"${l.hasSite ? l.site : ""}"`,
      `"${l.address}"`,
      `"${l.message.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${segment}_${city}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyMessage(id, msg) {
    navigator.clipboard.writeText(msg);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const s = {
    bg: "#0f172a",
    card: "#1e293b",
    border: "#334155",
    text: "#f1f5f9",
    muted: "#64748b",
    blue: "#3b82f6",
    green: "#10b981",
    yellow: "#f59e0b",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${s.bg} 0%, ${s.card} 50%, ${s.bg} 100%)`,
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: s.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1e40af30",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "#0f172acc",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          📍
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Lead Finder</div>
          <div style={{ fontSize: 11, color: s.muted }}>Prospecção inteligente com IA</div>
        </div>
        {step === STEPS.RESULTS && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span
              style={{
                background: "#1e40af20",
                border: "1px solid #3b82f640",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 12,
                color: "#93c5fd",
              }}
            >
              {leads.length} leads
            </span>
            <button
              onClick={() => { setStep(STEPS.INPUT); setLeads([]); }}
              style={{
                background: "transparent",
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 12,
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              ← Nova busca
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {/* INPUT */}
        {step === STEPS.INPUT && (
          <div style={{ maxWidth: 520, margin: "40px auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #60a5fa, #818cf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 8,
                }}
              >
                Encontre seus próximos clientes
              </h1>
              <p style={{ color: s.muted, fontSize: 14 }}>
                Digite a cidade e o segmento. A IA busca 50 leads reais com contatos e já prepara a mensagem.
              </p>
            </div>

            <div
              style={{
                background: s.card,
                border: `1px solid ${s.border}`,
                borderRadius: 16,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  🏙 Cidade
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Curitiba, São Paulo, Guaratuba..."
                  onKeyDown={(e) => e.key === "Enter" && segment && handleSearch()}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontSize: 15,
                    color: s.text,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  🏢 Segmento / Nicho
                </label>
                <input
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  placeholder="Ex: Clínicas odontológicas, Academias, Restaurantes..."
                  onKeyDown={(e) => e.key === "Enter" && city && handleSearch()}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontSize: 15,
                    color: s.text,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>Exemplos rápidos:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "Clínicas odontológicas",
                    "Academias de ginástica",
                    "Pet shops",
                    "Salões de beleza",
                    "Restaurantes",
                    "Lojas de roupa",
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSegment(tag)}
                      style={{
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        borderRadius: 20,
                        padding: "4px 10px",
                        fontSize: 11,
                        color: s.muted,
                        cursor: "pointer",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: "#7f1d1d20",
                    border: "1px solid #ef444440",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#fca5a5",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={!city.trim() || !segment.trim()}
                style={{
                  width: "100%",
                  background:
                    city && segment ? "linear-gradient(135deg, #3b82f6, #6366f1)" : s.card,
                  border: "none",
                  borderRadius: 10,
                  padding: "14px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: city && segment ? "#fff" : "#475569",
                  cursor: city && segment ? "pointer" : "not-allowed",
                }}
              >
                {city && segment ? `🚀 Buscar ${segment} em ${city}` : "Preencha os campos acima"}
              </button>
            </div>
          </div>
        )}

        {/* SEARCHING */}
        {step === STEPS.SEARCHING && (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 24 }}>🔍</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Buscando {segment} em {city}
            </h2>
            <p style={{ color: s.muted, fontSize: 14, marginBottom: 32 }}>{progress}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: s.blue,
                    animation: `bounce 1s ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1.2);opacity:1} }`}</style>
          </div>
        )}

        {/* RESULTS */}
        {step === STEPS.RESULTS && (
          <div>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 20,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: s.card,
                  border: `1px solid ${s.border}`,
                  borderRadius: 10,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <span>✅</span>
                <span style={{ color: "#94a3b8" }}>Com site:</span>
                <strong style={{ color: s.green }}>{leads.filter((l) => l.hasSite).length}</strong>
              </div>
              <div
                style={{
                  background: s.card,
                  border: `1px solid ${s.border}`,
                  borderRadius: 10,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <span>❌</span>
                <span style={{ color: "#94a3b8" }}>Sem site:</span>
                <strong style={{ color: s.yellow }}>{leads.filter((l) => !l.hasSite).length}</strong>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <button
                  onClick={exportCSV}
                  style={{
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  📊 Exportar para Excel/Sheets
                </button>
              </div>
            </div>

            <div
              style={{
                background: "#1e3a5f20",
                border: "1px solid #1e40af40",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 12,
                color: "#93c5fd",
                marginBottom: 16,
              }}
            >
              💡 Clique em qualquer lead para ver a mensagem pronta.
            </div>

            <div
              style={{
                background: s.card,
                border: `1px solid ${s.border}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: s.bg, borderBottom: `1px solid ${s.border}` }}>
                    {["#", "Nome", "Telefone", "Site", "Link", "Mensagem"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 14px",
                          textAlign: "left",
                          fontSize: 11,
                          color: s.muted,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, idx) => (
                    <React.Fragment key={lead.id}>
                      <tr
                        onClick={() => setSelected(selected === lead.id ? null : lead.id)}
                        style={{
                          borderBottom: `1px solid ${s.bg}`,
                          background:
                            selected === lead.id
                              ? "#1e40af15"
                              : idx % 2 === 0
                              ? s.card
                              : "#192030",
                          cursor: "pointer",
                        }}
                      >
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#475569", fontWeight: 700 }}>
                          {lead.id}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                          {lead.name}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace" }}>
                          {lead.phone !== "Não encontrado" ? (
                            <a
                              href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: s.green, textDecoration: "none" }}
                            >
                              {lead.phone}
                            </a>
                          ) : (
                            <span style={{ color: "#475569" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              background: lead.hasSite ? "#10b98120" : "#37415120",
                              border: `1px solid ${lead.hasSite ? "#10b98140" : "#37415140"}`,
                              borderRadius: 20,
                              padding: "2px 10px",
                              fontSize: 11,
                              color: lead.hasSite ? s.green : s.muted,
                              fontWeight: 600,
                            }}
                          >
                            {lead.hasSite ? "✓ Sim" : "✗ Não"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {lead.hasSite ? (
                            <a
                              href={lead.site}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                color: "#60a5fa",
                                fontSize: 11,
                                textDecoration: "none",
                                maxWidth: 140,
                                display: "inline-block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                verticalAlign: "middle",
                              }}
                            >
                              {lead.site.replace(/^https?:\/\/(www\.)?/, "")}
                            </a>
                          ) : (
                            <span style={{ color: "#374151", fontSize: 11 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyMessage(lead.id, lead.message); }}
                            style={{
                              background: copied === lead.id ? "#10b98120" : "#3b82f620",
                              border: `1px solid ${copied === lead.id ? "#10b98140" : "#3b82f640"}`,
                              borderRadius: 6,
                              padding: "4px 10px",
                              fontSize: 11,
                              color: copied === lead.id ? s.green : "#60a5fa",
                              cursor: "pointer",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {copied === lead.id ? "✓ Copiado!" : "📋 Copiar"}
                          </button>
                        </td>
                      </tr>
                      {selected === lead.id && (
                        <tr style={{ background: "#1e40af10" }}>
                          <td colSpan={6} style={{ padding: "0 14px 14px 14px" }}>
                            <div
                              style={{
                                background: s.bg,
                                border: "1px solid #1e40af40",
                                borderRadius: 8,
                                padding: "12px 16px",
                                fontSize: 13,
                                color: "#cbd5e1",
                                lineHeight: 1.6,
                                display: "flex",
                                gap: 12,
                                alignItems: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: 18 }}>💬</span>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: "#475569",
                                    fontWeight: 700,
                                    marginBottom: 6,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  Mensagem pronta
                                </div>
                                {lead.message}
                              </div>
                              <button
                                onClick={() => copyMessage(lead.id, lead.message)}
                                style={{
                                  background: copied === lead.id ? "#10b98120" : "#3b82f620",
                                  border: `1px solid ${copied === lead.id ? "#10b98140" : "#3b82f640"}`,
                                  borderRadius: 6,
                                  padding: "6px 12px",
                                  fontSize: 12,
                                  color: copied === lead.id ? s.green : "#60a5fa",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  fontWeight: 600,
                                }}
                              >
                                {copied === lead.id ? "✓ Copiado!" : "Copiar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
