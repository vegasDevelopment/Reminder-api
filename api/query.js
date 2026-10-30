import { valkey } from '../lib/valkey.js';

const KEY = 'reminders';

function gunFarki(a, b) {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((A - B) / 86400000);
}

export default async function handler(req, res) {
  if (req.headers['x-api-key'] !== process.env.API_KEY)
    return res.status(401).json({ error: 'unauthorized' });

  if (req.method !== 'GET')
    return res.status(405).json({ error: 'method not allowed' });

  const rawData = (await valkey.hgetall(KEY)) || {};
  
  const all = Object.values(rawData)
    .map((v) => (typeof v === 'string' ? JSON.parse(v) : v))
    .filter((r) => r.status === 'active')
    .map((r) => {
      const daysLeft = gunFarki(new Date(r.eventDate), new Date());
      return { ...r, daysLeft, isDueToday: r.remindDaysBefore.includes(daysLeft) };
    })
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return res.json(req.query.due === 'true' ? all.filter((r) => r.isDueToday) : all);
}
