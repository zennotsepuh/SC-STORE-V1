// WA STORE BOT - © ZenDlouis
// MAIN FILE - JALANKAN INI!

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    jidDecode,
    proto,
    getContentType
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const readline = require("readline");
const NodeCache = require("node-cache");

const config = require("./config");
const menu = require("./handler/menu");
const order = require("./handler/order");
const admin = require("./handler/admin");

const msgRetryCounterCache = new NodeCache();
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

// ===== BANNER =====
console.log(chalk.red(`
╔══════════════════════════════════════╗
║   🛒 WA STORE BOT V1 - © ZenDlouis   ║
║   Status: STARTING...                ║
╚══════════════════════════════════════╝
`));

// ===== QUESTION =====
const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

// ===== START BOT =====
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session");
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["WA Store Bot", "Chrome", "1.0.0"],
        msgRetryCounterCache,
        generateHighQualityLinkPreview: true
    });
    
    store.bind(sock.ev);
    
    // ===== PAIRING CODE =====
    if (!sock.authState.creds.registered) {
        console.log(chalk.yellow("\n[!] Bot belum login, masukkan nomor WA:"));
        const phoneNumber = await question(chalk.green("Nomor (62xxx): "));
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(chalk.cyan(`\n[✅] Pairing Code: ${code}`));
        console.log(chalk.yellow("[!] Masukkan kode ini di WhatsApp > Linked Devices\n"));
    }
    
    // ===== CONNECTION UPDATE =====
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red("[!] Koneksi terputus, reconnect..."));
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log(chalk.green(`
╔══════════════════════════════════════╗
║   ✅ BOT BERHASIL TERHUBUNG! ✅      ║
║   © Zendlouis - WA Store Bot V1      ║
╚══════════════════════════════════════╝
            `));
        }
    });
    
    sock.ev.on("creds.update", saveCreds);
    
    // ===== MESSAGE HANDLER =====
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (getContentType(mek.message) === "ephemeralMessage") 
                ? mek.message.ephemeralMessage.message 
                : mek.message;
            
            if (mek.key && mek.key.remoteJid === "status@broadcast") return;
            if (!sock.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
            if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
            
            const m = smsg(sock, mek, store);
            require("./handler/message")(sock, m, config, menu, order, admin);
        } catch (err) {
            console.log(chalk.red("[ERROR] " + err));
        }
    });
    
    sock.public = true;
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
        }
        return jid;
    };
    
    return sock;
}

// ===== MSG PARSER =====
function smsg(sock, m, store) {
    if (!m) return m;
    const M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith("@g.us");
        m.sender = sock.decodeJid(
            (m.fromMe && sock.user.id) || 
            m.participant || 
            m.key.participant || 
            m.chat
        );
        if (m.isGroup) m.participant = sock.decodeJid(m.key.participant) || "";
    }
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype === "viewOnceMessage") 
            ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] 
            : m.message[m.mtype];
        m.body = m.message.conversation || 
                 m.msg?.caption || 
                 m.msg?.text || 
                 (m.mtype === "listResponseMessage" && m.msg?.singleSelectReply?.selectedRowId) || 
                 (m.mtype === "buttonsResponseMessage" && m.msg?.selectedButtonId) || 
                 (m.mtype === "viewOnceMessage" && m.msg?.caption) || 
                 m.text || "";
        const prefixRegex = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi;
        m.prefix = m.body.match(prefixRegex) ? m.body.match(prefixRegex)[0] : "";
        m.command = m.body && m.body.replace(m.prefix, "").trim().split(/ +/).shift().toLowerCase();
        m.args = m.body.trim().split(/ +/).slice(1);
        m.pushName = m.pushName || "No Name";
        m.text = m.args.join(" ");
    }
    return m;
}

// ===== RUN =====
startBot();

process.on("uncaughtException", (err) => {
    console.log(chalk.red("[UNCAUGHT] " + err));
});
