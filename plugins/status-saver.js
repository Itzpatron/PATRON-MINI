
 const { cmd } = require("../command");

cmd({
  pattern: "save",
  alias: ["sv", "send"],
  desc: "Download and forward a quoted message (text, media, sticker, doc)",
  category: "info",
  filename: __filename,
}, async (conn, m, { isMe, reply }) => {
   await client.sendMessage(message.key.remoteJid, {
    react: {
      text: "📤",
      key: message.key
    }
  });
  try {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return reply("Reply to a message or media to download and save.");

    const botNumber = conn.user.id;

    // TEXT
    if (quoted.conversation) {
      return conn.sendMessage(botNumber, { text: quoted.conversation }, { quoted: m });
    }

    // IMAGE
    if (quoted.imageMessage) {
      const caption = quoted.imageMessage.caption || "";
      const imagePath = await conn.downloadAndSaveMediaMessage(quoted.imageMessage);
      return conn.sendMessage(botNumber, { image: { url: imagePath }, caption }, { quoted: m });
    }

    // AUDIO
    if (quoted.audioMessage) {
      const audioPath = await conn.downloadAndSaveMediaMessage(quoted.audioMessage);
      return conn.sendMessage(botNumber, {
        audio: { url: audioPath },
        mimetype: "audio/mpeg",
      }, { quoted: m });
    }

    // VIDEO
    if (quoted.videoMessage) {
      const caption = quoted.videoMessage.caption || "";
      const videoPath = await conn.downloadAndSaveMediaMessage(quoted.videoMessage);
      return conn.sendMessage(botNumber, { video: { url: videoPath }, caption }, { quoted: m });
    }

    // STICKER
    if (quoted.stickerMessage) {
      const stickerPath = await conn.downloadAndSaveMediaMessage(quoted.stickerMessage);
      return conn.sendMessage(botNumber, { sticker: { url: stickerPath } }, { quoted: m });
    }

    // DOCUMENT
    if (quoted.documentMessage) {
      const docPath = await conn.downloadAndSaveMediaMessage(quoted.documentMessage);
      const fileName = quoted.documentMessage.fileName || "file";
      const mimetype = quoted.documentMessage.mimetype || "application/octet-stream";

      return conn.sendMessage(botNumber, {
        document: { url: docPath },
        mimetype,
        fileName,
      }, { quoted: m });
    }

    return reply("Unsupported message type.");

  } catch (err) {
    console.error(err);
    reply("Error saving message.");
  }
});