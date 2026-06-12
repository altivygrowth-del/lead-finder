import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api/login|_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(request) {
  const session = request.cookies.get("lf_session");
  const validCookies = process.env.VALID_PASSWORDS
    ? process.env.VALID_PASSWORDS.split(",").map((p) => p.trim())
    : [];

  // Se tem cookie válido, deixa passar
  if (session && validCookies.includes(session.value)) {
    return NextResponse.next();
  }

  // Senão, mostra tela de login
  const loginHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Lead Finder – Acesso</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f1f5f9;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.4);
    }
    .logo {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
      margin-bottom: 20px;
    }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
    p { color: #64748b; font-size: 14px; margin-bottom: 28px; }
    label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
    input[type="password"] {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 13px 16px;
      font-size: 15px;
      color: #f1f5f9;
      outline: none;
      margin-bottom: 14px;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus { border-color: #3b82f6; }
    button {
      width: 100%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .error {
      background: #7f1d1d30;
      border: 1px solid #ef444440;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #fca5a5;
      margin-top: 12px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">📍</div>
    <h1>Lead Finder</h1>
    <p>Prospecção inteligente com IA</p>
    <form id="form">
      <label>Senha de acesso</label>
      <input type="password" id="pwd" placeholder="Digite sua senha" autofocus autocomplete="current-password" />
      <button type="submit" id="btn">Entrar →</button>
      <div class="error" id="err">Senha incorreta. Verifique e tente novamente.</div>
    </form>
  </div>
  <script>
    document.getElementById('form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = document.getElementById('btn');
      const err = document.getElementById('err');
      const pwd = document.getElementById('pwd').value;
      btn.disabled = true;
      btn.textContent = 'Verificando...';
      err.style.display = 'none';
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        if (res.ok) {
          window.location.href = '/';
        } else {
          err.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Entrar →';
        }
      } catch(e) {
        err.textContent = 'Erro de conexão. Tente novamente.';
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Entrar →';
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(loginHTML, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
