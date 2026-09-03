import { createClient } from '@supabase/supabase-js';

function configuredClient() {
  const url = process.env.SUPABASE_URL || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || '';

  if (!url || !secretKey) {
    const error = new Error('Banco de dados ainda não configurado.');
    error.status = 503;
    throw error;
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export async function saveEntry(entry) {
  const supabase = configuredClient();
  const { error } = await supabase
    .from('entradas')
    .insert({ nome: entry.name, filial: entry.branch });

  if (error) {
    console.error('Falha ao inserir entrada:', error.code);
    const databaseError = new Error('Não foi possível registrar a identificação.');
    databaseError.status = 502;
    throw databaseError;
  }
}

export async function readEntries() {
  const supabase = configuredClient();
  const entries = [];
  const pageSize = 1000;
  let start = 0;

  while (true) {
    const { data, error } = await supabase
      .from('entradas')
      .select('criado_em,nome,filial')
      .order('criado_em', { ascending: false })
      .range(start, start + pageSize - 1);

    if (error) {
      console.error('Falha ao consultar entradas:', error.code);
      const databaseError = new Error('Não foi possível consultar os registros.');
      databaseError.status = 502;
      throw databaseError;
    }

    entries.push(...data.map(entry => ({
      recordedAt: entry.criado_em,
      name: entry.nome,
      branch: entry.filial
    })));

    if (data.length < pageSize) break;
    start += pageSize;
  }

  return entries;
}
