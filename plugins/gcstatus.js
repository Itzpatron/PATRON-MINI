const { cmd } = require('../command');
const { getContentType } = require('@whiskeysockets/baileys');

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

        // ✅ Extract body manually
        const body = m.text || m.message?.conversation || "";
        const args = body.trim().split(/ +/).slice(1);

        // ✅ Extract quoted manually from contextInfo
        let quotedMsg = null;

        if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            quotedMsg = m.message.extendedTextMessage.contextInfo.quotedMessage;
        }

        let statusPayload = {};

        // =========================
        // 🖼 IMAGE
        // =========================
        if (quotedMsg && quotedMsg.imageMessage) {

            const mediaBuffer = await conn.downloadMediaMessage({
                message: quotedMsg
            });

            statusPayload = {
                groupStatusMessage: {
                    image: mediaBuffer,
                    caption: quotedMsg.imageMessage.caption || ""
                }
            };
        }

        // =========================
        // 🎥 VIDEO
        // =========================
        else if (quotedMsg && quotedMsg.videoMessage) {

            const mediaBuffer = await conn.downloadMediaMessage({
                message: quotedMsg
            });

            statusPayload = {
                groupStatusMessage: {
                    video: mediaBuffer,
                    caption: quotedMsg.videoMessage.caption || ""
                }
            };
        }

        // =========================
        // 🎵 AUDIO
        // =========================
        else if (quotedMsg && quotedMsg.audioMessage) {

            const mediaBuffer = await conn.downloadMediaMessage({
                message: quotedMsg
            });

            statusPayload = {
                groupStatusMessage: {
                    audio: mediaBuffer,
                    ptt: quotedMsg.audioMessage.ptt || false
                }
            };
        }

        // =========================
        // 📝 TEXT (Reply OR Args)
        // =========================
        else {

            let textContent = "";

            // If replied to text
            if (quotedMsg?.conversation) {
                textContent = quotedMsg.conversation;
            } 
            else if (quotedMsg?.extendedTextMessage?.text) {
                textContent = quotedMsg.extendedTextMessage.text;
            }

            // If no reply text, use args
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
