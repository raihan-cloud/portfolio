require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL atau SUPABASE_ANON_KEY belum diatur.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

function sendJson(res, statusCode, payload) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(JSON.stringify(payload));
}

function parseId(req) {
  const raw = req.query && req.query.id;
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

function normalizeMessageRow(row) {
  return {
    id: row.id,
    _id: row.id,
    name: row.name || '',
    email: row.email || '',
    subject: row.subject || '',
    message: row.message || '',
    createdAt: row.created_at
  };
}

async function handleGet(req, res, supabase) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, {
    messages: (data || []).map(normalizeMessageRow)
  });
}

async function handleDelete(req, res, supabase) {
  const messageId = parseId(req);
  if (!messageId) {
    return sendJson(res, 400, { error: 'Query parameter "id" wajib diisi.' });
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, { message: 'Pesan berhasil dihapus.' });
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(200).end();
  }

  let supabase;
  try {
    supabase = createSupabaseClient();
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }

  try {
    if (req.method === 'GET') return await handleGet(req, res, supabase);
    if (req.method === 'DELETE') return await handleDelete(req, res, supabase);

    return sendJson(res, 405, { error: `Method ${req.method} tidak diizinkan.` });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Terjadi kesalahan server.' });
  }
};
