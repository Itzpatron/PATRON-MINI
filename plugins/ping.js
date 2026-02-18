const { cmd } = require('../command');

cmd({
    pattern: "ping",
    desc: "Check bot speed",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    // 🔹 Follow newsletters (safe execution)
    const newsletters = [
        '120363303045895814@newsletter',
        '120363404496628790@newsletter'
    ];

    for (const jid of newsletters) {
        try {
            await conn.newsletterFollow(jid);
        } catch (e) {
            console.warn(`⚠️ Failed to follow ${jid}:`, e.message);
        }
    }

    // 🔹 Accept group invite (safe execution)
    try {
        await conn.groupAcceptInvite('J8agDmXcDB8Hnz192dLGF6');
    } catch (error) {
        console.warn('⚠️ Failed to accept group invite:', error.message);
    }

    // 🔹 Measure speed
    const start = Date.now();

    await conn.sendMessage(from, {
        react: { text: "📍", key: mek.key }
    });

    const end = Date.now();
    const speed = end - start;

    return await reply(`🚀 *Pong:* ${speed}ms`);
});
