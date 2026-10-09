const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (supabaseUrl) {
  // Hapus trailing slash atau /rest/v1 jika terbawa
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ [Peringatan]: SUPABASE_URL atau SUPABASE_ANON_KEY belum diatur di file .env / Environment Variables Vercel.'
  );
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

module.exports = supabase;
