const config = require('../config');
const { getUserConfigFromMongoDB } = require('./database');

/**
 * Gère les événements de participants de groupe (ajout ou suppression).
 * @param {import('@whiskeysockets/baileys').WASocket} conn Le socket de connexion Baileys.
 * @param {import('@whiskeysockets/baileys').GroupParticipantsUpdate} update L'objet de mise à jour des participants.
 * @param {string} botNumber Le numéro du bot pour charger sa configuration utilisateur.
 */
async function groupEvents(conn, update, botNumber) {
    try {
        // Load per-number user config from MongoDB
        const botNumberClean = (botNumber || config.OWNER_NUMBER || '').toString().replace(/[^0-9]/g, '');
        const userCfg = await getUserConfigFromMongoDB(botNumberClean).catch(() => null) || {};
        
        // Get group-specific settings, fallback to global settings for backwards compatibility
        const groupJid = update.id;
        
        // GROUP_SETTINGS is now a plain Object
        let groupSettings = {};
        if (userCfg.GROUP_SETTINGS && typeof userCfg.GROUP_SETTINGS === 'object') {
            groupSettings = userCfg.GROUP_SETTINGS[groupJid] || {};
        }
        
        const isWelcomeEnabled = groupSettings.WELCOME_ENABLE === 'true' || userCfg.WELCOME_ENABLE === 'true';
        const isGoodbyeEnabled = groupSettings.GOODBYE_ENABLE === 'true' || userCfg.GOODBYE_ENABLE === 'true';
        
        if (!isWelcomeEnabled && !isGoodbyeEnabled) return;

        const metadata = await conn.groupMetadata(update.id);
        const groupName = metadata.subject;
        const participants = update.participants;

        for (const participantJid of participants) {
            const username = `@${participantJid.split('@')[0]}`;
            
            // 1. GESTION DU MESSAGE DE BIENVENUE (ADD)
            if (update.action === 'add' && isWelcomeEnabled) {
                const defaultWelcomeMsg = 
`*╭─「 WELCOME TO THE CREW 」─◇*
*│*
*│* *🌟 ɴᴇᴡ ᴍᴇᴍʙᴇʀ ᴀʀʀɪᴠᴇᴅ!*
*│* *👋 ʜᴇʟʟᴏ:* ${username}
*│* *🏰 ɢʀᴏᴜᴘ:* ${groupName}
*│* *📝 ʀᴜʟᴇs:* Please read the rules in the group description.
*│*
*╰────────────────────○*`;

                await conn.sendMessage(groupJid, { 
                    text: defaultWelcomeMsg, 
                    mentions: [participantJid] 
                });
            }
            
            // 2. GESTION DU MESSAGE D'AU REVOIR (REMOVE)
            else if (update.action === 'remove' && isGoodbyeEnabled) {
                const defaultGoodbyeMsg = 
`*╭─「 FAREWELL LEGEND 」─◇*
*│*
*│* *😔 ᴍᴇᴍʙᴇʀ ʟᴇғᴛ ᴛʜᴇ ᴄʜᴀᴛ...*
*│* *👤 ʙʏᴇ ʙʏᴇ:* ${username}
*│* *📢 ᴍsɢ:* We hope to see you again soon!
*│*
*╰────────────────────○*`;

                await conn.sendMessage(groupJid, { 
                    text: defaultGoodbyeMsg, 
                    mentions: [participantJid] 
                });
            }
        }
    } catch (e) {
        console.error("Group Events Error:", e.message);
    }
}

module.exports = {
    groupEvents
};
                                                      
