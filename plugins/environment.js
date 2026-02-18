//---------------------------------------------------------------------------
//           patrom
//---------------------------------------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE ⚠️  
//---------------------------------------------------------------------------
const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');
const { getUserConfigFromMongoDB, updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: "setprefix",
    alias: ["prefix"],
    react: "🔧",
    desc: "Change the bot's command prefix.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    const newPrefix = args[0]; // Get the new prefix from the command arguments
    if (!newPrefix) return reply("❌ Please provide a new prefix. Example: `.setprefix !`");

    // Update the prefix in memory
    config.PREFIX = newPrefix;

    return reply(`✅ Prefix successfully changed to *${newPrefix}*`);
});

cmd({
    pattern: "auto-typing",
    description: "Enable or disable auto-typing feature (per session).",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { args, isCreator, reply }) => {

    if (!isCreator) {
        return reply("*📛 Only the owner can use this command!*");
    }

    const status = args[0]?.toLowerCase();

    if (!["on", "off"].includes(status)) {
        return reply("*🫟 Example: .auto-typing on*");
    }

    const isEnabled = status === "on";

    // Resolve session number
    let sanitizedNumber = null;

    if (conn?.user?.id) {
        sanitizedNumber = conn.user.id
            .split(":")[0]
            .replace(/[^0-9]/g, "");
    }

    if (!sanitizedNumber) {
        return reply(
            `Auto typing ${status}, but session number could not be resolved.`
        );
    }

    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);

        await updateUserConfigInMongoDB(sanitizedNumber, {
            ...userCfg,
            AUTO_TYPING: isEnabled
        });

        return reply(`✅ Auto typing ${status} for ${sanitizedNumber}.`);

    } catch (err) {
        console.error("Failed to update AUTO_TYPING:", err);
        return reply(
            `Auto typing ${status}, but failed to update user config.`
        );
    }
});

//--------------------------------------------
//  AUTO_RECORDING COMMANDS (also updates per-number userConfig)
//--------------------------------------------
cmd({
    pattern: "auto-recording",
    alias: ["autorecoding"],
    description: "Enable or disable auto-recording feature (global + per-session). Usage: .auto-recording on [number]",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
        return reply("*🫟 ᴇxᴀᴍᴘʟᴇ: .ᴀᴜᴛᴏ-ʀᴇᴄᴏʀᴅɪɴɢ ᴏɴ [optional-number]*");
    }

    // 1) Update global in-memory config so plugins respond immediately
    config.AUTO_RECORDING = status === "on" ? "true" : "false";
    try {
        if (status === "on") await conn.sendPresenceUpdate("recording", from);
        else await conn.sendPresenceUpdate("available", from);
    } catch (e) { /* ignore presence errors */ }

    // 2) Determine target number for per-user config (optional second arg)
    let target = args[1];
    let sanitizedNumber = null;

    if (target) {
        sanitizedNumber = target.replace(/[^0-9]/g, '');
    } else if (conn && conn.user && conn.user.id) {
        // conn.user.id looks like '1234567890:1@s.whatsapp.net' — take the number part
        sanitizedNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');
    }

    if (!sanitizedNumber) {
        // Global updated but cannot resolve a session number to update in DB
        return reply(status === 'on' ? "Auto recording enabled globally. (per-user not updated — bot number unknown)" : "Auto recording disabled globally. (per-user not updated — bot number unknown)");
    }

    // 3) Update per-user config in MongoDB
    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);
        userCfg.AUTO_RECORDING = status === 'on' ? 'true' : 'false';
        await updateUserConfigInMongoDB(sanitizedNumber, userCfg);
        return reply(`Auto recording ${status} for ${sanitizedNumber}.`);
    } catch (err) {
        console.error('Failed to update userConfig for auto-recording:', err);
        return reply(status === 'on' ? "Auto recording enabled globally, but failed to update userConfig." : "Auto recording disabled globally, but failed to update userConfig.");
    }
});
//--------------------------------------------
// ANTI_CALL COMMANDS
//--------------------------------------------
cmd({
    pattern: "anti-call",
    alias: ["anticall"],
    desc: "Enable or disable anti-call (auto block callers)",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { args, isCreator, reply }) => {

    if (!isCreator) {
        return reply("*📛 Only the owner can use this command!*");
    }

    const status = args[0]?.toLowerCase();

    if (!["on", "off"].includes(status)) {
        return reply("*🫟 Example: .anti-call on*");
    }

    const isEnabled = status === "on";

    // Resolve session number
    let sanitizedNumber = null;

    if (conn?.user?.id) {
        sanitizedNumber = conn.user.id
            .split(":")[0]
            .replace(/[^0-9]/g, "");
    }

    if (!sanitizedNumber) {
        return reply(
            `Anti-call ${status}, but session number could not be resolved.`
        );
    }

    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);

        await updateUserConfigInMongoDB(sanitizedNumber, {
            ...userCfg,
            ANTI_CALL: isEnabled
        });

        return reply(`✅ Anti-call ${status} for ${sanitizedNumber}.`);

    } catch (err) {
        console.error("Failed to update ANTI_CALL:", err);
        return reply(
            `Anti-call ${status}, but failed to update user config.`
        );
    }
});

//--------------------------------------------
// AUTO_VIEW_STATUS COMMANDS
//--------------------------------------------
cmd({
    pattern: "auto-seen",
    alias: ["autostatusview"],
    desc: "Enable or disable auto-viewing of statuses (per session only)",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {

    if (!isCreator) {
        return reply("*📛 Only the owner can use this command!*");
    }

    const status = args[0]?.toLowerCase();

    if (!["on", "off"].includes(status)) {
        return reply("*🫟 Example: .auto-seen on*");
    }

    const isEnabled = status === "on";

    // Resolve session number
    let sanitizedNumber = null;

    if (args[1]) {
        sanitizedNumber = args[1].replace(/[^0-9]/g, "");
    } else if (conn?.user?.id) {
        sanitizedNumber = conn.user.id
            .split(":")[0]
            .replace(/[^0-9]/g, "");
    }

    if (!sanitizedNumber) {
        return reply(
            `Auto status viewing ${status}, but session number could not be resolved.`
        );
    }

    // Update only userConfig in MongoDB
    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);

        await updateUserConfigInMongoDB(sanitizedNumber, {
            ...userCfg,
            AUTO_VIEW_STATUS: isEnabled
        });

        return reply(`✅ Auto status viewing ${status} for ${sanitizedNumber}.`);

    } catch (err) {
        console.error("Failed to update AUTO_VIEW_STATUS:", err);
        return reply(
            `Auto status viewing ${status}, but failed to update user config.`
        );
    }
});

//--------------------------------------------
// AUTO_LIKE_STATUS COMMANDS
//--------------------------------------------
cmd({
    pattern: "status-react",
    alias: ["statusreaction"],
    desc: "Enable or disable auto-reaction to statuses (per session)",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { args, isCreator, reply }) => {

    if (!isCreator) {
        return reply("*📛 Only the owner can use this command!*");
    }

    const status = args[0]?.toLowerCase();

    if (!["on", "off"].includes(status)) {
        return reply("_Example: .status-react on_");
    }

    const isEnabled = status === "on";

    // Resolve session number
    let sanitizedNumber = null;

    if (conn?.user?.id) {
        sanitizedNumber = conn.user.id
            .split(":")[0]
            .replace(/[^0-9]/g, "");
    }

    if (!sanitizedNumber) {
        return reply(
            `Auto status reaction ${status}, but session number could not be resolved.`
        );
    }

    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);

        await updateUserConfigInMongoDB(sanitizedNumber, {
            ...userCfg,
            AUTO_LIKE_STATUS: isEnabled
        });

        return reply(`✅ Auto status reaction ${status} for ${sanitizedNumber}.`);

    } catch (err) {
        console.error("Failed to update AUTO_LIKE_STATUS:", err);
        return reply(
            `Auto status reaction ${status}, but failed to update user config.`
        );
    }
});


//--------------------------------------------
//  READ-MESSAGE COMMANDS
//--------------------------------------------
cmd({
    pattern: "read-message",
    alias: ["autoread"],
    desc: "Enable or disable auto read messages (per session)",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { args, isCreator, reply }) => {

    if (!isCreator) {
        return reply("*📛 Only the owner can use this command!*");
    }

    const status = args[0]?.toLowerCase();

    if (!["on", "off"].includes(status)) {
        return reply("_Example: .read-message on_");
    }

    const isEnabled = status === "on";

    // Resolve session number
    let sanitizedNumber = null;

    if (conn?.user?.id) {
        sanitizedNumber = conn.user.id
            .split(":")[0]
            .replace(/[^0-9]/g, "");
    }

    if (!sanitizedNumber) {
        return reply(
            `Auto read ${status}, but session number could not be resolved.`
        );
    }

    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);

        await updateUserConfigInMongoDB(sanitizedNumber, {
            ...userCfg,
            READ_MESSAGE: isEnabled
        });

        return reply(`✅ Auto read ${status} for ${sanitizedNumber}.`);

    } catch (err) {
        console.error("Failed to update READ_MESSAGE:", err);
        return reply(
            `Auto read ${status}, but failed to update user config.`
        );
    }
});

//--------------------------------------------
//  AUTO-REPLY COMMANDS
//--------------------------------------------
cmd({
    pattern: "auto-reply",
    alias: ["autoreply"],
    desc: "enable or disable auto-reply.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const status = args[0]?.toLowerCase();
    // Check the argument for enabling or disabling the anticall feature
    if (args[0] === "on") {
        config.AUTO_REPLY = "true";
        return reply("*auto-reply  is now enabled.*");
    } else if (args[0] === "off") {
        config.AUTO_REPLY = "false";
        return reply("auto-reply feature is now disabled.");
    } else {
        return reply(`*🫟 ᴇxᴀᴍᴘʟᴇ: . ᴀᴜᴛᴏ-ʀᴇᴘʟʏ ᴏɴ*`);
    }
});

//--------------------------------------------
//  AUTO_STATUS_REPLY COMMANDS
//--------------------------------------------
cmd({
    pattern: "status-reply",
    alias: ["autostatusreply"],
    desc: "Enable or disable auto status reply (per session)",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { args, isCreator, reply }) => {

    if (!isCreator) {
        return reply("*📛 Only the owner can use this command!*");
    }

    const status = args[0]?.toLowerCase();

    if (!["on", "off"].includes(status)) {
        return reply("*🫟 Example: .status-reply on*");
    }

    const isEnabled = status === "on";

    // Resolve session number
    let sanitizedNumber = null;

    if (conn?.user?.id) {
        sanitizedNumber = conn.user.id
            .split(":")[0]
            .replace(/[^0-9]/g, "");
    }

    if (!sanitizedNumber) {
        return reply(
            `Auto status reply ${status}, but session number could not be resolved.`
        );
    }

    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);

        await updateUserConfigInMongoDB(sanitizedNumber, {
            ...userCfg,
            AUTO_STATUS_REPLY: isEnabled
        });

        return reply(`✅ Auto status reply ${status} for ${sanitizedNumber}.`);

    } catch (err) {
        console.error("Failed to update AUTO_STATUS_REPLY:", err);
        return reply(
            `Auto status reply ${status}, but failed to update user config.`
        );
    }
});

//--------------------------------------------
//  WELCOME MESSAGE COMMANDS
//--------------------------------------------
cmd({
    pattern: "welcome",
    desc: "Enable or disable welcome messages for new members",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {

    if (!isCreator) {
        return reply("*📛 Only the owner can use this command!*");
    }

    const status = args[0]?.toLowerCase();

    if (!["on", "off"].includes(status)) {
        return reply("_Example: .welcome on_");
    }

    const isEnabled = status === "on";

    // Resolve session number
    let sanitizedNumber = null;

    if (conn?.user?.id) {
        sanitizedNumber = conn.user.id
            .split(":")[0]
            .replace(/[^0-9]/g, "");
    }

    if (!sanitizedNumber) {
        return reply(
            `Welcome messages ${status}, but session number could not be resolved.`
        );
    }

    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);
        
        // Initialize group settings if not exists
        if (!userCfg.GROUP_SETTINGS) {
            userCfg.GROUP_SETTINGS = {};
        }
        
        // Store welcome setting per group
        userCfg.GROUP_SETTINGS[from] = {
            ...(userCfg.GROUP_SETTINGS[from] || {}),
            WELCOME_ENABLE: isEnabled ? 'true' : 'false'
        };

        await updateUserConfigInMongoDB(sanitizedNumber, userCfg);

        return reply(`✅ Welcome messages ${status} for this group.`);

    } catch (err) {
        console.error("Failed to update WELCOME_ENABLE:", err);
        return reply(
            `Welcome messages ${status}, but failed to update user config.`
        );
    }
});

//--------------------------------------------
//  GOODBYE MESSAGE COMMANDS
//--------------------------------------------
cmd({
    pattern: "goodbye",
    desc: "Enable or disable goodbye messages for departing members",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {

    if (!isCreator) {
        return reply("*📛 Only the owner can use this command!*");
    }

    const status = args[0]?.toLowerCase();

    if (!["on", "off"].includes(status)) {
        return reply("_Example: .goodbye on_");
    }

    const isEnabled = status === "on";

    // Resolve session number
    let sanitizedNumber = null;

    if (conn?.user?.id) {
        sanitizedNumber = conn.user.id
            .split(":")[0]
            .replace(/[^0-9]/g, "");
    }

    if (!sanitizedNumber) {
        return reply(
            `Goodbye messages ${status}, but session number could not be resolved.`
        );
    }

    try {
        const userCfg = await getUserConfigFromMongoDB(sanitizedNumber);
        
        // Initialize group settings if not exists
        if (!userCfg.GROUP_SETTINGS) {
            userCfg.GROUP_SETTINGS = {};
        }
        
        // Store goodbye setting per group
        userCfg.GROUP_SETTINGS[from] = {
            ...(userCfg.GROUP_SETTINGS[from] || {}),
            GOODBYE_ENABLE: isEnabled ? 'true' : 'false'
        };

        await updateUserConfigInMongoDB(sanitizedNumber, userCfg);

        return reply(`✅ Goodbye messages ${status} for this group.`);

    } catch (err) {
        console.error("Failed to update GOODBYE_ENABLE:", err);
        return reply(
            `Goodbye messages ${status}, but failed to update user config.`
        );
    }
});