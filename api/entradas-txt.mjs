import {
  buildAdminErrorPage,
  buildEntriesTxt,
  isAdmin,
  securityHeaders
} from '../lib/entry-core.mjs';
import { readEntries } from '../lib/supabase-entries.mjs';

export async function GET(request) {
  if (!isAdmin(request)) {
    return new Response(null, {
      status: 303,
      headers: {
        ...securityHeaders(true),
        Location: '/admin?erro=sessao'
      }
    });
  }

  try {
    const entries = await readEntries();
    return new Response('\ufeff' + buildEntriesTxt(entries), {
      status: 200,
      headers: {
        ...securityHeaders(true),
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename=entradas-consiga.txt'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(buildAdminErrorPage(
      'O arquivo não pôde ser gerado agora. Tente novamente em instantes.'
    ), {
      status: error.status || 500,
      headers: {
        ...securityHeaders(true),
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
}
