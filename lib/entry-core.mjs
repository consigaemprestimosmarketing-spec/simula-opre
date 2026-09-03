import { timingSafeEqual } from 'node:crypto';

export const allowedBranches = new Set([
  'Vitória',
  'Campo Grande — Cariacica',
  'Laranjeiras 1 — Serra',
  'Laranjeiras 2 — Serra',
  'Muquiçaba — Guarapari',
  'Cachoeiro de Itapemirim',
  'Marataízes',
  'Linhares',
  'Aracruz',
  'Colatina',
  'São Mateus',
  'Porto Seguro',
  'Teixeira de Freitas',
  'Vitória da Conquista',
  'Eunápolis',
  'Itabuna',
  'Jequié',
  'Campos dos Goytacazes'
]);

function safeEqual(received, expected) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdmin(request) {
  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';
  const authorization = request.headers.get('authorization') || '';

  if (expectedPassword.length < 12 || !authorization.startsWith('Basic ')) {
    return false;
  }

  try {
    const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 0) return false;
    return safeEqual(decoded.slice(0, separator), expectedUser)
      && safeEqual(decoded.slice(separator + 1), expectedPassword);
  } catch {
    return false;
  }
}

export function normalizeEntry(payload) {
  const name = typeof payload?.name === 'string'
    ? payload.name.trim().replace(/\s+/g, ' ')
    : '';
  const branch = typeof payload?.branch === 'string' ? payload.branch : '';

  if (name.length < 2 || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) {
    const error = new Error('Informe um nome entre 2 e 60 caracteres.');
    error.status = 422;
    throw error;
  }

  if (!allowedBranches.has(branch)) {
    const error = new Error('Selecione uma filial válida.');
    error.status = 422;
    throw error;
  }

  return { name, branch };
}

export function securityHeaders(admin = false) {
  return {
    'Cache-Control': 'no-store',
    'Content-Security-Policy': admin
      ? `default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'`
      : `default-src 'none'; base-uri 'none'; frame-ancestors 'none'`,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...(admin ? { 'X-Robots-Tag': 'noindex, nofollow, noarchive' } : {})
  };
}

export function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: securityHeaders(false)
  });
}

export function adminChallenge() {
  const quote = String.fromCharCode(34);
  return new Response('Acesso restrito ao administrador.', {
    status: 401,
    headers: {
      ...securityHeaders(true),
      'Content-Type': 'text/plain; charset=utf-8',
      'WWW-Authenticate': 'Basic realm=' + quote + 'Consiga Admin' + quote + ', charset=' + quote + 'UTF-8' + quote
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function displayDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: process.env.APP_TIMEZONE || 'America/Sao_Paulo'
  }).format(date);
}

export function buildAdminPage(entries) {
  const rows = entries.length
    ? entries.map(entry => `<tr><td>${escapeHtml(displayDate(entry.recordedAt))}</td><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(entry.branch)}</td></tr>`).join('')
    : `<tr><td colspan='3'>Nenhuma entrada registrada.</td></tr>`;

  return `<!doctype html>
<html lang='pt-BR'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <meta name='robots' content='noindex,nofollow,noarchive'>
  <title>Entradas | Consiga</title>
  <link rel='stylesheet' href='/admin.css'>
</head>
<body>
  <main class='admin-shell'>
    <header class='admin-head'>
      <div>
        <p>Área restrita</p>
        <h1>Entradas registradas</h1>
        <span>${entries.length} registro${entries.length === 1 ? '' : 's'}</span>
      </div>
      <a href='/admin/entradas.txt'>Baixar arquivo TXT</a>
    </header>
    <div class='admin-table'>
      <table>
        <thead><tr><th>Registrado em</th><th>Nome</th><th>Filial</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </main>
</body>
</html>`;
}

export function buildEntriesTxt(entries) {
  const rows = entries.map(entry => {
    return `${displayDate(entry.recordedAt)}\t${entry.name}\t${entry.branch}`;
  });
  return ['Registrado em\tNome\tFilial', ...rows].join('\n') + '\n';
}
