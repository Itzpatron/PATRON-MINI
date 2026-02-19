const { cmd } = require("../command");
const config = require("../config"); // adjust path if needed

cmd({
    pattern: "repo",
    category: "utility",
    desc: "Shows instructions to create your own bot and sends contact vCard",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    try {
        const jid = m.chat;

        const baseUrl = "http://patronffx.name.ng:3015"; // fallback URL

        // 1️⃣ Repo info message
        const repoMessage = `
📌 *CREATE YOUR BOT ACCOUNT*

1️⃣ Go to: ${baseUrl}
2️⃣ Sign up or log in to create your own bot.
3️⃣ Click on "My Bots" and create your bot.
4️⃣ Connect and link the bot to your WhatsApp.
5️⃣ After setup, you can use all commands remotely on your own bot.

💡 *Tip:* Keep your bot token and WhatsApp linked account secure.

⚡ *Quick Pair:* You can also connect instantly without the website using:
   \`.pair 234XXXXXXXXX\`
        `.trim();

        await m.reply(repoMessage);

        // 2️⃣ Send your vCard with small caps name + 🚹
        const vcard = `
BEGIN:VCARD
VERSION:3.0
N:ᴘᴀᴛʀᴏɴ;;;;
FN:ᴘᴀᴛʀᴏɴ 🚹
TEL;type=CELL;type=VOICE;waid=2348133729715:+2348133729715
NOTE:Contact if help needed
END:VCARD
        `.trim();

        await conn.sendMessage(jid, {
            contacts: { displayName: "ᴘᴀᴛʀᴏɴ 🚹", contacts: [{ vcard }] }
        }, { quoted: mek });

        // Optional: Update statistics if your bot supports it
        if (conn.bot && conn.bot.update) {
            const stats = conn.bot.statistics || {};
            stats.messagesSent = (stats.messagesSent || 0) + 2; // two messages sent
            await conn.bot.update({ statistics: stats });
        }

    } catch (err) {
        console.error("Repo command error:", err);
        await reply("❌ Failed to fetch repo information.");

        if (conn.bot && conn.bot.update) {
            const stats = conn.bot.statistics || {};
            stats.messagesSent = (stats.messagesSent || 0) + 1;
            await conn.bot.update({ statistics: stats });
        }
    }
});
