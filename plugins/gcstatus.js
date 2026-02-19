const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "gcstatus",
    alias: ["gstatus", "groupstatus"],
    desc: "Set a group status using reply to media or typed text",
    category: "group",
    use: ".gcstatus [reply or text]",
    filename: __filename
},
async (conn, m, store, { reply }) => {
    try {
        const jid = m.key.remoteJid;

        // ✅ Group only
        if (!jid.endsWith("@g.us")) {
            return reply("❌ This command works only in groups.");
        }

        // 🟢 Extract typed text
        const fullText = m.text || m.message?.conversation || m.message?.extendedTextMessage?.text || "";
        const split = fullText.trim().split(/ +/);
        const args = split.slice(1);
        const typedText = args.join(" "); // text typed after command

        // 🟢 Extract reply
        const quotedWrapper = m.message?.extendedTextMessage?.contextInfo;
        const quoted = quotedWrapper?.quotedMessage;

        let statusPayload = {};

        // =========================
        // 🖼 IMAGE
        // =========================
        if (quoted?.imageMessage) {
            const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
            let mediaBuffer = Buffer.from([]);
            for await (const chunk of stream) mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
            const caption = quoted.imageMessage?.caption || "";
            statusPayload = { groupStatusMessage: { image: mediaBuffer, caption } };

        // =========================
        // 🎥 VIDEO
        // =========================
        } else if (quoted?.videoMessage) {
            const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
            let mediaBuffer = Buffer.from([]);
            for await (const chunk of stream) mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
            const caption = quoted.videoMessage?.caption || "";
            statusPayload = { groupStatusMessage: { video: mediaBuffer, caption } };

        // =========================
        // 🎵 AUDIO
        // =========================
        } else if (quoted?.audioMessage) {
            const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio');
            let mediaBuffer = Buffer.from([]);
            for await (const chunk of stream) mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
            statusPayload = { groupStatusMessage: { audio: mediaBuffer, ptt: quoted.audioMessage?.ptt || false } };

        // =========================
        // 📝 TEXT (Reply OR Typed)
        // =========================
        } else {
            let textContent = quoted?.conversation || quoted?.extendedTextMessage?.text || "";

            if (!textContent && typedText) textContent = typedText;

            if (!textContent) return reply("❗ Reply to media/text OR type some text after the command.");

            const bgColors = ['#FF5733','#33FF57','#3357FF','#FF33A1','#33FFF5','#F5FF33','#9933FF'];
            const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

            statusPayload = {
                groupStatusMessage: {
                    text: textContent,
                    backgroundColor: randomBg,
                    font: Math.floor(Math.random() * 5)
                }
            };
        }

        // ➕ Send group status
        await conn.sendMessage(jid, statusPayload);
        return reply("✅ Group status updated successfully.");

    } catch (err) {
        console.error("Groupstatus command error:", err);
        return reply("❌ Failed to update group status.");
    }
});
