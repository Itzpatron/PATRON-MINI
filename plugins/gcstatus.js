const { cmd } = require('../command');

cmd({
    pattern: "gcstatus",
    alias: ["gstatus", "groupstatus"],
    desc: "Post replied media/text or typed text as group status",
    category: "group",
    use: ".gcstatus [reply or text]",
    filename: __filename
},
async (conn, m, store, { isGroup, isOwner, reply }) => {

    try {
        if (!isGroup)
            return reply("❌ This command can only be used in groups.");

        if (!isOwner)
            return reply("❌ Only the owner can use this command.");

        // ✅ Extract text typed after the command
        const body = m.text || m.message?.conversation || "";
        const args = body.trim().split(/ +/).slice(1);

        // ✅ Extract the replied message, if any
        let quotedMsg = null;
        if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            quotedMsg = m.message.extendedTextMessage.contextInfo;
        }

        let statusPayload = {};

        // =========================
        // 🖼 IMAGE
        // =========================
        if (quotedMsg?.quotedMessage?.imageMessage) {
            const mediaBuffer = await quotedMsg.download?.() || null;
            if (!mediaBuffer) return reply("❗ Failed to download image.");

            statusPayload = {
                groupStatusMessage: {
                    image: mediaBuffer,
                    caption: quotedMsg.quotedMessage.imageMessage.caption || ""
                }
            };
        }

        // =========================
        // 🎥 VIDEO
        // =========================
        else if (quotedMsg?.quotedMessage?.videoMessage) {
            const mediaBuffer = await quotedMsg.download?.() || null;
            if (!mediaBuffer) return reply("❗ Failed to download video.");

            statusPayload = {
                groupStatusMessage: {
                    video: mediaBuffer,
                    caption: quotedMsg.quotedMessage.videoMessage.caption || ""
                }
            };
        }

        // =========================
        // 🎵 AUDIO
        // =========================
        else if (quotedMsg?.quotedMessage?.audioMessage) {
            const mediaBuffer = await quotedMsg.download?.() || null;
            if (!mediaBuffer) return reply("❗ Failed to download audio.");

            statusPayload = {
                groupStatusMessage: {
                    audio: mediaBuffer,
                    ptt: quotedMsg.quotedMessage.audioMessage.ptt || false
                }
            };
        }

        // =========================
        // 📝 TEXT (Reply OR Args)
        // =========================
        else {

            let textContent = "";

            // Use text from replied message
            if (quotedMsg?.quotedMessage?.conversation) {
                textContent = quotedMsg.quotedMessage.conversation;
            }
            else if (quotedMsg?.quotedMessage?.extendedTextMessage?.text) {
                textContent = quotedMsg.quotedMessage.extendedTextMessage.text;
            }

            // If no reply text, use typed text
            if (!textContent && args.length > 0) {
                textContent = args.join(" ");
            }

            if (!textContent || typeof textContent !== "string") {
                return reply("❗ Reply to media/text OR provide text after the command.");
            }

            const bgColors = [
                '#FF5733', '#33FF57', '#3357FF',
                '#FF33A1', '#33FFF5', '#F5FF33', '#9933FF'
            ];

            const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

            statusPayload = {
                groupStatusMessage: {
                    text: textContent,
                    backgroundColor: randomBg,
                    font: Math.floor(Math.random() * 5)
                }
            };
        }

        await conn.sendMessage(m.chat, statusPayload);

        return reply("✅ Group status updated successfully.");

    } catch (e) {
        console.error("groupstatus error:", e);
        return reply("⚠️ Failed to update group status.");
    }
});
