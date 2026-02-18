const mongoose = require('mongoose');
const config = require('../config');

const connectdb = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ Database Connected Successfully");
    } catch (e) {
        console.error("❌ Database Connection Failed:", e.message);
    }
};

// ====================================
// MODULES
// ===================================

const sessionSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    credentials: {
        // CORRECTION: Utiliser un type Object générique pour stocker
        // l'ensemble de l'objet creds.json de Baileys de manière simple et robuste.
        type: Object,
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const userConfigSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    config: {
        AUTO_RECORDING: { type: String, default: 'false' },
        AUTO_TYPING: { type: String, default: 'false' },
        ANTI_CALL: { type: String, default: 'false' },
        REJECT_MSG: { type: String, default: '*🔕 ʏᴏᴜʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ ʀᴇᴊᴇᴄᴛᴇᴅ..!*' },
        // Anti-link settings
        ANTI_LINK: { type: String, default: 'false' },
        ANTI_LINK_MODE: { type: String, default: 'off' },
        READ_MESSAGE: { type: String, default: 'false' },
        AUTO_VIEW_STATUS: { type: String, default: 'false' },
        AUTO_LIKE_STATUS: { type: String, default: 'false' },
        AUTO_STATUS_REPLY: { type: String, default: 'false' },
        AUTO_STATUS_MSG: { type: String, default: 'Hello from patrom-mini' },
        AUTO_LIKE_EMOJI: { type: Array, default: ['❤️', '👍', '😮', '🚹'] },
        AUTO_REACT: { type: String, default: 'false' },
        WELCOME_ENABLE: { type: String, default: 'false' },
        GOODBYE_ENABLE: { type: String, default: 'false' }
    },
    GROUP_SETTINGS: {
        type: Object,
        default: {}
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const otpSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true,
        index: true 
    },
    otp: { type: String, required: true },
    config: { type: Object, required: true },
    expiresAt: {  
        type: Date, 
        default: () => new Date(Date.now() + 5 * 60000), // 5 minutes
        index: { expires: '5m' }
    },
    createdAt: { type: Date, default: Date.now }
});

// 4. Numéros actifs (pour reconnexion)
const activeNumberSchema = new mongoose.Schema({
    number: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    lastConnected: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    connectionInfo: {
        ip: String,
        userAgent: String,
        timestamp: Date
    }
});

const statsSchema = new mongoose.Schema({
    number: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    commandsUsed: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    groupsInteracted: { type: Number, default: 0 }
});

// Anti-link warn tracker
const antiLinkWarnSchema = new mongoose.Schema({
    groupId: { 
        type: String, 
        required: true,
        index: true 
    },
    userId: { 
        type: String, 
        required: true,
        index: true 
    },
    warnCount: { type: Number, default: 0 },
    lastWarnTime: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});
// ===============================

const Session = mongoose.model('Session', sessionSchema);
const UserConfig = mongoose.model('UserConfig', userConfigSchema);
const OTP = mongoose.model('OTP', otpSchema);
const ActiveNumber = mongoose.model('ActiveNumber', activeNumberSchema);
const Stats = mongoose.model('Stats', statsSchema);
const AntiLinkWarn = mongoose.model('AntiLinkWarn', antiLinkWarnSchema);

// ====================================
// FONCTIONS
// ==================================

// Sauvegarde session
async function saveSessionToMongoDB(number, credentials) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await Session.findOneAndUpdate(
            { number: cleanNumber },
            { 
                credentials: credentials,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log(`📁 Session saved to MongoDB for ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving session to MongoDB:', error);
        return false;
    }
}

// Récupération session
async function getSessionFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const session = await Session.findOne({ number: cleanNumber });
        return session ? session.credentials : null;
    } catch (error) {
        console.error('❌ Error getting session from MongoDB:', error);
        return null;
    }
}

// Suppression session
async function deleteSessionFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await Session.deleteOne({ number: cleanNumber });
        await ActiveNumber.deleteOne({ number: cleanNumber });
        // Optionnel: Supprimer d'autres données liées si le bot est complètement "oublié"
        // await UserConfig.deleteOne({ number: cleanNumber });
        // await Stats.deleteMany({ number: cleanNumber });
        
        console.log(`🗑️ Session deleted from MongoDB for ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting session from MongoDB:', error);
        return false;
    }
}

// Configuration utilisateur
async function getUserConfigFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        const userDoc = await UserConfig.findOne({ number: cleanNumber }).lean();
        
        if (userDoc) {
            // GROUP_SETTINGS is now a plain Object, just use it directly
            const groupSettings = userDoc.GROUP_SETTINGS || {};
            
            const result = {
                ...userDoc.config,
                GROUP_SETTINGS: groupSettings
            };
            return result;
        } else {
            // Configuration par défaut
            const defaultConfig = {
                AUTO_RECORDING: 'false',
                AUTO_TYPING: 'false',
                ANTI_CALL: 'false',
                REJECT_MSG: '*🔕 ʏᴏᴜʀ ᴄᴀʟʟ ᴡᴀs ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ ʀᴇᴊᴇᴄᴛᴇᴅ..!*',
                ANTI_LINK: 'false',
                ANTI_LINK_MODE: 'off',
                READ_MESSAGE: 'false',
                AUTO_VIEW_STATUS: 'false',
                AUTO_LIKE_STATUS: 'false',
                AUTO_STATUS_REPLY: 'false',
                AUTO_STATUS_MSG: 'Hello from ᴘᴀᴛʀᴏɴ-ᴍɪɴɪ!',
                AUTO_LIKE_EMOJI: ['❤️', '👍', '😮', '🚹'],
                AUTO_REACT: 'false',
                WELCOME_ENABLE: 'false',
                GOODBYE_ENABLE: 'false',
                GROUP_SETTINGS: {}
            };
            
            // Sauvegarde configuration par défaut
            await UserConfig.create({
                number: cleanNumber,
                config: defaultConfig,
                GROUP_SETTINGS: {}
            });
            
            return defaultConfig;
        }
    } catch (error) {
        console.error('❌ Error getting user config from MongoDB:', error);
        return {};
    }
}

// Mise à jour configuration
async function updateUserConfigInMongoDB(number, newConfig) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        // Extract GROUP_SETTINGS from the config
        const { GROUP_SETTINGS, ...configData } = newConfig;
        
        await UserConfig.findOneAndUpdate(
            { number: cleanNumber },
            { 
                config: configData,
                GROUP_SETTINGS: GROUP_SETTINGS || {},
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        
        return true;
    } catch (error) {
        console.error('❌ Error updating user config in MongoDB:', error);
        return false;
    }
}

// Gestion OTP
async function saveOTPToMongoDB(number, otp, config) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await OTP.create({
            number: cleanNumber,
            otp: otp,
            config: config
        });
        console.log(`🔐 OTP saved for ${cleanNumber}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving OTP to MongoDB:', error);
        return false;
    }
}

async function verifyOTPFromMongoDB(number, otp) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const otpRecord = await OTP.findOne({ 
            number: cleanNumber, 
            otp: otp,
            expiresAt: { $gt: new Date() }
        });
        
        if (!otpRecord) {
            return { valid: false, error: 'Invalid or expired OTP' };
        }
        
        // Supprime OTP après vérification
        await OTP.deleteOne({ _id: otpRecord._id });
        
        return {
            valid: true,
            config: otpRecord.config
        };
    } catch (error) {
        console.error('❌ Error verifying OTP from MongoDB:', error);
        return { valid: false, error: 'Verification error' };
    }
}

// Gestion numéros actifs
async function addNumberToMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await ActiveNumber.findOneAndUpdate(
            { number: cleanNumber },
            { 
                lastConnected: new Date(),
                isActive: true
            },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error('❌ Error adding number to MongoDB:', error);
        return false;
    }
}

async function removeNumberFromMongoDB(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        await ActiveNumber.deleteOne({ number: cleanNumber });
        return true;
    } catch (error) {
        console.error('❌ Error removing number from MongoDB:', error);
        return false;
    }
}

async function getAllNumbersFromMongoDB() {
    try {
        const activeNumbers = await ActiveNumber.find({ isActive: true });
        return activeNumbers.map(num => num.number);
    } catch (error) {
        console.error('❌ Error getting numbers from MongoDB:', error);
        return [];
    }
}

// Statistiques
async function incrementStats(number, field) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const today = new Date().toISOString().split('T')[0];
        
        await Stats.findOneAndUpdate(
            { number: cleanNumber, date: today },
            { $inc: { [field]: 1 } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

async function getStatsForNumber(number) {
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '');
        const stats = await Stats.find({ number: cleanNumber })
            .sort({ date: -1 })
            .limit(30);
        return stats;
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        return [];
    }
}

// Anti-link warn functions
async function incrementAntiLinkWarn(groupId, userId) {
    try {
        const result = await AntiLinkWarn.findOneAndUpdate(
            { groupId, userId },
            { 
                $inc: { warnCount: 1 },
                lastWarnTime: new Date()
            },
            { upsert: true, new: true }
        );
        return result.warnCount;
    } catch (error) {
        console.error('❌ Error incrementing warn count:', error);
        return 0;
    }
}

async function getAntiLinkWarnCount(groupId, userId) {
    try {
        const warn = await AntiLinkWarn.findOne({ groupId, userId });
        return warn ? warn.warnCount : 0;
    } catch (error) {
        console.error('❌ Error getting warn count:', error);
        return 0;
    }
}

async function resetAntiLinkWarn(groupId, userId) {
    try {
        const result = await AntiLinkWarn.deleteOne({ groupId, userId });
        return result.deletedCount > 0;
    } catch (error) {
        console.error('❌ Error resetting warn count:', error);
        return false;
    }
}

// =================================
// EXPORTS 
// =================================

module.exports = {
    connectdb,

    Session,
    UserConfig,
    OTP,
    ActiveNumber,
    Stats,
    
    // Fonctions session
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB,
    
    // Fonctions configuration
    getUserConfigFromMongoDB,
    updateUserConfigInMongoDB,
    
    // Fonctions OTP
    saveOTPToMongoDB,
    verifyOTPFromMongoDB,
    
    // Fonctions numéros
    addNumberToMongoDB,
    removeNumberFromMongoDB,
    getAllNumbersFromMongoDB,
    
    // Fonctions statistiques
    incrementStats,
    getStatsForNumber,
    
    // Fonctions anti-link warn
    incrementAntiLinkWarn,
    getAntiLinkWarnCount,
    resetAntiLinkWarn,
    
    // Anciennes fonctions (pour compatibilité)
    getUserConfig: async (number) => {
        const config = await getUserConfigFromMongoDB(number);
        return config || {};
    },
    updateUserConfig: updateUserConfigInMongoDB
};
              
