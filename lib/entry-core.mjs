import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

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

const sessionCookieName = 'consiga_admin_session';
const sessionDurationSeconds = 8 * 60 * 60;

function adminConfiguration() {
  return {
    user: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || ''
  };
}

function safeEqual(received, expected) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signingKey() {
  const { password } = adminConfiguration();
  return createHash('sha256')
    .update(`consiga-admin-session:${password}`)
    .digest();
}

function sessionSignature(payload) {
  return createHmac('sha256', signingKey())
    .update(payload)
    .digest('base64url');
}

function cookieValue(request) {
  const cookies = request.headers.get('cookie') || '';
  const item = cookies.split(';').map(value => value.trim()).find(value => {
    return value.startsWith(sessionCookieName + '=');
  });
  return item ? item.slice(sessionCookieName.length + 1) : '';
}

export function adminCredentialsConfigured() {
  return adminConfiguration().password.length >= 12;
}

export function validAdminCredentials(user, password) {
  const expected = adminConfiguration();
  return adminCredentialsConfigured()
    && safeEqual(String(user || ''), expected.user)
    && safeEqual(String(password || ''), expected.password);
}

export function isAdmin(request) {
  if (!adminCredentialsConfigured()) return false;
  const [payload, signature] = cookieValue(request).split('.');
  if (!payload || !signature || !safeEqual(sessionSignature(payload), signature)) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.user === adminConfiguration().user
      && Number(session.expiresAt) > Date.now();
  } catch {
    return false;
  }
}

export function createAdminSessionCookie(request) {
  const payload = Buffer.from(JSON.stringify({
    user: adminConfiguration().user,
    expiresAt: Date.now() + sessionDurationSeconds * 1000
  })).toString('base64url');
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${sessionCookieName}=${payload}.${sessionSignature(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionDurationSeconds}${secure}`;
}

export function clearAdminSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
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
      ? `default-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`
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
  <link rel='preconnect' href='https://fonts.googleapis.com'>
  <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>
  <link href='https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap' rel='stylesheet'>
  <link rel='stylesheet' href='/admin.css'>
</head>
<body>
  <main class='admin-shell'>
    <header class='admin-bar'>
      <img src='/assets/logo-secundaria.png' alt='Consiga Empréstimos'>
      <form method='post' action='/api/admin-logout'>
        <button type='submit'>Sair do painel</button>
      </form>
    </header>
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

export function buildAdminLoginPage(errorCode = '') {
  const messages = {
    credenciais: 'Usuário ou senha não conferem.',
    configuracao: 'A autenticação administrativa ainda não foi configurada.',
    sessao: 'Sua sessão terminou. Entre novamente para continuar.'
  };
  const message = messages[errorCode] || '';
  const error = message
    ? `<div class='admin-alert' role='alert'><strong>Não foi possível entrar</strong><span>${message}</span></div>`
    : '';

  return `<!doctype html>
<html lang='pt-BR'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <meta name='robots' content='noindex,nofollow,noarchive'>
  <title>Entrar no painel | Consiga</title>
  <link rel='preconnect' href='https://fonts.googleapis.com'>
  <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>
  <link href='https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap' rel='stylesheet'>
  <link rel='stylesheet' href='/admin.css'>
</head>
<body class='admin-login-body'>
  <main class='admin-login'>
    <section class='admin-login-brand'>
      <img src='/assets/logo-secundaria.png' alt='Consiga Empréstimos'>
      <div>
        <p>Premiação comercial</p>
        <h1>Registros da semana</h1>
        <span>Área exclusiva para administração das entradas.</span>
      </div>
    </section>
    <section class='admin-login-panel' aria-labelledby='login-title'>
      <header>
        <p>Acesso protegido</p>
        <h2 id='login-title'>Entrar no painel</h2>
        <span>Use as credenciais configuradas na Vercel.</span>
      </header>
      ${error}
      <form method='post' action='/api/admin-login'>
        <label for='admin-user'>Usuário</label>
        <input id='admin-user' name='user' type='text' autocomplete='username' maxlength='80' required>
        <label for='admin-password'>Senha</label>
        <input id='admin-password' name='password' type='password' autocomplete='current-password' maxlength='200' required>
        <button type='submit'>Entrar no painel</button>
      </form>
      <small>A sessão expira automaticamente após 8 horas.</small>
    </section>
  </main>
</body>
</html>`;
}

export function buildAdminErrorPage(message) {
  return `<!doctype html>
<html lang='pt-BR'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <meta name='robots' content='noindex,nofollow,noarchive'>
  <title>Erro no painel | Consiga</title>
  <link rel='preconnect' href='https://fonts.googleapis.com'>
  <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>
  <link href='https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap' rel='stylesheet'>
  <link rel='stylesheet' href='/admin.css'>
</head>
<body class='admin-error-body'>
  <main class='admin-error'>
    <img src='/assets/logo-secundaria.png' alt='Consiga Empréstimos'>
    <p>Algo saiu do placar</p>
    <h1>Não foi possível carregar os registros.</h1>
    <span>${escapeHtml(message)}</span>
    <a href='/admin'>Tentar abrir novamente</a>
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
