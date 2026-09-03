import {
  buildAdminErrorPage,
  buildAdminLoginPage,
  buildAdminPage,
  isAdmin,
  securityHeaders
} from '../lib/entry-core.mjs';
import { readEntries } from '../lib/supabase-entries.mjs';

export async function GET(request) {
  if (!isAdmin(request)) {
    const errorCode = new URL(request.url).searchParams.get('erro') || '';
    return new Response(buildAdminLoginPage(errorCode), {
      status: 200,
      headers: {
        ...securityHeaders(true),
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  try {
    const entries = await readEntries();
    return new Response(buildAdminPage(entries), {
      status: 200,
      headers: {
        ...securityHeaders(true),
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(buildAdminErrorPage(
      'Verifique a conexão com o Supabase e tente novamente.'
    ), {
      status: error.status || 500,
      headers: {
        ...securityHeaders(true),
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
}
