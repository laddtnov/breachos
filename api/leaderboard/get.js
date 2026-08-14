import { supabasePublic } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabasePublic.rpc('get_leaderboard');

  if (error) {
    console.error('[LEADERBOARD] RPC error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }

  // Cache response for 60 s at the CDN edge
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  return res.status(200).json({ leaderboard: data || [] });
}
