const { cmd } = require('../command');

cmd({
    pattern: "gcstatus",
    alias: ["gstatus", "groupstatus"],
    desc: "Post replied message as group status",
    category: "group",
    use: ".groupstatus [reply to image/video/audio/text]",
    filename: __filename
},
async (conn, m, store, {
    quoted,
    isGroup,
    isAdmins,
    isOwner,
    reply
}) => {

    try {
        if (!isGroup)
            return reply("❌ This command can only be used in groups.");

        if (!isOwner) // change to isAdmins if you actually mean admins
            return reply("❌ Only the owner can use this command.");

        if (!quoted)
            return reply("❗ Please reply to the media or text you want to set as group status.");

        const mtype = quoted.mtype || quoted.type;
        let statusPayload = {};

        // 🖼 IMAGE
        if (mtype === 'imageMessage') {
            const mediaBuffer = await quoted.download();
            const caption = quoted.imageMessage?.caption || '';

            statusPayload = {
                groupStatusMessage: {
                    image: mediaBuffer,
                    caption
                }
            };
        }

        // 🎥 VIDEO
        else if (mtype === 'videoMessage') {
            const mediaBuffer = await quoted.download();
            const caption = quoted.videoMessage?.caption || '';

            statusPayload = {
                groupStatusMessage: {
                    video: mediaBuffer,
                    caption
                }
            };
        }

        // 🎵 AUDIO
        else if (mtype === 'audioMessage') {
            const mediaBuffer = await quoted.download();

            statusPayload = {
                groupStatusMessage: {
                    audio: mediaBuffer,
                    ptt: quoted.audioMessage?.ptt || false
                }
            };
        }

        // 📝 TEXT
        else if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
            const textContent = quoted.text || quoted.msg || '';

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

        else {
            return reply("❌ Unsupported media type.");
        }

        await conn.sendMessage(m.chat, statusPayload);
        return reply("✅ Group status updated successfully.");

    } catch (e) {
        console.error("groupstatus error:", e);
        return reply("⚠️ Failed to update group status. Please try again later.");
    }
});
