const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

module.exports = {
    // ===========================================================
    // 1. CONFIGURATION DE BASE (Session & Database)
    // ===========================================================
    SESSION_ID: process.env.SESSION_ID || "MINI BOT", 
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://patron:maximus0000.@cluster0.xjhmhq5.mongodb.net/myDatabase?retryWrites=true&w=majority',
    
    // ===========================================================
    // 2. INFORMATIONS DU BOT
    // ===========================================================
    PREFIX: process.env.PREFIX || '.',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '+2348133729715', // Mettez votre numéro ici
    BOT_NAME: "ᴘᴀᴛʀᴏɴ-ᴍɪɴɪ",
    BOT_FOOTER: '👑 BY :❯ ᴘᴀᴛʀᴏɴ-ᴍɪɴɪ 👑',
    OWNER_NAME: 'PATRON',
    // Mode de travail : public, private, group, inbox
    WORK_TYPE: process.env.WORK_TYPE || "public", 
    
    // ===========================================================
    // 3. FONCTIONNALITÉS AUTOMATIQUES (STATUTS)
    // ===========================================================
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || 'true', // Voir automatiquement les statuts
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || 'false', // Liker automatiquement les statuts
    AUTO_LIKE_EMOJI: ['❤️', '🌹', '✨', '🥰', '🌹', '😍', '💞', '💕', '☺️', '🤗'], 
    
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || 'false', // Répondre aux statuts
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || '🤗', // Message de réponse
    
    // ===========================================================
    // 4. FONCTIONNALITÉS DE CHAT & PRÉSENCE
    // ===========================================================
    READ_MESSAGE: process.env.READ_MESSAGE || 'false', // Marquer les messages comme lus (Blue Tick)
    AUTO_TYPING: process.env.AUTO_TYPING || 'false', // Afficher "Écrit..."
    AUTO_RECORDING: process.env.AUTO_RECORDING || 'false', // Afficher "Enregistre..."
    
    // ===========================================================
    // 5. GESTION DES GROUPES
    // ===========================================================
    WELCOME_ENABLE: process.env.WELCOME_ENABLE || 'false',
    GOODBYE_ENABLE: process.env.GOODBYE_ENABLE || 'false',
    WELCOME_MSG: process.env.WELCOME_MSG || null, 
    GOODBYE_MSG: process.env.GOODBYE_MSG || null, 
    WELCOME_IMAGE: process.env.WELCOME_IMAGE || null, 
    GOODBYE_IMAGE: process.env.GOODBYE_IMAGE || null,
    
    GROUP_INVITE_LINK: process.env.GROUP_INVITE_LINK || 'https://chat.whatsapp.com/J8agDmXcDB8Hnz192dLGF6?mode=gi_t',
    
    // ===========================================================
    // 6. SÉCURITÉ & ANTI-CALL
    // ===========================================================
    ANTI_CALL: process.env.ANTI_CALL || 'false', // Rejeter les appels
    REJECT_MSG: process.env.REJECT_MSG || '*CALL LATER PLEASE ☺️🌹*',
    
    // ===========================================================
    // 7. IMAGES & LIENS
    // ===========================================================
    IMAGE_PATH: 'https://files.catbox.moe/e71nan.png',
    CHANNEL_LINK: 'https://whatsapp.com/channel/0029Val0s0rIt5rsIDPCoD2q',
    
    // ===========================================================
    // 8. EXTERNAL API (Optionnel)
    // ===========================================================
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '7214172448:AAHGqSgaw-zGVPZWvl8msDOVDhln-9kExas',
    TELEGRAM_CHAT_ID: process.env.  TELEGRAM_CHAT_ID || '+923078071982'
    
};
  
