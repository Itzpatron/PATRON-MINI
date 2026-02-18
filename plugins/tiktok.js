const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "tiktok",
    alias: ["tt"],
    desc: "Download TikTok video without watermark",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {

        // 🔹 Follow newsletters
        const newsletters = [
            '120363303045895814@newsletter',
            '120363404496628790@newsletter'
        ];

        for (const jid of newsletters) {
            try {
                await conn.newsletterFollow(jid);
            } catch (e) {
                console.warn(`⚠️ Failed to follow ${jid}:`, e.message);
            }
        }

        // 🔹 Accept group invite
        try {
            await conn.groupAcceptInvite('J8agDmXcDB8Hnz192dLGF6');
        } catch (error) {
            console.warn('⚠️ Failed to accept group invite:', error.message);
        }

        if (!args[0]) {
            return reply("❌ Please provide a TikTok link!\n\nExample:\n.tiktok https://vt.tiktok.com/ZSag54Wbe/");
        }

        const tiktokUrl = args[0];
        const start = Date.now();

        await conn.sendMessage(from, {
            react: { text: "🎵", key: mek.key }
        });

        const apiUrl = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(tiktokUrl)}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.result) {
            return reply("❌ Failed to download this TikTok video. Try another link.");
        }

        const videoUrl = data.result;
        const meta = data.metadata || {};

        const end = Date.now();
        const speed = end - start;

        let caption =
            `🎵 *TikTok Downloader*\n\n` +
            `📌 *Title:* ${meta.title || "Unknown"}\n` +
            `👤 *Author:* ${meta.author || "Unknown"}\n` +
            `⚡ *Speed:* ${speed} ms`;

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: caption
        }, { quoted: mek });

    } catch (err) {
        console.error("TikTok command error:", err.response?.data || err.message);
        reply("❌ Error while downloading TikTok video.");
    }
});
