import assert from 'node:assert/strict';

process.env.ADMIN_USER = 'gestao';
process.env.ADMIN_PASSWORD = 'senha-de-teste-com-24-chars';

const core = await import('../lib/entry-core.mjs');
const login = await import('../api/admin-login.mjs');
const logout = await import('../api/admin-logout.mjs');
const admin = await import('../api/admin.mjs');

assert.equal(core.adminCredentialsConfigured(), true);
assert.equal(core.validAdminCredentials('gestao', 'senha-de-teste-com-24-chars'), true);
assert.equal(core.validAdminCredentials('gestao', 'senha-incorreta'), false);

const request = new Request('https://simulador.example/admin');
const sessionCookie = core.createAdminSessionCookie(request);
assert.match(sessionCookie, /HttpOnly/);
assert.match(sessionCookie, /SameSite=Strict/);
assert.match(sessionCookie, /Secure/);

const cookiePair = sessionCookie.split(';')[0];
const authenticatedRequest = new Request('https://simulador.example/admin', {
  headers: { cookie: cookiePair }
});
assert.equal(core.isAdmin(authenticatedRequest), true);

const tamperedRequest = new Request('https://simulador.example/admin', {
  headers: { cookie: cookiePair + 'x' }
});
assert.equal(core.isAdmin(tamperedRequest), false);

const loginRequest = new Request('https://simulador.example/api/admin-login', {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    origin: 'https://simulador.example'
  },
  body: new URLSearchParams({
    user: 'gestao',
    password: 'senha-de-teste-com-24-chars'
  })
});
const loginResponse = await login.POST(loginRequest);
assert.equal(loginResponse.status, 303);
assert.equal(loginResponse.headers.get('location'), '/admin');
assert.match(loginResponse.headers.get('set-cookie'), /consiga_admin_session=/);

const deniedRequest = new Request('https://simulador.example/api/admin-login', {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    origin: 'https://simulador.example'
  },
  body: new URLSearchParams({ user: 'gestao', password: 'errada' })
});
const deniedResponse = await login.POST(deniedRequest);
assert.equal(deniedResponse.status, 303);
assert.equal(deniedResponse.headers.get('location'), '/admin?erro=credenciais');

const foreignRequest = new Request('https://simulador.example/api/admin-login', {
  method: 'POST',
  headers: { origin: 'https://outro.example' }
});
const foreignResponse = await login.POST(foreignRequest);
assert.equal(foreignResponse.status, 403);
assert.match(await foreignResponse.text(), /origem desta solicitação/);

const anonymousResponse = await admin.GET(
  new Request('https://simulador.example/admin?erro=sessao')
);
assert.equal(anonymousResponse.status, 200);
const loginPage = await anonymousResponse.text();
assert.match(loginPage, /Entrar no painel/);
assert.match(loginPage, /Sua sessão terminou/);
assert.match(loginPage, /href='\/' aria-label='Voltar ao simulador'/);
assert.doesNotMatch(loginPage, /senha-de-teste/);

const logoutResponse = await logout.POST(new Request(
  'https://simulador.example/api/admin-logout',
  { method: 'POST', headers: { origin: 'https://simulador.example' } }
));
assert.equal(logoutResponse.status, 303);
assert.match(logoutResponse.headers.get('set-cookie'), /Max-Age=0/);

const escapedError = core.buildAdminErrorPage('<script>erro</script>');
assert.doesNotMatch(escapedError, /<script>erro/);
assert.match(escapedError, /&lt;script&gt;erro&lt;\/script&gt;/);
assert.match(escapedError, /logo-principal\.png/);

console.log('Autenticação administrativa validada.');
