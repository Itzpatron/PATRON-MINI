const { cmd } = require('../command');

cmd({
    pattern: "gcstatus",
    alias: ["gstatus", "groupstatus"],
    desc: "Post replied message or text as group status",
    category: "group",
    use: ".gcstatus [reply or text]",
    filename: __filename
},
async (conn, m, store, {
    quoted,
    args,
    isGroup,
    isOwner,
    reply
}) => {

    try {
        if (!isGroup)
            return reply("❌ This command can only be used in groups.");

        if (!isOwner)
            return reply("❌ Only the owner can use this command.");

        let statusPayload = {};
        let textContent = "";

        // =========================
        // 🖼 IMAGE
        // =========================
        if (quoted?.mtype === 'imageMessage') {
            const mediaBuffer = await quoted.download();
            const caption = quoted.message?.imageMessage?.caption || "";

            statusPayload = {
                groupStatusMessage: {
                    image: mediaBuffer,
                    caption
                }
            };
        }

        // =========================
        // 🎥 VIDEO
        // =========================
        else if (quoted?.mtype === 'videoMessage') {
            const mediaBuffer = await quoted.download();
            const caption = quoted.message?.videoMessage?.caption || "";

            statusPayload = {
                groupStatusMessage: {
                    video: mediaBuffer,
                    caption
                }
            };
        }

        // =========================
        // 🎵 AUDIO
        // =========================
        else if (quoted?.mtype === 'audioMessage') {
            const mediaBuffer = await quoted.download();

            statusPayload = {
                groupStatusMessage: {
                    audio: mediaBuffer,
                    ptt: quoted.message?.audioMessage?.ptt || false
                }
            };
        }

        // =========================
        // 📝 TEXT (Reply OR Args)
        // =========================
        else {

            // 1️⃣ If replying to text
            if (quoted?.message?.conversation) {
                textContent = quoted.message.conversation;
            } 
            else if (quoted?.message?.extendedTextMessage?.text) {
                textContent = quoted.message.extendedTextMessage.text;
            }

            // 2️⃣ If no reply text, use args
            if (!textContent && args?.length > 0) {
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
        return reply("⚠️ Failed to update group status. Please try again later.");
    }
});
