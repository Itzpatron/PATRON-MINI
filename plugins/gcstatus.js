/**
 * Group Status Command Plugin
 * Set a group status using reply to media or text
 * Handles typed text without including the command
 */

const { downloadContentFromMessage } = require('baileys');

module.exports = async (socket, msg, bot) => {
  try {
    const jid = msg.key.remoteJid;

    // ✅ Group only
    if (!jid.endsWith("@g.us")) {
      return socket.sendMessage(jid, { text: "❌ This command works only in groups." }, { quoted: msg });
    }

    // 🟢 Extract the message text
    const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const split = fullText.trim().split(/ +/);

    // Remove the command itself
    const args = split.slice(1);
    const typedText = args.join(" "); // This is what we want to post

    // 🟢 Check for reply
    const quotedWrapper = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = quotedWrapper?.quotedMessage;

    let statusPayload = {};

    // =========================
    // 🖼 IMAGE
    // =========================
    if (quoted?.imageMessage) {
      const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
      let mediaBuffer = Buffer.from([]);
      for await (const chunk of stream) {
        mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
      }
      const caption = quoted.imageMessage?.caption || "";
      statusPayload = {
        groupStatusMessage: { image: mediaBuffer, caption }
      };

    // =========================
    // 🎥 VIDEO
    // =========================
    } else if (quoted?.videoMessage) {
      const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
      let mediaBuffer = Buffer.from([]);
      for await (const chunk of stream) {
        mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
      }
      const caption = quoted.videoMessage?.caption || "";
      statusPayload = {
        groupStatusMessage: { video: mediaBuffer, caption }
      };

    // =========================
    // 🎵 AUDIO
    // =========================
    } else if (quoted?.audioMessage) {
      const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio');
      let mediaBuffer = Buffer.from([]);
      for await (const chunk of stream) {
        mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
      }
      statusPayload = {
        groupStatusMessage: { audio: mediaBuffer, ptt: quoted.audioMessage?.ptt || false }
      };

    // =========================
    // 📝 TEXT (Reply OR Typed)
    // =========================
    } else {
      // Use reply text if available
      let textContent = quoted?.conversation || quoted?.extendedTextMessage?.text || "";

      // If no reply, use typed text without command
      if (!textContent && typedText) {
        textContent = typedText;
      }

      if (!textContent) {
        return socket.sendMessage(jid, { text: "❗ Reply to media/text OR type some text after the command." }, { quoted: msg });
      }

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
    await socket.sendMessage(jid, statusPayload);
    await socket.sendMessage(jid, { text: "✅ Group status updated successfully." }, { quoted: msg });

  } catch (err) {
    console.error("Groupstatus command error:", err);
    await socket.sendMessage(msg.key.remoteJid, { text: "❌ Failed to update group status." }, { quoted: msg });
  }
};
