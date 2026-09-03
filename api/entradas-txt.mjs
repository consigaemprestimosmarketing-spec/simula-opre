import {
  adminChallenge,
  buildEntriesTxt,
  isAdmin,
  securityHeaders
} from '../lib/entry-core.mjs';
import { readEntries } from '../lib/supabase-entries.mjs';

export async function GET(request) {
  if (!isAdmin(request)) return adminChallenge();

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
    return new Response('Não foi possível gerar o arquivo.', {
      status: error.status || 500,
      headers: {
        ...securityHeaders(true),
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
}
