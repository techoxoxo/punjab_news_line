const testUAs = [
  { ua: 'WhatsApp/2.21.12.21 A', expected: true, label: 'WhatsApp Preview Bot' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.21.120.25 W', expected: false, label: 'WhatsApp In-App Browser' },
  { ua: 'TelegramBot (like TwitterBot)', expected: true, label: 'Telegram Bot' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Telegram-iOS/7.8.1', expected: false, label: 'Telegram In-App Browser' },
  { ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', expected: true, label: 'Facebook Crawler' },
  { ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36', expected: false, label: 'Real Chrome Mobile' }
];

function isBot(ua) {
  const isCommonBot = /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|google.*preview|preview.*google/i.test(ua);
  const isSocialPreview = (ua.includes('WhatsApp') || ua.includes('Telegram')) && !ua.includes('Mozilla/');
  return isCommonBot || isSocialPreview;
}

console.log('Testing Bot Detection Logic:');
testUAs.forEach(test => {
  const result = isBot(test.ua);
  console.log(`[${result === test.expected ? '✅' : '❌'}] ${test.label}: ${result ? 'Blocked' : 'Allowed'}`);
});
