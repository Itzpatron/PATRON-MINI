const { cmd } = require('../command');
const config = require('../config');
const { getUserConfigFromMongoDB, updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "autoreact",
    alias: ["auto-react"],
    desc: "Enable or disable the autoreact feature",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("*📛 Only the owner can use this command!*");

        const status = args[0]?.toLowerCase();
        
        // Load per-number user config
        const cfgNumber = (botNumber || config.OWNER_NUMBER || '').toString().replace(/[^0-9]/g, '');
        const userCfg = await getUserConfigFromMongoDB(cfgNumber).catch(() => null) || {};
        
        if (!["on", "off"].includes(status)) {
            const currentStatus = (userCfg.AUTO_REACT === 'true') ? 'ON' : 'OFF';
            return reply(`*🫟 Current Status: ${currentStatus}*\n\n*Example: .auto-react on*`);
        }

        const newValue = status === "on" ? "true" : "false";
        userCfg.AUTO_REACT = newValue;
        
        // Update user config in MongoDB
        try {
            await updateUserConfigInMongoDB(cfgNumber, userCfg);
            await reply(`✅ *Auto-react feature has been turned ${status.toUpperCase()}.*`);
        } catch (e) {
            console.error('Failed to update AUTO_REACT:', e);
            await reply("❌ Error updating auto-react setting: " + e.message);
        }

    } catch (e) {
        console.error(e);
        await reply("❌ Error updating auto-react setting: " + e.message);
    }
});
