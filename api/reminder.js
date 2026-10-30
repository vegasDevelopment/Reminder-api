import { valkey } from '../lib/valkey.js';

const KEY = 'reminders';
const AYLAR = ['ocak','şubat','mart','nisan','mayıs','haziran','temmuz','ağustos','eylül','ekim','kasım','aralık'];

function parseTR(input) {
  const s = String(input).trim().toLowerCase();
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return new Date(+slash[3], +slash[2] - 1, +slash[1]);
  const m = s.match(/^(\d{1,2})\s+([a-zşğıöüç]+)\s+(\d{4})$/);
  if (!m) throw new Error('Tarih okunamadı: ' + input);
  const ay = AYLAR.indexOf(m[2]);
  if (ay === -1) throw new Error('Ay bulunamadı: ' + m[2]);
  return new Date(+m[3], ay, +m[1]);
}

export default async function handler(req, res) {
  // CORS İZİNLERİ (Tarayıcı için)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // Tarayıcının ön kontrol isteğini onayla
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // EKLE
  if (req.method === 'POST') {
    const { content, eventDate, remindDaysBefore } = req.body || {};
    if (!content || !eventDate || !Array.isArray(remindDaysBefore))
      return res.status(400).json({ error: 'Eksik bilgi gönderdiniz.' });

    let date;
    try { date = parseTR(eventDate); }
    catch (e) { return res.status(400).json({ error: e.message }); }

    const id = crypto.randomUUID();
    const reminder = { id, content, eventDate: date.toISOString(), remindDaysBefore, status: 'active' };
    
    try {
      await valkey.hset(KEY, id, JSON.stringify(reminder));
      return res.json(reminder);
    } catch (err) {
      return res.status(500).json({ error: 'Valkey bağlantı hatası: ' + err.message });
    }
  }

  // SİL
  if (req.method === 'DELETE') {
    if (!req.query.id) return res.status(400).json({ error: 'id gerekli' });
    try {
      await valkey.hdel(KEY, req.query.id);
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Valkey hatası: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
}
