import Redis from 'ioredis';

let valkey;

if (!global.valkey) {
  // Aiven size "rediss://" ile başlayan bir URI verir (SSL/TLS için)
  // Örn: rediss://default:password@host:port
  global.valkey = new Redis(process.env.VALKEY_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true, // İlk komutta bağlan
  });
}
valkey = global.valkey;

export { valkey };
