const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ai",
    alias: ["bot", "dj", "gpt", "gpt4", "bing"],
    desc: "Chat with an AI model",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { args, q, reply, react }) => {
    try {
        if (!q)
            return reply("Please provide a message for the AI.\nExample: `.ai Hello`");

        const apiUrl = `https://apis.prexzyvilla.site/ai/ai4chat?prompt=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        // Validate response properly
        if (!data || !data.status || !data.data?.response) {
            await react("❌");
            return reply("AI failed to respond. Please try again later.");
        }

        const aiResponse = data.data.response;

        await reply(`🤖 *AI Response:*\n\n${aiResponse}`);
        await react("✅");

    } catch (e) {
        console.error("Error in AI command:", e);
        await react("❌");
        return reply("An error occurred while communicating with the AI.");
    }
});

cmd({
    pattern: "openai",
    alias: ["chatgpt", "gpt3", "open-gpt"],
    desc: "Chat with OpenAI",
    category: "ai",
    react: "🧠",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q)
            return reply("Please provide a message for OpenAI.\nExample: `.openai Hello`");

        const apiUrl = `https://apis.prexzyvilla.site/ai/copilot?text=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        // Validate response properly
        if (!data || !data.status || !data.text) {
            await react("❌");
            return reply("OpenAI failed to respond. Please try again later.");
        }

        const aiResponse = data.text;

        await reply(`🧠 *OpenAI Response:*\n\n${aiResponse}`);
        await react("✅");

    } catch (e) {
        console.error("Error in OpenAI command:", e);
        await react("❌");
        return reply("An error occurred while communicating with OpenAI.");
    }
});

cmd({
    pattern: "deepseek",
    alias: ["deep", "seekai"],
    desc: "Chat with DeepSeek AI",
    category: "ai",
    react: "🧠",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q)
            return reply("Please provide a message for DeepSeek AI.\nExample: `.deepseek Hello`");

        const apiUrl = `https://apis.prexzyvilla.site/ai/chat--cf-deepseek-ai-deepseek-r1-distill-qwen-32b?prompt=${encodeURIComponent(q)}`;
        
        const { data } = await axios.get(apiUrl);

        // Validate response properly
        if (!data || !data.status || !data.response) {
            await react("❌");
            return reply("DeepSeek AI failed to respond. Please try again later.");
        }

        const aiResponse = data.response.trim();

        await reply(`🧠 *DeepSeek AI Response:*\n\n${aiResponse}`);
        await react("✅");

    } catch (e) {
        console.error("Error in DeepSeek AI command:", e);
        await react("❌");
        return reply("An error occurred while communicating with DeepSeek AI.");
    }
});


