export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Senha obrigatória" });
  }

  const validPasswords = process.env.VALID_PASSWORDS
    ? process.env.VALID_PASSWORDS.split(",").map((p) => p.trim())
    : [];

  if (validPasswords.length === 0) {
    return res.status(500).json({ error: "Nenhuma senha configurada" });
  }

  if (!validPasswords.includes(password)) {
    return res.status(401).json({ error: "Senha incorreta" });
  }

  // Cookie válido por 30 dias
  res.setHeader(
    "Set-Cookie",
    `lf_session=${password}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`
  );

  return res.status(200).json({ ok: true });
}
