const { cmd } = require('../command');
const config = require('../config');
const { getUserConfigFromMongoDB, updateUserConfigInMongoDB, incrementAntiLinkWarn, getAntiLinkWarnCount, resetAntiLinkWarn } = require('../lib/database');

// Default mode (fallback)
if (!config.ANTI_LINK_MODE) {
  config.ANTI_LINK_MODE = "warn"; // warn | delete | kick
}

const WARN_THRESHOLD = 3; // Kick after 3 warns

// ================= Robust Link Patterns =================
const linkPatterns = [
  // Major social media links
  /\b(?:https?:\/\/)?(?:www\.)?chat\.whatsapp\.com\/\S+/gi,
  /\b(?:https?:\/\/)?wa\.me\/\S+/gi,
  /\b(?:https?:\/\/)?(?:t\.me|telegram\.me)\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?youtube\.com\/\S+/gi,
  /\b(?:https?:\/\/)?youtu\.be\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?facebook\.com\/\S+/gi,
  /\b(?:https?:\/\/)?fb\.me\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?instagram\.com\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?twitter\.com\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?tiktok\.com\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?linkedin\.com\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?snapchat\.com\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?pinterest\.com\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?reddit\.com\/\S+/gi,
  /\b(?:https?:\/\/)?(?:www\.)?discord\.com\/\S+/gi,

  // Generic URL matcher (catch anything like http(s):// or www.domain)
  /\b(?:https?:\/\/|www\.)\S+\.\S+/gi
];


// ================= MENU COMMAND =================

cmd({
  pattern: "antilink",
  desc: "Configure anti-link settings",
  category: "settings",
  }, async (conn, m, store, {
  from,
  args,
  isGroup,
  isAdmins,
  reply,
  botNumber
}) => {

  if (!isGroup) return reply("❌ This command works in groups only.");
  if (!isAdmins) return reply("❌ Only group admins can use this command.");

  const option = args[0]?.toLowerCase();

  // Load per-number user config (use botNumber if provided, fallback to owner)
  const cfgNumber = (botNumber || config.OWNER_NUMBER || '').toString().replace(/[^0-9]/g, '');
  const userCfg = await getUserConfigFromMongoDB(cfgNumber).catch(() => null) || {};

  const currentMode = ((userCfg.ANTI_LINK === 'true') ? (userCfg.ANTI_LINK_MODE || config.ANTI_LINK_MODE || 'warn') : 'OFF').toUpperCase();

  if (!option) {
    return reply(
`🛡️ *ANTI-LINK SETTINGS*

Choose what action the bot should take:

1️⃣ Warn
2️⃣ Delete message
3️⃣ Kick user
4️⃣ Off

📌 Commands:
.antilink warn
.antilink delete
.antilink kick
.antilink off

⚙️ Current Mode: *${currentMode}*`
    );
  }

  // Turn anti-link completely off
  if (option === 'off') {
    userCfg.ANTI_LINK = 'false';
    try {
      await updateUserConfigInMongoDB(cfgNumber, userCfg);
      return reply('❎ Anti-Link disabled for this bot number.');
    } catch (e) {
      console.error('Failed to disable ANTI_LINK:', e);
      return reply('⚠️ Failed to update setting.');
    }
  }

  if (!["warn", "delete", "kick"].includes(option)) {
    return reply("❌ Invalid option.\nUse: warn | delete | kick | off");
  }

  // For warn/delete/kick: enable and set mode
  userCfg.ANTI_LINK = 'true';
  userCfg.ANTI_LINK_MODE = option;
  try {
    await updateUserConfigInMongoDB(cfgNumber, userCfg);
    return reply(`✅ Anti-Link set to *${option.toUpperCase()}* and enabled for this bot number.`);
  } catch (e) {
    console.error('Failed to update ANTI_LINK settings:', e);
    return reply('⚠️ Failed to update setting.');
  }
});

// ================= RESET WARN COMMAND =================

cmd({
  pattern: "resetwarn",
  desc: "Reset anti-link warns for a user",
  category: "settings",
}, async (conn, m, store, {
  from,
  args,
  isGroup,
  isAdmins,
  reply,
  botNumber
}) => {

  if (!isGroup) return reply("❌ This command works in groups only.");
  if (!isAdmins) return reply("❌ Only group admins can use this command.");

  let targetUser = null;

  // Method 1: Check if quoted message exists
  if (m.message?.extendedTextMessage?.contextInfo?.participant) {
    targetUser = m.message.extendedTextMessage.contextInfo.participant;
  }

  // Method 2: Check if @user is mentioned in args
  if (!targetUser && args.length > 0) {
    const mentionString = args[0];
    if (mentionString.startsWith("@")) {
      const userName = mentionString.substring(1);
      targetUser = userName + "@s.whatsapp.net";
    }
  }

  // Method 3: Check mentions in message context info
  if (!targetUser && m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
    const mentions = m.message.extendedTextMessage.contextInfo.mentionedJid;
    if (mentions.length > 0) {
      targetUser = mentions[0];
    }
  }

  if (!targetUser) {
    return reply("❌ Please quote a message or use .resetwarn @user\n\nExample: .resetwarn @2348025532222");
  }

  try {
    // Reset warns in MongoDB
    const result = await resetAntiLinkWarn(from, targetUser);
    
    const userName = targetUser.split("@")[0];
    return reply(`✅ Anti-link warns reset for @${userName}`);
  } catch (e) {
    console.error('Failed to reset warns:', e);
    return reply('⚠️ Failed to reset warns.');
  }
});

// ================= CORE LOGIC =================

cmd({
  on: "body"
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply,
  botNumber
}) => {

  try {
    if (!isGroup || isAdmins || !isBotAdmins) return;
    // Load per-number user config (use botNumber if provided, fallback to owner)
    const cfgNumber = (botNumber || config.OWNER_NUMBER || '').toString().replace(/[^0-9]/g, '');
    const userCfg = await getUserConfigFromMongoDB(cfgNumber).catch(() => null) || {};

    if (userCfg.ANTI_LINK !== "true") return;

    const containsLink = linkPatterns.some(p => p.test(body));
    if (!containsLink) return;

    const mode = (userCfg.ANTI_LINK_MODE || config.ANTI_LINK_MODE || 'warn');
    const user = sender.split("@")[0];

    // 🟡 WARN
    if (mode === "warn") {
      // Delete the message
      await conn.sendMessage(from, { delete: m.key });
      
      // Increment warn count in MongoDB
      const currentWarns = await incrementAntiLinkWarn(from, sender);

      // Check if threshold reached
      if (currentWarns >= WARN_THRESHOLD) {
        // Kick the user
        await conn.sendMessage(from, {
          text: `🚪 @${user} removed after ${WARN_THRESHOLD} link warnings.\n\nReason: Repeatedly sending links.`
        });
        await conn.groupParticipantsUpdate(from, [sender], "remove");
        await resetAntiLinkWarn(from, sender); // Reset counter
      } else {
        // Send warning message
        await conn.sendMessage(from, {
          text: `⚠️ Warning @${user}\nLinks are not allowed in this group.\n\n*[${currentWarns}/${WARN_THRESHOLD}]*`
        });
      }
      return;
    }

    // 🟠 DELETE
    if (mode === "delete") {
      await conn.sendMessage(from, { delete: m.key });
      return await conn.sendMessage(from, {
        text: `🗑️ Message deleted.\nLinks are not allowed here.`
      });
    }

    // 🔴 KICK
    if (mode === "kick") {
      await conn.sendMessage(from, { delete: m.key });

      await conn.sendMessage(from, {
        text: `🚪 @${user} removed.\nReason: Sending links.`
      });

      return await conn.groupParticipantsUpdate(from, [sender], "remove");
    }

  } catch (e) {
    console.error(e);
    reply("⚠️ Error while processing Anti-Link.");
  }
});
