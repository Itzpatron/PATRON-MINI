const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: "lyrics",
  alias: ["lyric"],
  desc: "Get song lyrics from PrexzyVilla API",
  category: "misc",
  use: "<song title>",
  filename: __filename
}, async (conn, mek, m, { text, prefix, command, reply }) => {
  if (!text) return reply(`❌ Please provide a song title.\nExample: *${prefix + command} Wishing Well*`);

  // React with 📜 emoji
  await conn.sendMessage(m.key.remoteJid, { react: { text: "📜", key: m.key } });

  try {
    const query = encodeURIComponent(text);
    const url = `https://apis.prexzyvilla.site/search/lyrics?title=${query}`;
    const { data } = await axios.get(url);

    if (!data.status || !data.data || !data.data.lyrics) {
      return reply("❌ Lyrics not found.");
    }

    const { title, artist, album, duration, lyrics } = data.data;

    let message =
      `🎵 *${title}*\n` +
      `👤 Artist: ${artist}\n` +
      `💽 Album: ${album || "Unknown"}\n` +
      `⏱️ Duration: ${duration ? duration + "s" : "Unknown"}\n\n` +
      `📄 *Lyrics:*\n${lyrics.trim()}\n\n` +
      `*© Powered by Patron TechX 🚹*`;

    await reply(message);

  } catch (err) {
    console.error("Lyrics fetch error:", err);
    reply("❌ Failed to fetch lyrics. Try again later.");
  }
});
