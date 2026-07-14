require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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

function normalizeProjectRow(row) {
  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    category: row.category,
    description: row.description || '',
    github: row.github || '',
    demo: row.demo || '',
    liveDemo: row.demo || '',
    status: row.status || 'draft',
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    image: row.image || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function sanitizeTechStack(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildPayload(body) {
  const title = String(body.title || '').trim();
  const category = String(body.category || '').trim();

  if (!title || !category) {
    return { error: 'Field "title" dan "category" wajib diisi.' };
  }

  const status = String(body.status || 'draft').trim().toLowerCase();
  const normalizedStatus = status === 'published' ? 'published' : 'draft';

  return {
    data: {
      title,
      category,
      description: String(body.description || '').trim(),
      github: String(body.github || '').trim(),
      demo: String(body.demo || body.liveDemo || '').trim(),
      status: normalizedStatus,
      tech_stack: sanitizeTechStack(body.techStack),
      image: String(body.image || '').trim()
    }
  };
}

async function handleGet(req, res, supabase) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, {
    projects: (data || []).map(normalizeProjectRow)
  });
}

async function handlePost(req, res, supabase) {
  const payload = buildPayload(req.body || {});
  if (payload.error) {
    return sendJson(res, 400, { error: payload.error });
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(payload.data)
    .select('*')
    .single();

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 201, {
    message: 'Project berhasil dibuat.',
    project: normalizeProjectRow(data)
  });
}

async function handlePut(req, res, supabase) {
  const projectId = parseId(req);
  if (!projectId) {
    return sendJson(res, 400, { error: 'Query parameter "id" wajib diisi.' });
  }

  const payload = buildPayload(req.body || {});
  if (payload.error) {
    return sendJson(res, 400, { error: payload.error });
  }

  const updatePayload = {
    ...payload.data,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', projectId)
    .select('*')
    .single();

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, {
    message: 'Project berhasil diperbarui.',
    project: normalizeProjectRow(data)
  });
}

async function handleDelete(req, res, supabase) {
  const projectId = parseId(req);
  if (!projectId) {
    return sendJson(res, 400, { error: 'Query parameter "id" wajib diisi.' });
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, { message: 'Project berhasil dihapus.' });
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
    if (req.method === 'POST') return await handlePost(req, res, supabase);
    if (req.method === 'PUT') return await handlePut(req, res, supabase);
    if (req.method === 'DELETE') return await handleDelete(req, res, supabase);

    return sendJson(res, 405, { error: `Method ${req.method} tidak diizinkan.` });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Terjadi kesalahan server.' });
  }
};
