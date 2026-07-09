const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');

const app = express();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ===== CONFIG =====
const userSettings = {};
const userCooldown = {};
const COOLDOWN_MS = 2000; // 2 detik anti spam

// Model sama kayak https://tanya-ai-bots.netlify.app/
const MODELS = {
  'llama31_8b': { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B - Paling Cepat ⚡' },
  'llama31_70b': { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B - Pintar 🧠' },
  'mixtral': { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B - Context 32k' },
  'gemma2_9b': { id: 'gemma2-9b-it', name: 'Gemma 2 9B - Jago Indo 🇮🇩' }
};

const STYLES = {
  'baku': 'Anda adalah asisten AI. Jawab selalu menggunakan Bahasa Indonesia yang baik dan benar sesuai KBBI dan PUEBI. Gunakan kalimat efektif, ejaan baku, dan tata bahasa formal.',
  'gaul': 'Lu adalah bot asik. Jawab pake Bahasa Indonesia santai Jaksel. Pake "lu", "gw", "bro". Boleh pake emoji.',
  'singkat': 'Jawab sesingkat dan sepadat mungkin. Maksimal 2 kalimat. Langsung ke poin utama.'
};

// ===== WEBHOOK RENDER =====
app.get('/', (req, res) => res.send('Bot Groq Jalan!'));
app.use(express.json());
app.post(`/bot${process.env.TELEGRAM_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (url) {
    bot.setWebHook(`${url}/bot${process.env.TELEGRAM_TOKEN}`);
    console.log(`Webhook set ke ${url}`);
  }
});

// ===== COMMANDS =====
bot.onText(/\/start|\/menu/, (msg) => {
  const chatId = msg.chat.id;
  if (!userSettings[chatId]) {
    userSettings[chatId] = { model: 'llama31_70b', style: 'baku' };
  }
  const s = userSettings[chatId];
  bot.sendMessage(chatId,
    `Halo! Saya asisten AI Groq.\n\n` +
    `Setting aktif:\n` +
    `Model: ${MODELS[s.model].name}\n` +
    `Gaya: ${s.style}\n\n` +
    `Perintah:\n` +
    `/model - Ganti model AI\n` +
    `/style - Ganti gaya bahasa\n` +
    `/status - Lihat setting\n` +
    `/reset - Kembali ke default`
  );
});

bot.onText(/\/model$/, (msg) => {
  let teks = 'Pilih model AI:\n\n';
  teks += `/llama31_8b - Llama 3.1 8B ⚡\n`;
  teks += `/llama31_70b - Llama 3.1 70B 🧠\n`;
  teks += `/mixtral - Mixtral 8x7B\n`;
  teks += `/gemma2_9b - Gemma 2 9B 🇮🇩\n`;
  bot.sendMessage(msg.chat.id, teks);
});

bot.onText(/^\/(llama31_8b|llama31_70b|mixtral|gemma2_9b)$/, (msg, match) => {
  const chatId = msg.chat.id;
  const modelKey = match[1];
  userSettings[chatId] = {...userSettings[chatId], model: modelKey };
  bot.sendMessage(chatId, `Model diganti ke: ${MODELS[modelKey].name}`);
});

bot.onText(/\/style$/, (msg) => {
  let teks = 'Pilih gaya bahasa:\n\n';
  teks += `/baku - Indonesia KBBI\n`;
  teks += `/gaul - Santai Jaksel\n`;
  teks += `/singkat - To the point\n`;
  bot.sendMessage(msg.chat.id, teks);
});

bot.onText(/^\/(baku|gaul|singkat)$/, (msg, match) => {
  const chatId = msg.chat.id;
  const styleKey = match[1];
  userSettings[chatId] = {...userSettings[chatId], style: styleKey };
  bot.sendMessage(chatId, `Gaya bahasa diganti ke: ${styleKey}`);
});

bot.onText(/\/status/, (msg) => {
  const s = userSettings[msg.chat.id] || { model: 'llama31_70b', style: 'baku' };
  bot.sendMessage(msg.chat.id, `Setting aktif:\nModel: ${MODELS[s.model].name}\nGaya: ${s.style}`);
});

bot.onText(/\/reset/, (msg) => {
  userSettings[msg.chat.id] = { model: 'llama31_70b', style: 'baku' };
  bot.sendMessage(msg.chat.id, 'Setting direset ke default: Llama 3.1 70B + KBBI Baku');
});

// ===== HANDLER CHAT UTAMA + ANTI FLOOD =====
bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const now = Date.now();

  // 1. Cooldown 2 detik biar ga kena limit Telegram
  if (userCooldown[chatId] && now - userCooldown[chatId] < COOLDOWN_MS) {
    return; // Di-skip aja biar ga spam
  }
  userCooldown[chatId] = now;

  const s = userSettings[chatId] || { model: 'llama31_70b', style: 'baku' };

  await bot.sendChatAction(chatId, 'typing').catch(() => {});

  try {
    const chat = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: STYLES[s.style] },
        { role: 'user', content: msg.text }
      ],
      model: MODELS[s.model].id,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = chat.choices[0].message.content;

    // Delay 0.5s biar aman dari flood
    await new Promise(r => setTimeout(r, 500));
    await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });

  } catch (e) {
    // Handle rate limit Telegram 429
    if (e.response && e.response.statusCode === 429) {
      const retryAfter = e.response.body.parameters.retry_after || 5;
      console.log(`Rate limit: tunggu ${retryAfter}s`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      await bot.sendMessage(chatId, 'Bot lagi sibuk bro, coba kirim ulang ya.');
    } else {
      console.error(e);
      await bot.sendMessage(chatId, 'Maaf, terjadi galat: ' + e.message);
    }
  }
});

console.log('Bot started...');