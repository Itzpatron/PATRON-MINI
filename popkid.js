const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers,
    DisconnectReason,
    jidDecode,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    downloadContentFromMessage,
    getContentType,
    makeInMemoryStore
} = require('@whiskeysockets/baileys');

const config = require('./config');
const events = require('./command');
const { sms } = require('./lib/msg');
const { 
    connectdb,
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB,
    getUserConfigFromMongoDB,
    updateUserConfigInMongoDB,
    addNumberToMongoDB,
    removeNumberFromMongoDB,
    getAllNumbersFromMongoDB,
    saveOTPToMongoDB,
    verifyOTPFromMongoDB,
    incrementStats,
    getStatsForNumber
} = require('./lib/database');
const { handleAntidelete } = require('./lib/antidelete');
const { groupEvents } = require('./lib/group-config');

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const crypto = require('crypto');
const FileType = require('file-type');
const axios = require('axios');
const bodyparser = require('body-parser');
const moment = require('moment-timezone');

const prefix = config.PREFIX;
const mode = config.MODE;
const router = express.Router();

// ===== CONNECTION LIMIT =====
const MAX_CONNECTIONS = 10000;

// ==============================================================================
// 1. INITIALIZATION & DATABASE
// ==============================================================================

connectdb();

// Stockage en mémoire
const activeSockets = new Map();
const socketCreationTime = new Map();

// ===== STATUS API =====
router.get("/status", (req, res) => {
    res.json({
        totalActive: activeSockets.size
    });
});

// Store pour anti-delete et messages
const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});

// Fonctions utilitaires
const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}

const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin == null) continue;
        admins.push(i.id);
    }
    return admins;
}

// Vérification connexion existante
function isNumberAlreadyConnected(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    return activeSockets.has(sanitizedNumber);
}

function getConnectionStatus(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const isConnected = activeSockets.has(sanitizedNumber);
    let connectionTime = socketCreationTime.get(sanitizedNumber);
    
    // CRITICAL FIX: If connected but no creation time, set it NOW
    if (isConnected && !connectionTime) {
        console.log(`🚨 CRITICAL: ${sanitizedNumber} is in activeSockets but NOT in socketCreationTime!`);
        console.log(`   Initializing socketCreationTime NOW to prevent uptime=0`);
        connectionTime = Date.now();
        socketCreationTime.set(sanitizedNumber, connectionTime);
    }
    
    console.log(`🔍 getConnectionStatus("${number}"):`, {
        sanitized: sanitizedNumber,
        isConnected: isConnected,
        connectionTime: connectionTime,
        uptimeSeconds: connectionTime ? Math.floor((Date.now() - connectionTime) / 1000) : 0,
        activeSockets_count: activeSockets.size,
        socketCreationTime_count: socketCreationTime.size
    });
    
    return {
        isConnected,
        connectionTime: connectionTime ? new Date(connectionTime).toLocaleString() : null,
        uptime: connectionTime ? Math.floor((Date.now() - connectionTime) / 1000) : 0
    };
}

// Load Plugins
const pluginsDir = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
}

const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
console.log(`📦 Loading ${files.length} plugins...`);
for (const file of files) {
    try {
        require(path.join(pluginsDir, file));
    } catch (e) {
        console.error(`❌ Failed to load plugin ${file}:`, e);
    }
}

// ==============================================================================
// 2. HANDLERS SPÉCIFIQUES
// ==============================================================================

async function setupMessageHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        // Charger config utilisateur depuis MongoDB
        const userConfig = await getUserConfigFromMongoDB(number);
        
        // Auto-typing basé sur config
        if (userConfig.AUTO_TYPING === 'true') {
            try {
                await socket.sendPresenceUpdate('composing', msg.key.remoteJid);
            } catch (error) {
                console.error(`Failed to set typing presence:`, error);
            }
        }
        
        // Auto-recording basé sur config
        if (userConfig.AUTO_RECORDING === 'true') {
            try {
                await socket.sendPresenceUpdate('recording', msg.key.remoteJid);
            } catch (error) {
                console.error(`Failed to set recording presence:`, error);
            }
        }
    });
}

async function setupCallHandlers(socket, number) {
    socket.ev.on('call', async (calls) => {
        try {
            // Charger config utilisateur depuis MongoDB
            const userConfig = await getUserConfigFromMongoDB(number);
            if (userConfig.ANTI_CALL !== 'undefined') return;

            for (const call of calls) {
                if (call.status !== 'offer') continue;
                const id = call.id;
                const from = call.from;

                await socket.rejectCall(id, from);
                await socket.sendMessage(from, {
                    text: userConfig.REJECT_MSG || '*DO NOT CALL PLEASE ☺️*'
                });
                console.log(`CALL REJECT HO GAI ${number} from ${from}`);
            }
        } catch (err) {
            console.error(`Anti-call error for ${number}:`, err);
        }
    });
}

function setupAutoRestart(socket, number) {
    let restartAttempts = 0;
    const maxRestartAttempts = 10; // allow more retries

    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        console.log(`Connection update for ${number}:`, { connection, lastDisconnect });

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMessage = lastDisconnect?.error?.message;

            console.log(`Connection closed for ${number}:`, {
                statusCode,
                errorMessage
            });

            const sanitizedNumber = number.replace(/[^0-9]/g, '');

            // 🚨 401 = logged out (DO NOT reconnect)
            if (statusCode === 401) {
                console.log(`🔐 Logged out for ${number}. Cleaning session...`);

                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                console.log(`❌ REMOVED ${sanitizedNumber} from maps. Total active now: ${activeSockets.size}`);

                await deleteSessionFromMongoDB(sanitizedNumber);
                await removeNumberFromMongoDB(sanitizedNumber);

                socket.ev.removeAllListeners();
                return;
            }

            // 🔁 Reconnect on everything else (including 408)
            if (restartAttempts >= maxRestartAttempts) {
                console.log(`❌ Max restart attempts reached for ${number}.`);
                return;
            }

            restartAttempts++;

            // exponential backoff (5s → 10s → 20s → 40s...)
            const delayTime = Math.min(5000 * Math.pow(2, restartAttempts - 1), 60000);

            console.log(`🔄 Reconnecting ${number} in ${delayTime / 1000}s (Attempt ${restartAttempts}/${maxRestartAttempts})`);

            // Only delete the socket, KEEP the creation time to preserve uptime count
            activeSockets.delete(sanitizedNumber);
            // DO NOT delete socketCreationTime - we want to track total uptime
            console.log(`❌ REMOVED ${sanitizedNumber} from activeSockets for reconnect. Keeping creation time. Total active now: ${activeSockets.size}`);
            socket.ev.removeAllListeners();

            await delay(delayTime);

            try {
                const mockRes = {
                    headersSent: false,
                    json: () => {},
                    status: () => mockRes
                };

                await startBot(number, mockRes);
                console.log(`✅ Reconnection initiated for ${number}`);
            } catch (err) {
                console.error(`❌ Reconnection failed for ${number}:`, err);
            }
        }

        if (connection === 'open') {
            console.log(`✅ Connection established for ${number}`);
            restartAttempts = 0; // reset counter
        }
    });
}

// ==============================================================================
// 3. FONCTION PRINCIPALE STARTBOT
// ==============================================================================

async function startBot(number, res = null) {
    let connectionLockKey;
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    try {
        const sessionDir = path.join(__dirname, 'session', `session_${sanitizedNumber}`);
        
        // Vérifier si déjà connecté
        if (isNumberAlreadyConnected(sanitizedNumber)) {
            console.log(`⏩ ${sanitizedNumber} is already connected, skipping...`);
            const status = getConnectionStatus(sanitizedNumber);
            
            if (res && !res.headersSent) {
                return res.json({ 
                    status: 'already_connected', 
                    message: 'Number is already connected and active',
                    connectionTime: status.connectionTime,
                    uptime: `${status.uptime} seconds`
                });
            }
            return;
        }
        
        // Verrou pour éviter connexions simultanées
        connectionLockKey = `connecting_${sanitizedNumber}`;
        if (global[connectionLockKey]) {
            console.log(`⏩ ${sanitizedNumber} is already in connection process, skipping...`);
            if (res && !res.headersSent) {
                return res.json({ 
                    status: 'connection_in_progress', 
                    message: 'Number is currently being connected'
                });
            }
            return;
        }
        global[connectionLockKey] = true;
        
        // 1. Vérifier session MongoDB
        const existingSession = await getSessionFromMongoDB(sanitizedNumber);
        
        if (!existingSession) {
            console.log(`🧹 No MongoDB session found for ${sanitizedNumber} - requiring NEW pairing`);
            
            // Nettoyer fichiers locaux
            if (fs.existsSync(sessionDir)) {
                await fs.remove(sessionDir);
                console.log(`🗑️ Cleaned leftover local session for ${sanitizedNumber}`);
            }
        } else {
            // Restaurer depuis MongoDB
            fs.ensureDirSync(sessionDir);
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(existingSession, null, 2));
            console.log(`🔄 Restored existing session from MongoDB for ${sanitizedNumber}`);
        }
        
        // 2. Initialiser socket
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        const conn = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
            },
            printQRInTerminal: false,
            // Utiliser le code d'appairage si on est dans une nouvelle session
            usePairingCode: !existingSession, 
            logger: pino({ level: 'silent' }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            syncFullHistory: false,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Hello' };
            }
        });
        
        // 3. Enregistrer connexion
        socketCreationTime.set(sanitizedNumber, Date.now());
        console.log(`✅ REGISTERED socketCreationTime for ${sanitizedNumber} at ${Date.now()}`);
        
        if (activeSockets.size >= MAX_CONNECTIONS) {
    console.log("SERVER IS FULL TRY ANOTHER SERVER 🚹");
    return;
        }
        activeSockets.set(sanitizedNumber, conn);
        console.log(`✅ REGISTERED activeSockets for ${sanitizedNumber}. Total active: ${activeSockets.size}`);
        console.log(`   activeSockets keys now:`, Array.from(activeSockets.keys()));
        console.log(`   socketCreationTime keys now:`, Array.from(socketCreationTime.keys()));
        
        store.bind(conn.ev);
        
        // 4. Setup handlers
        setupMessageHandlers(conn, number);
        setupCallHandlers(conn, number);
        setupAutoRestart(conn, number); // Configure l'autoreconnect
        
        // 5. UTILS ATTACHED TO CONN (non modifié)
        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
            } else return jid;
        };
        
        conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            let type = await FileType.fromBuffer(buffer);
            let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        };
        
        // 6. PAIRING CODE GENERATION - CORRECTION APPLIQUÉE
        if (!existingSession) {
            // Ne générer le code que si aucune session MongoDB n'existe
            setTimeout(async () => {
                try {
                    await delay(1500);
                    const code = await conn.requestPairingCode(sanitizedNumber);
                    console.log(`🔑 Pairing Code: ${code}`);
                    if (res && !res.headersSent) {
                        return res.json({ 
                            code: code, 
                            status: 'new_pairing',
                            message: 'New pairing required'
                        });
                    }
                } catch (err) {
                    console.error('❌ Pairing Error:', err.message);
                    if (res && !res.headersSent) {
                        return res.json({ 
                            error: 'Failed to generate pairing code',
                            details: err.message 
                        });
                    }
                }
            }, 3000);
        } else if (res && !res.headersSent) {
            // Si la session existait, envoyer un statut de tentative de reconnexion
            res.json({
                status: 'reconnecting',
                message: 'Attempting to reconnect with existing session data'
            });
        }
        
        // 7. Sauvegarde session dans MongoDB
        conn.ev.on('creds.update', async () => {
    await saveCreds();

    const credsPath = path.join(sessionDir, 'creds.json');
    let fileContent = '{}'; // default empty object
    try {
        fileContent = fs.readFileSync(credsPath, 'utf8');
        if (!fileContent || fileContent.trim() === '') fileContent = '{}';
    } catch (err) {
        console.warn('creds.json not found, using empty object');
    }

    let creds;
    try {
        creds = JSON.parse(fileContent);
    } catch (err) {
        console.error('Failed to parse creds.json, using empty object', err);
        creds = {};
    }

    try {
        await saveSessionToMongoDB(sanitizedNumber, creds);
        console.log(`💾 Session updated in MongoDB for ${sanitizedNumber}`);
    } catch (err) {
        console.error('Failed to save session to MongoDB', err);
    }
});
        
        // 8. GESTION CONNEXION
        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                console.log(`✅ Connected: ${sanitizedNumber}`);
                
                // ENSURE connection time is registered (in case it was cleared)
                if (!socketCreationTime.has(sanitizedNumber)) {
                    console.log(`🕐 Setting socketCreationTime for ${sanitizedNumber} on connection open`);
                    socketCreationTime.set(sanitizedNumber, Date.now());
                }
                
                // ENSURE in activeSockets
                if (!activeSockets.has(sanitizedNumber)) {
                    console.log(`📱 Adding ${sanitizedNumber} to activeSockets on connection open`);
                    activeSockets.set(sanitizedNumber, conn);
                }
                
                const userJid = jidNormalizedUser(conn.user.id);
                
                // Ajouter aux numéros actifs
                await addNumberToMongoDB(sanitizedNumber);
                
                // Message de bienvenue (non modifié)
                const connectText = `
               ╔════════════════╗

║ 🤖 CONNECTED
╠════════════════╣
║ 🔑 PREFIX  : ${config.PREFIX}
║ 👨‍💻 DEV     : PATRON-MD
║ 📞 DEV NO : 2348133729715
╚════════════════╝

               
               `;
                
                // Envoyer le message de bienvenue uniquement si la connexion est VRAIMENT nouvelle
                // Si la connexion vient d'un autoreconnect, on suppose que l'utilisateur est déjà notifié.
                if (!existingSession) {
                    await conn.sendMessage(userJid, {
                        image: { url: config.IMAGE_PATH },
                        caption: connectText
                    });
                }
                
                console.log(`🎉 ${sanitizedNumber} successfully connected!`);
            }
            
            if (connection === 'close') {
                let reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log(`❌ Session closed: Logged Out.`);
                    // La gestion de la suppression des données est maintenant dans setupAutoRestart
                }
            }
        });
        
        // 9. ANTI-CALL, 10. ANTIDELETE et 📥 MESSAGE HANDLER (UPSERT)
        // ... (Logique non modifiée, conservée pour la complétude) ...

        // 9. ANTI-CALL avec config MongoDB
        conn.ev.on('call', async (calls) => {
            try {
                const userConfig = await getUserConfigFromMongoDB(number);
                if (userConfig.ANTI_CALL !== 'true') return;
                
                for (const call of calls) {
                    if (call.status !== 'offer') continue;
                    const id = call.id;
                    const from = call.from;
                    await conn.rejectCall(id, from);
                    await conn.sendMessage(from, { 
                        text: userConfig.REJECT_MSG || config.REJECT_MSG 
                    });
                }
            } catch (err) { 
                console.error("Anti-call error:", err); 
            }
        });
        
        // 10. ANTIDELETE
        conn.ev.on('messages.update', async (updates) => {
            await handleAntidelete(conn, updates, store);
        });

        // 11. GROUP EVENTS (WELCOME/GOODBYE)
        conn.ev.on('group-participants.update', async (update) => {
            await groupEvents(conn, update, number);
        });
        
        // ===============================================================
        // 📥 MESSAGE HANDLER (UPSERT) AVEC CONFIG MONGODB
        // ===============================================================
        conn.ev.on('messages.upsert', async (msg) => {
    try {
        let mek = msg.messages[0];
        if (!mek.message) return;

        // Charger config utilisateur
        const userConfig = await getUserConfigFromMongoDB(number);

        // Work on a copy
        let messageContent = mek.message;  // renamed from 'msg'

        // 1️⃣ Unwrap ephemeral message
        if (messageContent?.ephemeralMessage?.message) {
            messageContent = messageContent.ephemeralMessage.message;
        }

        // 2️⃣ Unwrap view-once message V2
        if (messageContent?.viewOnceMessageV2?.message) {
            messageContent = messageContent.viewOnceMessageV2.message;
        }

        // 3️⃣ Handle older viewOnceMessage
        if (messageContent?.viewOnceMessage?.message) {
            messageContent = messageContent.viewOnceMessage.message;
        }

        // Assign back
        mek.message = messageContent;
                
                // Auto Read basé sur config
                if (userConfig.READ_MESSAGE === 'true') {
                    await conn.readMessages([mek.key]);
                }
                
                // Newsletter Reaction
                const newsletterJids = ["120363303045895814@newslette"];
                const newsEmojis = ["❤️", "👍", "😮", "😎", "💀", "💫", "🔥", "🚹"];
                if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
                    try {
                        const serverId = mek.newsletterServerId;
                        if (serverId) {
                            const emoji = newsEmojis[Math.floor(Math.random() * newsEmojis.length)];
                            await conn.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
                        }
                    } catch (e) {}
                }

                // Auto React for all messages (public and owner)
if (userConfig.AUTO_REACT === 'true') {
    const reactions = [
        '🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', 
        '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕', 
        '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️', 
        '🙋‍♀️', '🤷', '🤷‍♀️', '🤦', '🤦‍♀️', '💇‍♀️', '💇',
        '🍁', '🪺', '🍄', '🍄‍🟫', '🪸', '🪨', '🌺', '🪷', '🪻', '🥀', '🌹', '🌷', '💐', '🌾', 
        '🌸', '🌼', '🌻', '🌝', '🌚', '🌕', '🌎', '💫', '🔥', '☃️', '❄️', '🌨️', '🫧', '🍟', 
        '🍫', '🧃', '🧊', '🪀', '🤿', '🏆', '🥇', '🥈', '🥉', '🎗️', '🤹', '🤹‍♀️', '🎧', '🎤', 
        '🥁', '🧩', '🎯', '🚀', '🚁', '🗿', '🎙️', '⌛', '⏳', '💸', '💎', '⚙️', '⛓️', '🚹', 
        '🧸', '🎀', '🪄', '🎈', '🎁', '🎉', '🏮', '🪩', '📩', '💌', '📤', '📦', '📊', '📈', 
        '📑', '📉', '📂', '🔖', '🧷', '📌', '📝', '🔏', '🔐', '🚹', '❤️', '🧡', '💛', '💚', 
        '🚹', '💙', '�', '🚹', '🩶', '🤍', '🤎', '❤‍🔥', '❤‍🩹', '💗', '💖', '💘', '💝', '❌', 
        '✅', '🔰', '〽️', '🌐', '🌀', '⤴️', '⤵️', '🔴', '🟢', '🟡', '🟠', '🔵', '🟣', '⚫', 
        '⚪', '🟤', '🔇', '🔊', '📢', '🔕', '♥️', '🕐', '🚩'
    ];

    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    m.react(randomReaction);
}
                
                // Status Handling avec config MongoDB
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
    // Auto View
    if (userConfig.AUTO_VIEW_STATUS === "true") {
        await conn.readMessages([mek.key]);
    }

    // Auto Like
    if (userConfig.AUTO_LIKE_STATUS === "true") {
        const jawadlike = await conn.decodeJid(conn.user.id);
        const emojis = userConfig.AUTO_LIKE_EMOJI || config.AUTO_LIKE_EMOJI;
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        if (mek.key.participant) { // ✅ make sure participant exists
            await conn.sendMessage(mek.key.remoteJid, {
                react: { text: randomEmoji, key: mek.key }
            }, { statusJidList: [mek.key.participant, jawadlike] });
        }
    }

    // Auto Reply
    if (userConfig.AUTO_STATUS_REPLY === "true") {
        const user = mek.key.participant;
        if (user) { // ✅ make sure user exists
            const text = userConfig.AUTO_STATUS_MSG || config.AUTO_STATUS_MSG;
            await conn.sendMessage(user, {
                text: text,
                react: { text: '💞', key: mek.key }
            }, { quoted: mek });
        }
    }

    return;
}
                
                // Message Serialization
                const m = sms(conn, mek);
                const type = getContentType(mek.message);
                const from = mek.key.remoteJid;
                const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
                const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';
                
                const isCmd = body.startsWith(config.PREFIX);
                const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : '';
                const args = body.trim().split(/ +/).slice(1);
                const q = args.join(' ');
                const text = q;
                const isGroup = from.endsWith('@g.us');
                
                const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
                const senderNumber = sender.split('@')[0];
                const botNumber = conn.user.id.split(':')[0];
                const botNumber2 = await jidNormalizedUser(conn.user.id);
                const pushname = mek.pushName || 'User';
                
                const isMe = botNumber.includes(senderNumber);
                const isOwner = config.OWNER_NUMBER.includes(senderNumber) || isMe;
                const isCreator = isOwner;
                
                // Group Metadata
                let groupMetadata = null;
                let groupName = null;
                let participants = null;
                let groupAdmins = null;
                let isBotAdmins = null;
                let isAdmins = null;
                
if (isGroup) {
    try {
        const metadata = await conn.groupMetadata(from);

        groupMetadata = metadata;
        groupName = metadata.subject || "";
        participants = metadata.participants || [];

        const participantJids = participants.map(p => p.jid);

        const normalizeJid = (jid) => jid.split('@')[0].split(':')[0] + '@s.whatsapp.net';
        
        const botNormalizedJid = normalizeJid(conn.user.id);
        const botParticipant = participants.find(p => normalizeJid(p.jid) === botNormalizedJid);

        groupAdmins = participants
            .filter(p => p.admin !== null)
            .map(p => p.jid);

        isBotAdmins = botParticipant ? botParticipant.admin !== null : false;
        isAdmins = groupAdmins.includes(sender);

    } catch (e) {
        console.log("Group metadata error:", e);
    }
}

                // Auto Presence basé sur config MongoDB
                if (userConfig.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
                if (userConfig.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);
                
                // Custom MyQuoted
                const myquoted = {
                    key: {
                        remoteJid: 'status@broadcast',
                        participant: '13135550002@s.whatsapp.net',
                        fromMe: false,
                        id: createSerial(16).toUpperCase()
                    },
                    message: {
                        contactMessage: {
                            displayName: "© PATRON",
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:PATRON\nORG:PATRON;\nTEL;type=CELL;type=VOICE;waid=13135550002:13135550002\nEND:VCARD`,
                            contextInfo: {
                                stanzaId: createSerial(16).toUpperCase(),
                                participant: "0@s.whatsapp.net",
                                quotedMessage: { conversation: "© Patron" }
                            }
                        }
                    },
                    messageTimestamp: Math.floor(Date.now() / 1000),
                    status: 1,
                    verifiedBizName: "Meta"
                };
                
                // Map to convert letters to small caps
const smallCapsMap = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ',
    h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ',
    o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ',
    v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ꜰ', G: 'ɢ',
    H: 'ʜ', I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ',
    O: 'ᴏ', P: 'ᴘ', Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ',
    V: 'ᴠ', W: 'ᴡ', X: 'x', Y: 'ʏ', Z: 'ᴢ',
};

// Updated reply function
const reply = (text) => {
    const smallCapsText = text
        .split('')
        .map(c => smallCapsMap[c] || c)
        .join('');
    return conn.sendMessage(from, { text: smallCapsText }); // no quoted
};

// Usage
const l = reply; // sends in small caps automatically
                
                // "Send" Command
                const cmdNoPrefix = body.toLowerCase().trim();
                if (["send", "sendme", "sand"].includes(cmdNoPrefix)) {
                    if (!mek.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                        await conn.sendMessage(from, { text: "*STATUS VIEWED😁*" }, { quoted: mek });
                    } else {
                        try {
                            let qMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
                            let mtype = Object.keys(qMsg)[0];
                            const stream = await downloadContentFromMessage(qMsg[mtype], mtype.replace('Message', ''));
                            let buffer = Buffer.from([]);
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                            
                            let content = {};
                            if (mtype === 'imageMessage') content = { image: buffer, caption: qMsg[mtype].caption };
                            else if (mtype === 'videoMessage') content = { video: buffer, caption: qMsg[mtype].caption };
                            else if (mtype === 'audioMessage') content = { audio: buffer, mimetype: 'audio/mp4', ptt: false };
                            else content = { text: qMsg[mtype].text || qMsg.conversation };
                            
                            if (content) await conn.sendMessage(from, content, { quoted: mek });
                        } catch (e) { console.error(e); }
                    }
                }
                
                // Execute Plugins
const cmdName = isCmd
    ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase()
    : false;

if (!isCmd) return; // 🔥 STOP non-commands immediately

// Statistiques
await incrementStats(sanitizedNumber, 'commandsUsed');

const cmd =
    events.commands.find((cmd) => cmd.pattern === cmdName) ||
    events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));

if (!cmd) return; // 🔥 STOP if no command matched

if (config.WORK_TYPE === 'private' && !isOwner) return;

if (cmd.react) {
    await conn.sendMessage(from, {
        react: { text: cmd.react, key: mek.key }
    });
}

try {
    await cmd.function(conn, mek, m, {
        from,
        quoted: mek,
        body,
        isCmd,
        command: cmdName,
        args,
        q,
        text,
        isGroup,
        sender,
        senderNumber,
        botNumber2,
        botNumber,
        pushname,
        isMe,
        isOwner,
        isCreator,
        groupMetadata,
        groupName,
        participants,
        groupAdmins,
        isBotAdmins,
        isAdmins,
        reply,
        config,
        myquoted
    });
} catch (e) {
    console.error("[PLUGIN ERROR] " + e);
}

return; // 🔥 CRITICAL — DO NOT REMOVE

                
                // Statistiques messages
                await incrementStats(sanitizedNumber, 'messagesReceived');
                if (isGroup) {
                    await incrementStats(sanitizedNumber, 'groupsInteracted');
                }
                
                // Execute Events
                events.commands.map(async (command) => {
                    const ctx = { from, l, quoted: mek, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, config, myquoted };
                    
                    if (body && command.on === "body") command.function(conn, mek, m, ctx);
                    else if (mek.q && command.on === "text") command.function(conn, mek, m, ctx);
                    else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") command.function(conn, mek, m, ctx);
                    else if (command.on === "sticker" && mek.type === "stickerMessage") command.function(conn, mek, m, ctx);
                });
                
            } catch (e) {
                console.error(e);
            }
        });
        
    } catch (err) {
        console.error(err);
        if (res && !res.headersSent) {
            return res.json({ 
                error: 'Internal Server Error', 
                details: err.message 
            });
        }
    } finally {
        // Libérer le verrou
        if (connectionLockKey) {
            global[connectionLockKey] = false;
        }
    }
}

// ==============================================================================
// 4. ROUTES API (non modifié)
// ==============================================================================

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));

router.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'admin-dashboard.html')));

router.get('/dashboard.js', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.js')));

router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: 'Number required' });
    await startBot(number, res);
});

// Route pour vérifier statut
router.get('/status', async (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const { number } = req.query;
    
    console.log(`📌 /status called with number: "${number}"`);
    console.log(`📌 activeSockets keys: [${Array.from(activeSockets.keys()).join(', ')}]`);
    
    if (!number) {
        // Retourner toutes les connexions actives
        const activeConnections = Array.from(activeSockets.keys()).map(num => {
            const status = getConnectionStatus(num);
            return {
                number: num,
                status: 'connected',
                connectionTime: status.connectionTime,
                uptime: status.uptime
            };
        });
        
        console.log(`📌 Returning all connections (${activeConnections.length}):`, activeConnections);
        return res.json({
            totalActive: activeSockets.size,
            connections: activeConnections
        });
    }
    
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    console.log(`📌 Sanitized number: "${number}" -> "${sanitizedNumber}"`);
    console.log(`📌 Checking if "${sanitizedNumber}" is in activeSockets: ${activeSockets.has(sanitizedNumber)}`);
    
    const connectionStatus = getConnectionStatus(sanitizedNumber);
    
    console.log(`📌 Connection status for ${sanitizedNumber}:`, connectionStatus);
    
    res.json({
        number: sanitizedNumber,
        isConnected: connectionStatus.isConnected,
        connectionTime: connectionStatus.connectionTime,
        uptime: connectionStatus.uptime,
        message: connectionStatus.isConnected 
            ? 'Number is actively connected' 
            : 'Number is not connected'
    });
});

// Route pour déconnecter
router.get('/disconnect', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        return res.status(400).json({ error: 'Number parameter is required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    if (!activeSockets.has(sanitizedNumber)) {
        return res.status(404).json({ 
            error: 'Number not found in active connections' 
        });
    }

    try {
        const socket = activeSockets.get(sanitizedNumber);
        
        // Fermer connexion
        await socket.ws.close();
        socket.ev.removeAllListeners();
        
        // Supprimer du tracking et de la base de données
        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);
        await removeNumberFromMongoDB(sanitizedNumber);
        await deleteSessionFromMongoDB(sanitizedNumber); // S'assurer que la session MongoDB est supprimée aussi
        
        console.log(`✅ Manually disconnected ${sanitizedNumber}. Total active now: ${activeSockets.size}`);
        
        res.json({ 
            status: 'success', 
            message: 'Number disconnected successfully' 
        });
        
    } catch (error) {
        console.error(`Error disconnecting ${sanitizedNumber}:`, error);
        res.status(500).json({ 
            error: 'Failed to disconnect number' 
        });
    }
});

// Route pour voir numéros actifs
router.get('/active', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const numbers = Array.from(activeSockets.keys());
    console.log(`📌 /active called - Found ${numbers.length} active sockets:`, numbers);
    
    res.json({
        count: activeSockets.size,
        numbers: numbers
    });
});

// Route ping
router.get('/ping', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({
        status: 'active',
        message: 'patron mini is running',
        activeSessions: activeSockets.size,
        database: 'MongoDB Integrated'
    });
});

// Diagnostic route - check internal state
router.get('/debug-status', (req, res) => {
    const activeSocketsKeys = Array.from(activeSockets.keys());
    const socketCreationTimeKeys = Array.from(socketCreationTime.keys());
    
    // Find any mismatch
    const mismatches = {
        inActiveSockets_notInCreationTime: activeSocketsKeys.filter(k => !socketCreationTime.has(k)),
        inCreationTime_notInActiveSockets: socketCreationTimeKeys.filter(k => !activeSockets.has(k))
    };
    
    const activeSocketsInfo = activeSocketsKeys.map(num => {
        const creationTime = socketCreationTime.get(num);
        const uptime = creationTime ? Math.floor((Date.now() - creationTime) / 1000) : 0;
        return {
            number: num,
            inActiveSockets: activeSockets.has(num),
            inSocketCreationTime: socketCreationTime.has(num),
            creationTime: creationTime,
            uptimeSeconds: uptime,
            uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`
        };
    });
    
    res.json({
        totalActive: activeSockets.size,
        totalCreationTimes: socketCreationTime.size,
        activeSocketsKeys: activeSocketsKeys,
        socketCreationTimeKeys: socketCreationTimeKeys,
        mismatches: mismatches,
        activeConnections: activeSocketsInfo,
        timestamp: new Date().toISOString()
    });
});

// Route pour reconnecter tous
router.get('/connect-all', async (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    try {
        const numbers = await getAllNumbersFromMongoDB();
        if (numbers.length === 0) {
            return res.status(404).json({ error: 'No numbers found to connect' });
        }

        const results = [];
        for (const number of numbers) {
            if (activeSockets.has(number)) {
                results.push({ number, status: 'already_connected' });
                continue;
            }

            const mockRes = { 
                headersSent: false, 
                json: () => {}, 
                status: () => mockRes 
            };
            await startBot(number, mockRes);
            results.push({ number, status: 'connection_initiated' });
            await delay(1000);
        }

        res.json({
            status: 'success',
            total: numbers.length,
            connections: results
        });
    } catch (error) {
        console.error('Connect all error:', error);
        res.status(500).json({ error: 'Failed to connect all bots' });
    }
});

// Route pour reconfigurer
router.get('/update-config', async (req, res) => {
    const { number, config: configString } = req.query;
    if (!number || !configString) {
        return res.status(400).json({ error: 'Number and config are required' });
    }

    let newConfig;
    try {
        newConfig = JSON.parse(configString);
    } catch (error) {
        return res.status(400).json({ error: 'Invalid config format' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).json({ error: 'No active session found for this number' });
    }

    // Générer OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Sauvegarder OTP dans MongoDB
    await saveOTPToMongoDB(sanitizedNumber, otp, newConfig);

    try {
        // Envoyer OTP
        const userJid = jidNormalizedUser(socket.user.id);
        await socket.sendMessage(userJid, {
            text: `*🔐 CONFIGURATION UPDATE*\n\nYour OTP: *${otp}*\nValid for 5 minutes\n\nUse: /verify-otp ${otp}`
        });
        
        res.json({ 
            status: 'otp_sent', 
            message: 'OTP sent to your number' 
        });
    } catch (error) {
        console.error('Failed to send OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Route pour vérifier OTP
router.get('/verify-otp', async (req, res) => {
    const { number, otp } = req.query;
    if (!number || !otp) {
        return res.status(400).json({ error: 'Number and OTP are required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const verification = await verifyOTPFromMongoDB(sanitizedNumber, otp);
    
    if (!verification.valid) {
        return res.status(400).json({ error: verification.error });
    }

    try {
        await updateUserConfigInMongoDB(sanitizedNumber, verification.config);
        const socket = activeSockets.get(sanitizedNumber);
        if (socket) {
            await socket.sendMessage(jidNormalizedUser(socket.user.id), {
                text: `*✅ CONFIG UPDATED*\n\nYour configuration has been successfully updated!\n\nChanges saved in MongoDB.`
            });
        }
        res.json({ 
            status: 'success', 
            message: 'Config updated successfully in MongoDB' 
        });
    } catch (error) {
        console.error('Failed to update config in MongoDB:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
});

// Route pour statistiques
router.get('/stats', async (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const { number } = req.query;
    
    if (!number) {
        return res.status(400).json({ error: 'Number is required' });
    }
    
    try {
        const statsArray = await getStatsForNumber(number);
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const connectionStatus = getConnectionStatus(sanitizedNumber);
        
        // Sum all daily stats into aggregates
        let totalMessages = 0;
        let totalCommands = 0;
        let totalGroups = 0;
        
        if (Array.isArray(statsArray)) {
            for (const stat of statsArray) {
                totalMessages += stat.messagesReceived || 0;
                totalCommands += stat.commandsUsed || 0;
                totalGroups += stat.groupsInteracted || 0;
            }
        } else if (statsArray) {
            totalMessages = statsArray.messagesReceived || 0;
            totalCommands = statsArray.commandsUsed || 0;
            totalGroups = statsArray.groupsInteracted || 0;
        }
        
        console.log(`📊 Stats for ${sanitizedNumber}:`, {
            totalMessages,
            totalCommands,
            totalGroups,
            connectionStatus: connectionStatus.isConnected,
            uptime: connectionStatus.uptime
        });
        
        res.json({
            number: sanitizedNumber,
            connectionStatus: connectionStatus.isConnected ? 'Connected' : 'Disconnected',
            uptime: connectionStatus.uptime,
            stats: {
                messagesReceived: totalMessages,
                commandsUsed: totalCommands,
                groupsInteracted: totalGroups
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Route pour statistiques globales du serveur
router.get('/stats-overall', async (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
        console.log(`📊 /stats-overall called - Active connections: ${activeSockets.size}`);
        
        let totalMessages = 0;
        let totalCommands = 0;
        let totalGroups = 0;
        
        // Calculer stats pour tous les numéros actifs
        for (const number of activeSockets.keys()) {
            console.log(`📊 Fetching stats for ${number}`);
            const statsArray = await getStatsForNumber(number);
            console.log(`📊 Stats for ${number}:`, statsArray);
            
            // statsArray is an array of daily stats, sum them all
            if (Array.isArray(statsArray)) {
                for (const stat of statsArray) {
                    totalMessages += stat.messagesReceived || 0;
                    totalCommands += stat.commandsUsed || 0;
                    totalGroups += stat.groupsInteracted || 0;
                }
            } else if (statsArray) {
                // Fallback if it's a single object
                totalMessages += statsArray.messagesReceived || 0;
                totalCommands += statsArray.commandsUsed || 0;
                totalGroups += statsArray.groupsInteracted || 0;
            }
        }
        
        // Calculer serveur uptime
        const processUptime = Math.floor(process.uptime());
        
        const result = {
            totalActive: activeSockets.size,
            totalMessages: totalMessages,
            totalCommands: totalCommands,
            totalGroups: totalGroups,
            serverUptime: processUptime,
            timestamp: new Date().toISOString()
        };
        
        console.log(`📊 Final stats result:`, result);
        res.json(result);
    } catch (error) {
        console.error('Error getting overall stats:', error);
        res.status(500).json({ error: 'Failed to get overall statistics' });
    }
});

// ==============================================================================
// 5. RECONNEXION AUTOMATIQUE AU DÉMARRAGE (non modifié)
// ==============================================================================

async function autoReconnectFromMongoDB() {
    try {
        console.log('🔁 Attempting auto-reconnect from MongoDB...');
        const numbers = await getAllNumbersFromMongoDB();
        
        if (numbers.length === 0) {
            console.log('ℹ️ No numbers found in MongoDB for auto-reconnect');
            return;
        }
        
        console.log(`📊 Found ${numbers.length} numbers in MongoDB`);
        
        for (const number of numbers) {
            if (!activeSockets.has(number)) {
                console.log(`🔁 Reconnecting: ${number}`);
                const mockRes = { 
                    headersSent: false, 
                    json: () => {}, 
                    status: () => mockRes 
                };
                await startBot(number, mockRes);
                await delay(2000); // Attendre entre chaque reconnexion
            } else {
                console.log(`✅ Already connected: ${number}`);
            }
        }
        
        console.log('✅ Auto-reconnect completed');
    } catch (error) {
        console.error('❌ autoReconnectFromMongoDB error:', error.message);
    }
}

// Démarrer reconnexion automatique après 3 secondes
setTimeout(() => {
    autoReconnectFromMongoDB();
}, 3000);

// ==============================================================================
// 6. CLEANUP ON EXIT (non modifié)
// ==============================================================================

process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        socket.ws.close();
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    
    // Nettoyer sessions locales
    const sessionDir = path.join(__dirname, 'session');
    if (fs.existsSync(sessionDir)) {
        fs.emptyDirSync(sessionDir);
    }
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Redémarrer avec PM2 si configuré
    if (process.env.PM2_NAME) {
        const { exec } = require('child_process');
        exec(`pm2 restart ${process.env.PM2_NAME}`);
    }
});

module.exports = router;
