# 🤖 Telegram Groq AI Bot

Bot Telegram multifungsi pake Groq API. Bisa ganti model & gaya bahasa langsung dari chat. Anti spam & udah support cooldown biar ga kena limit Telegram.

Inspired by: [tanya-ai-bots.netlify.app](https://tanya-ai-bots.netlify.app/)

## ✨ Fitur

- **4 Model Groq**: Sama persis kayak web tanya-ai-bots
    - `Llama 3.1 8B` - Super cepat ⚡
    - `Llama 3.1 70B` - Paling balance 🧠
    - `Mixtral 8x7B` - Context panjang 32k
    - `Gemma 2 9B` - Paling jago Bahasa Indonesia 🇮🇩
- **3 Gaya Bahasa**: KBBI Baku, Gaul Jaksel, Singkat
- **Anti Flood**: Cooldown 2 detik biar ga kena limit 429 Telegram
- **Setting per User**: Preferensi tiap user kesimpen
- **Deploy Gampang**: Siap jalan di Render.com

## 🚀 Command Bot

| Command | Fungsi |
| --- | --- |
| `/start` / `/menu` | Mulai bot & liat setting aktif |
| `/model` | Pilih model AI |
| `/style` | Pilih gaya bahasa |
| `/status` | Cek model & gaya yang dipake |
| `/reset` | Balik ke default: Llama 3.1 70B + KBBI |

## 📦 Instalasi & Deploy ke Render

### 1. Clone Repo
```bash
git clone https://github.com/username/repo-kamu.git
cd repo-kamu
npm install
