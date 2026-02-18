//---------------------------------------------------------------------------
//           KHAN-MD  
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
cmd({
  pattern: "newgc",
  category: "group",
  desc: "Create a new group using only the provided name.",
  filename: __filename,
}, async (conn, mek, m, { body, sender, reply }) => {
  try {
    // Remove command prefix and command name
    const groupName = body.replace(/^!newgc\s+/i, "").trim();

    if (!groupName) {
      return reply("Usage: .newgc group_name");
    }

    // Create group with only the sender added
    const group = await conn.groupCreate(groupName, [sender]);

    console.log("Created group with id:", group.id);

    const inviteLink = await conn.groupInviteCode(group.id);

    await conn.sendMessage(group.id, { text: "Group successfully created ✅" });

    m.reply(
      `✅ Group created successfully!\n\n` +
      `🔗 Invite Link:\nhttps://chat.whatsapp.com/${inviteLink}`
    );

  } catch (e) {
    console.error(e);
    return reply(
      `*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`
    );
  }
});
