const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: "alive",
    alias: ["status", "online", "a"],
    desc: "Check bot is alive or not",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "⚡",
            key: m.key
        }
    });
    try {
        const status = `
╭───〔 *🤖 PATRON-MD STATUS* 〕───◉
│✨ *Bot is Active & Online!*
│
│    *use .setalive to customize*
│
│🧠 *Owner:* ${config.OWNER_NAME}
│⚡ *Version:* 2.0.0 Beta
│📝 *Prefix:* [${config.PREFIX}]
│📳 *Mode:* [${config.MODE}]
│⌛ *Uptime:* ${runtime(process.uptime())}
╰────────────────────◉
> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹* `;

        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/e71nan.png' },
            caption: status,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363303045895814@newsletter',
                    newsletterName: 'ᴘᴀᴛʀᴏɴTᴇᴄʜＸ',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
