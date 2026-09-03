import {
  buildAdminErrorPage,
  clearAdminSessionCookie,
  hasAllowedRequestOrigin,
  securityHeaders
} from '../lib/entry-core.mjs';

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

  return new Response(null, {
    status: 303,
    headers: {
      ...securityHeaders(true),
      Location: '/admin',
      'Set-Cookie': clearAdminSessionCookie(request)
    }
  });
}
