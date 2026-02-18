const axios = require("axios");
const yts = require("youtube-yts");
const { cmd } = require("../command");

cmd({
  pattern: "play",
  alias: ["ytplay", "song", "music"],
  desc: "Search YouTube and download audio",
  react: "🎵",
  category: "downloader",
  filename: __filename,
  use: "<song name>"
}, async (conn, mek, m, { text, reply }) => {
  try {
    if (!text) return reply("❌ Please enter a song name.");

    // 🔎 SEARCH YOUTUBE
    const search = await yts(text);
    if (!search.videos.length)
      return reply("❌ No results found.");

    const video = search.videos[0];
    const ytUrl = video.url;

    await reply(`🎧 Downloading: *${video.title}*`);

    // 🔥 Oota Izumi API
    const apiUrl = `https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(ytUrl)}&format=mp3`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.result || !data.result.download) {
      console.log("API Response:", data);
      return reply("❌ Failed to fetch audio.");
    }

    const title = data.result.title || video.title;
    const audioUrl = data.result.download;
    const duration = data.result.duration?.timestamp || video.timestamp;

    await reply(
      `🎵 *YouTube Audio Downloader*\n\n` +
      `📌 *Title:* ${title}\n` +
      `⏱️ *Duration:* ${duration}\n\n` +
      `⬇️ Sending audio...`
    );

    // 🎵 SEND AUDIO (NO contextInfo)
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`
      },
      { quoted: mek }
    );

  } catch (err) {
    console.error("Play command error:", err.response?.data || err.message);
    reply("❌ Error while processing your request.");
  }
});
