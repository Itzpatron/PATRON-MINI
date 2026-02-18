const { cmd } = require('../command');
const axios = require('axios');
const yts = require('youtube-yts');

cmd({
    pattern: "video",
    desc: "Download video from YouTube by name or link",
    category: "downloader",
    filename: __filename,
    use: "<name/link>"
}, async (conn, mek, m, { text, reply }) => {
    try {
        if (!text) {
            return reply("❌ Give me a video name or YouTube link!");
        }

        const start = Date.now();

        await conn.sendMessage(m.chat, {
            react: { text: "🎬", key: mek.key }
        });

        let videoUrl = text;

        // 🔎 If NOT a YouTube link → search using youtube-yts
        if (!text.includes("youtube.com") && !text.includes("youtu.be")) {

            await reply("🔎 Searching YouTube...");

            const search = await yts(text);
            if (!search.videos.length)
                return reply("❌ No results found.");

            videoUrl = search.videos[0].url;
        }

        // 🔥 Call Prexzy API
        const apiUrl = `https://apis.prexzyvilla.site/download/ytdown?url=${encodeURIComponent(videoUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.success || !data.video) {
            return reply("❌ Failed to fetch video.");
        }

        const title = data.title || "YouTube Video";
        const videoDownloadUrl = data.video.downloadUrl;
        const quality = data.video.quality;
        const size = data.video.fileSize;
        const duration = data.video.duration;

        if (!videoDownloadUrl)
            return reply("❌ Video download link missing.");

        const speed = Date.now() - start;

        await reply(
            `🎬 *YouTube Video Downloader*\n\n` +
            `📌 *Title:* ${title}\n` +
            `🎞️ *Quality:* ${quality}\n` +
            `⏱️ *Duration:* ${duration}\n` +
            `📦 *Size:* ${size}\n` +
            `⚡ *Response:* ${speed} ms\n\n` +
            `⬇️ Sending video...`
        );

        await conn.sendMessage(
            m.chat,
            {
                video: { url: videoDownloadUrl },
                mimetype: "video/mp4",
                caption: title
            },
            { quoted: mek }
        );

    } catch (err) {
        console.error("Video command error:", err.response?.data || err.message);
        reply("❌ Error while processing your request.");
    }
});
