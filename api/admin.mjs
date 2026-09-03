import {
  adminChallenge,
  buildAdminPage,
  isAdmin,
  securityHeaders
} from '../lib/entry-core.mjs';
import { readEntries } from '../lib/supabase-entries.mjs';

export async function GET(request) {
  if (!isAdmin(request)) return adminChallenge();

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
    return new Response('Não foi possível abrir os registros.', {
      status: error.status || 500,
      headers: {
        ...securityHeaders(true),
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
}
