const config = require('../config')
const axios = require('axios');
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')
const fs = require('fs');
var imgmsg = "*Give me a anime name !*"
var descgs = "It gives details of given anime name."
var cants = "I cant find this anime."

//====================================================================================
cmd({
    pattern: "garl",
    alias: ["imgloli"],
    react: '',
    desc: "Download anime loli images.",
    category: "anime",
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "😎",
            key: m.key
        }
    });
    try{

let res = await axios.get('https://api.lolicon.app/setu/v2?num=1&r18=0&tag=lolicon')
let wm = `😎 Random Garl image

> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*`
await conn.sendMessage(from, { image: { url: res.data.data[0].urls.original }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

//=====================================================================
cmd({
    pattern: "waifu",
    alias: ["imgwaifu"],
    desc: "Download anime waifu images.",
    category: "anime",
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "💫",
            key: m.key
        }
    });
    try{
let res = await axios.get('https://api.waifu.pics/nsfw/waifu')
let wm = `🚹 Random Waifu image

> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*`
await conn.sendMessage(from, { image: { url: res.data.url }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

//================================================================
cmd({
    pattern: "neko",
    alias: ["imgneko"],
    desc: "Download anime neko images.",
    category: "anime",
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "💫",
            key: m.key
        }
    });
    try{
let res = await axios.get('https://api.waifu.pics/nsfw/neko')
let wm = `🚹 Random neko image

> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*`
await conn.sendMessage(from, { image: { url: res.data.url  }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})
  
//=====================================================================
cmd({
    pattern: "megumin",
    alias: ["imgmegumin"],
    desc: "Download anime megumin images.",
    category: "anime",
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "💕",
            key: m.key
        }
    });
    try{
let res = await axios.get('https://api.waifu.pics/sfw/megumin')
let wm = `❤️‍🔥Random megumin image

> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*`
await conn.sendMessage(from, { image: { url: res.data.url }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

//================================================================
cmd({
    pattern: "maid",
    alias: ["imgmaid"],
    desc: "Download anime maid images.",
    category: "anime",
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "💫",
            key: m.key
        }
    });
    try{
let res = await axios.get('https://api.waifu.im/search/?included_tags=maid')
let wm = `😎 Random maid image

> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*`
await conn.sendMessage(from, { image: { url: res.data.images[0].url  }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

//=====================================================================

cmd({
    pattern: "awoo",
    alias: ["imgawoo"],
    desc: "Download anime awoo images.",
    category: "anime",
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "😎",
            key: m.key
        }
    });
    try{
let res = await axios.get('https://api.waifu.pics/sfw/awoo')
let wm = `😎 Random awoo image

> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*`
await conn.sendMessage(from, { image: { url: res.data.url }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

// Anmiex

cmd({
    pattern: "animegirl",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚🏻",
            key: m.key
        }
    });
    try {
        const apiUrl = `https://api.waifu.pics/nsfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.url }, caption: '*ANIME GIRL IMAGE* 🥳\n\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ* 🚹' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl1",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚🏻",
            key: m.key
        }
    });
    try {
        const apiUrl = `https://api.waifu.pics/nsfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl2",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚🏻",
            key: m.key
        }
    });
    try {
        const apiUrl = `https://api.waifu.pics/nsfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl3",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚🏻",
            key: m.key
        }
    });
    try {
        const apiUrl = `https://api.waifu.pics/nsfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl4",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚🏻",
            key: m.key
        }
    });
    try {
        const apiUrl = `https://api.waifu.pics/nsfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl5",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚🏻",
            key: m.key
        }
    });
    try {
        const apiUrl = `https://api.waifu.pics/nsfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});


//==========anime=====

cmd({
    pattern: "anime",
    desc: "anime the bot",
    category: "main",
    filename: __filename
},

async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "⛱️",
            key: m.key
        }
    });
    try{

let dec = `> PATRON-MD ANIME IMGS*`
await conn.sendMessage(from,{image:{url: `https://telegra.ph/file/b26f27aa5daaada031b90.jpg`},caption:dec},{quoted:mek});
await conn.sendMessage(from,{image:{url: `https://telegra.ph/file/51b44e4b086667361061b.jpg`},caption:dec},{quoted:mek});
await conn.sendMessage(from,{image:{url: `https://telegra.ph/file/7d165d73f914985542537.jpg`},caption:dec},{quoted:mek});
await conn.sendMessage(from,{image:{url: `https://telegra.ph/file/3d9732d2657d2d72dc102.jpg`},caption:dec},{quoted:mek});
await conn.sendMessage(from,{image:{url: `https://telegra.ph/file/8daf7e432a646f3ebe7eb.jpg`},caption:dec},{quoted:mek});
await conn.sendMessage(from,{image:{url: `https://telegra.ph/file/7514b18ea89da924e7496.jpg`},caption:dec},{quoted:mek});
await conn.sendMessage(from,{image:{url: `https://telegra.ph/file/ce9cb5acd2cec7693d76b.jpg`},caption:dec},{quoted:mek});

}catch(e){
console.log(e)
reply(`${e}`)
}
});


cmd({
    pattern: "anime1",
    desc: "Animal image.",
    category: "other",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚‍♀️",
            key: m.key
        }
    });
    try{

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/aD7t0Bc.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/PQO5wPN.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/5At1P4A.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/MjtH3Ha.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/QQW7VKy.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

}catch(e){
console.log(e)
reply(`${e}`)
}
})

cmd({
    pattern: "anime2",
    desc: "Animal image.",
    category: "other",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚‍♀️",
            key: m.key
        }
    });
    try{

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/0r1Bn88.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/2Xdpuov.png` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/0hx-3AP.png` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/q054x0_.png` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/4lyqRvd.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

}catch(e){
console.log(e)
reply(`${e}`)
}
})


cmd({
    pattern: "anime3",
    desc: "Animal image.",
    category: "other",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚‍♀️",
            key: m.key
        }
    });
    try{

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/gnpc_Lr.jpeg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/P6X-ph6.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/~p5W9~k.png` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/7Apu5C9.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/OTRfON6.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

}catch(e){
console.log(e)
reply(`${e}`)
}
})


cmd({
    pattern: "anime4",
    desc: "Animal image.",
    category: "other",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚‍♀️",
            key: m.key
        }
    });
    try{

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/aGgUm80.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/i~RQhRD.png` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/94LH-aU.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/V8hvqfK.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/lMiXE7j.png` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

}catch(e){
console.log(e)
reply(`${e}`)
}
})


cmd({
    pattern: "anime5",
    desc: "Animal image.",
    category: "other",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🧚‍♀️",
            key: m.key
        }
    });
    try{

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/-ABlAvr.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/HNEg0-Q.png` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/3x~ovC6.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/brv-GJu.jpg` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

await conn.sendMessage(from,{image :{ url: `https://i.waifu.pics/FWE8ggD.png` },caption: '> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴀᴛʀᴏɴ TᴇᴄʜＸ 🚹*' },{quoted:mek});

}catch(e){
console.log(e)
reply(`${e}`)
}
})

cmd({
    pattern: "dog",
    desc: "Fetch a random dog image.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    await conn.sendMessage(m.key.remoteJid, {
        react: {
            text: "🐶",
            key: m.key
        }
    });
    try {
        const apiUrl = `https://dog.ceo/api/breeds/image/random`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, { image: { url: data.message }, caption: '> *© Powered By PATRON-AI> ' }, { quoted: mek });
    } catch (e) {
        console.log(e); // ❯❯ Powered by PATRON-MD 👑
        reply(`єяяσя ƒєт¢нιηg ∂σg ιмαgє: ${e.message}`);
    }
});
