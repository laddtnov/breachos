import { supabasePublic } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabasePublic.rpc('get_daily_leaderboard', { today });

  if (error) {
    console.error('[DAILY LB] RPC error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch daily leaderboard' });
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  return res.status(200).json({ leaderboard: data || [], date: today });
}
