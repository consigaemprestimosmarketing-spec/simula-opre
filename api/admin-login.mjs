import {
  adminCredentialsConfigured,
  buildAdminErrorPage,
  createAdminSessionCookie,
  hasAllowedRequestOrigin,
  securityHeaders,
  validAdminCredentials
} from '../lib/entry-core.mjs';

function redirect(location, sessionCookie) {
  return new Response(null, {
    status: 303,
    headers: {
      ...securityHeaders(true),
      Location: location,
      ...(sessionCookie ? { 'Set-Cookie': sessionCookie } : {})
    }
  });
}

export async function POST(request) {
  if (!hasAllowedRequestOrigin(request)) {
    return new Response(buildAdminErrorPage('A origem desta solicitação não é permitida.'), {
      status: 403,
      headers: {
        ...securityHeaders(true),
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  if (!adminCredentialsConfigured()) {
    return redirect('/admin?erro=configuracao');
  }

  try {
    const form = await request.formData();
    const user = form.get('user');
    const password = form.get('password');

    if (!validAdminCredentials(user, password)) {
      return redirect('/admin?erro=credenciais');
    }

    return redirect('/admin', createAdminSessionCookie(request));
  } catch {
    return redirect('/admin?erro=credenciais');
  }
}
