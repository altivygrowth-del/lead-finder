export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { city, segment } = req.body;

  if (!city || !segment) {
    return res.status(400).json({ error: "city e segment são obrigatórios" });
  }

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_KEY não configurada" });
  }

  const prompt = `Você é um assistente especializado em prospecção de negócios locais no Brasil.

Faça uma pesquisa detalhada e liste EXATAMENTE 50 estabelecimentos reais de "${segment}" na cidade de "${city}", Brasil.

Para cada estabelecimento, forneça:
- name: nome do estabelecimento
- phone: telefone ou WhatsApp (formato brasileiro, ex: (41) 99999-9999)
- site: URL completa do site (com https://) ou null se não tiver
- address: endereço completo

Responda APENAS com um array JSON válido, sem texto antes ou depois, sem markdown, sem explicações.
Exemplo do formato:
[
  {
    "name": "Nome do Estabelecimento",
    "phone": "(41) 3333-4444",
    "site": "https://www.exemplo.com.br",
    "address": "Rua Exemplo, 123 - Centro"
  }
]

IMPORTANTE: Use a ferramenta web_search para buscar informações reais e atualizadas. Liste 50 estabelecimentos diferentes.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Erro na API Anthropic" });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
