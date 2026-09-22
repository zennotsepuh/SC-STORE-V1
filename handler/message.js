// MESSAGE HANDLER - © ZenDlouis
const config = require("../config");
const menu = require("./menu");
const order = require("./order");
const admin = require("./admin");
const chalk = require("chalk");

module.exports = async (sock, m, config, menu, order, admin) => {
    try {
        const { body, sender, pushName, isGroup, chat } = m;
        const prefix = config.prefix;
        
        // Log pesan masuk
        console.log(chalk.cyan(`[MSG] ${pushName}: ${body}`));
        
        // Anti spam sederhana
        if (!body) return;
        
        // Auto read
        if (config.autoRead) await sock.readMessages([m.key]);
        
        // Cek prefix
        if (!body.startsWith(prefix)) {
            // Welcome message buat chat personal (bukan grup)
            if (!isGroup && !m.fromMe) {
                const isNew = !global.users?.includes(sender);
                if (!global.users) global.users = [];
                
                if (!global.users.includes(sender)) {
                    global.users.push(sender);
                    await sock.sendMessage(chat, {
                        text: menu.getMainMenu(pushName)
                    });
                }
            }
            return;
        }
        
        // Parse command
        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        // Typing indicator
        if (config.autoTyping) await sock.sendPresenceUpdate("composing", chat);
        
        // ===== COMMAND HANDLER =====
        switch (command) {
            // ===== MENU =====
            case "menu":
            case "help":
            case "start":
                await sock.sendMessage(chat, { text: menu.getMainMenu(pushName) }, { quoted: m });
                break;
            
            // ===== LIST PRODUK =====
            case "list":
            case "produk":
            case "shop":
                const db = order.loadDB();
                await sock.sendMessage(chat, { 
                    text: menu.getProductList(db.produk) 
                }, { quoted: m });
                break;
            
            // ===== BELI =====
            case "beli":
            case "buy":
            case "order":
                if (!args[0]) {
                    await sock.sendMessage(chat, { 
                        text: `❌ Format: ${prefix}beli [id]\nContoh: ${prefix}beli 1` 
                    }, { quoted: m });
                    break;
                }
                
                const result = order.createOrder(sender, pushName, args[0]);
                
                if (!result.success) {
                    await sock.sendMessage(chat, { text: result.msg }, { quoted: m });
                } else {
                    await sock.sendMessage(chat, { text: result.msg }, { quoted: m });
                    
                    // Notif ke owner
                    await sock.sendMessage(config.ownerNumber + "@s.whatsapp.net", {
                        text: `🔔 *ORDER BARU!*\n\n👤 ${pushName}\n📱 ${sender}\n📦 ${result.order.produkNama}\n💰 Rp ${result.order.total.toLocaleString('id-ID')}\n🆔 ${result.order.id}`
                    });
                }
                break;
            
            // ===== BAYAR =====
            case "bayar":
            case "payment":
                await sock.sendMessage(chat, { text: menu.getPaymentInfo() }, { quoted: m });
                break;
            
            // ===== STATUS ORDER =====
            case "status":
                if (!args[0]) {
                    await sock.sendMessage(chat, { 
                        text: `❌ Format: ${prefix}status [order_id]` 
                    }, { quoted: m });
                    break;
                }
                const statusMsg = order.getOrderStatus(args[0].toUpperCase());
                await sock.sendMessage(chat, { text: statusMsg }, { quoted: m });
                break;
            
            // ===== HISTORY =====
            case "history":
            case "riwayat":
                const historyMsg = order.getUserHistory(sender);
                await sock.sendMessage(chat, { text: historyMsg }, { quoted: m });
                break;
            
            // ===== PROFILE =====
            case "profile":
            case "profil":
                await sock.sendMessage(chat, {
                    text: `
╔══════════════════════════════╗
║       👤 PROFIL USER 👤      ║
╚══════════════════════════════╝

📛 Nama: *${pushName}*
📱 Nomor: *${sender.split("@")[0]}*
🆔 ID: *${sender}*
🏆 Status: Member

_Ketik ${prefix}history buat liat riwayat order_
`
                }, { quoted: m });
                break;
            
            // ===== KONTAK OWNER =====
            case "owner":
            case "admin":
                await sock.sendMessage(chat, {
                    text: `📞 *KONTAK OWNER*\n\nwa.me/${config.ownerNumber}\n\n_Kalo ada masalah, chat aja!_`
                }, { quoted: m });
                break;
            
            // ===== RULES =====
            case "rules":
            case "peraturan":
                await sock.sendMessage(chat, {
                    text: `
╔══════════════════════════════╗
║      📜 PERATURAN TOKO 📜    ║
╚══════════════════════════════╝

1. Order = setuju bayar
2. Bayar dulu, baru diproses
3. Bukti transfer wajib
4. Komplain max 1x24 jam
5. Scam = auto banned
6. Hargai admin & pembeli lain

_Terima kasih udah order ya kentot!_ 🙏
`
                }, { quoted: m });
                break;
            
            // ===== ADMIN COMMANDS =====
            case "addproduk":
            case "addp":
                if (!admin.isAdmin(sender)) {
                    await sock.sendMessage(chat, { text: "❌ Lu bukan admin!" }, { quoted: m });
                    break;
                }
                if (args.length < 5) {
                    await sock.sendMessage(chat, { 
                        text: `Format: ${prefix}addproduk nama | harga | stok | kategori | deskripsi` 
                    }, { quoted: m });
                    break;
                }
                const [nama, harga, stok, kategori, ...desc] = args.join(" ").split("|").map(s => s.trim());
                const addResult = admin.addProduct(nama, harga, stok, kategori, desc.join(" "));
                await sock.sendMessage(chat, { text: addResult }, { quoted: m });
                break;
            
            case "delproduk":
            case "delp":
                if (!admin.isAdmin(sender)) {
                    await sock.sendMessage(chat, { text: "❌ Lu bukan admin!" }, { quoted: m });
                    break;
                }
                if (!args[0]) {
                    await sock.sendMessage(chat, { text: `Format: ${prefix}delproduk [id]` }, { quoted: m });
                    break;
                }
                const delResult = admin.deleteProduct(args[0]);
                await sock.sendMessage(chat, { text: delResult }, { quoted: m });
                break;
            
            case "updateorder":
            case "uo":
                if (!admin.isAdmin(sender)) {
                    await sock.sendMessage(chat, { text: "❌ Lu bukan admin!" }, { quoted: m });
                    break;
                }
                if (args.length < 2) {
                    await sock.sendMessage(chat, { 
                        text: `Format: ${prefix}updateorder [order_id] [status]\nStatus: PENDING/PAID/PROCESS/SUCCESS/CANCEL` 
                    }, { quoted: m });
                    break;
                }
                const uoResult = admin.updateOrderStatus(args[0].toUpperCase(), args[1]);
                await sock.sendMessage(chat, { text: uoResult }, { quoted: m });
                break;
            
            case "allorder":
            case "ao":
                if (!admin.isAdmin(sender)) {
                    await sock.sendMessage(chat, { text: "❌ Lu bukan admin!" }, { quoted: m });
                    break;
                }
                const aoResult = admin.getAllOrders();
                await sock.sendMessage(chat, { text: aoResult }, { quoted: m });
                break;
            
            case "stats":
            case "statistik":
                if (!admin.isAdmin(sender)) {
                    await sock.sendMessage(chat, { text: "❌ Lu bukan admin!" }, { quoted: m });
                    break;
                }
                const statsResult = admin.getStats();
                await sock.sendMessage(chat, { text: statsResult }, { quoted: m });
                break;
            
            default:
                if (body.startsWith(prefix)) {
                    await sock.sendMessage(chat, { 
                        text: `❌ Command *${command}* gak ada, ketik ${prefix}menu` 
                    }, { quoted: m });
                }
        }
        
        // Stop typing
        if (config.autoTyping) await sock.sendPresenceUpdate("paused", chat);
        
    } catch (err) {
        console.log(chalk.red("[ERROR HANDLER] " + err));
    }
};
