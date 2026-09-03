import { jsonResponse, normalizeEntry } from '../lib/entry-core.mjs';
import { saveEntry } from '../lib/supabase-entries.mjs';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const contentLength = Number(request.headers.get('content-length')) || 0;
    const requestOrigin = request.headers.get('origin');
    const expectedOrigin = new URL(request.url).origin;

    if (requestOrigin && requestOrigin !== expectedOrigin) {
      return jsonResponse({ error: 'Origem não autorizada.' }, 403);
    }

    if (!contentType.startsWith('application/json')) {
      return jsonResponse({ error: 'Envie os dados em formato JSON.' }, 415);
    }

    if (contentLength > 4096) {
      return jsonResponse({ error: 'Dados enviados excedem o limite permitido.' }, 413);
    }

    const entry = normalizeEntry(await request.json());
    await saveEntry(entry);
    return jsonResponse({ saved: true }, 201);
  } catch (error) {
    if (!error.status) console.error(error);
    return jsonResponse({
      error: error.status ? error.message : 'Erro interno do servidor.'
    }, error.status || 500);
  }
}
