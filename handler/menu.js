// MENU HANDLER - © ZenDlouis
const config = require('../config');

function getMainMenu(pushName) {
    return `
╔══════════════════════════════╗
║   ${config.storeName}   
╚══════════════════════════════╝

Halo *${pushName}* 👋
Selamat datang di *${config.storeName}*

${config.storeDesc}
🕐 ${config.storeHours}
📍 ${config.storeAddress}

╔══════════════════════════════╗
║        📋 MENU UTAMA        ║
╚══════════════════════════════╝

🛒 *TRANSAKSI*
├ ${config.prefix}list - Lihat semua produk
├ ${config.prefix}beli [id] - Beli produk
├ ${config.prefix}bayar - Info pembayaran
└ ${config.prefix}status [id] - Cek status order

📦 *PRODUK*
├ ${config.prefix}kategori - Lihat kategori
├ ${config.prefix}search [nama] - Cari produk
└ ${config.prefix}promo - Lihat promo

👤 *AKUN*
├ ${config.prefix}profile - Profil lu
├ ${config.prefix}saldo - Cek saldo
├ ${config.prefix}history - Riwayat order
└ ${config.prefix}daftar - Daftar member

📞 *BANTUAN*
├ ${config.prefix}help - Bantuan
├ ${config.prefix}owner - Kontak owner
└ ${config.prefix}rules - Peraturan

╔══════════════════════════════╗
║  © ${config.ownerName} - ${config.botName}  
╚══════════════════════════════╝

_Ketik ${config.prefix}menu buat balik ke menu ini_
`;
}

function getProductList(produk) {
    let text = `
╔══════════════════════════════╗
║      🛒 DAFTAR PRODUK 🛒     ║
╚══════════════════════════════╝

`;
    
    produk.forEach((p, i) => {
        text += `
*${i + 1}. ${p.nama}*
├ 💰 Harga: Rp ${p.harga.toLocaleString('id-ID')}
├ 📦 Stok: ${p.stok}
├ 🏷️ Kategori: ${p.kategori}
└ 📝 ${p.deskripsi}
`;
    });
    
    text += `
╔══════════════════════════════╗
║  Cara order: ${config.prefix}beli [id]  
╚══════════════════════════════╝
`;
    
    return text;
}

function getPaymentInfo() {
    return `
╔══════════════════════════════╗
║     💳 METODE PEMBAYARAN    ║
╚══════════════════════════════╝

📱 *E-WALLET*
├ DANA: ${config.payment.dana}
└ GOPAY: ${config.payment.gopay}


📸 *QRIS*
${config.payment.qris}

╔══════════════════════════════╗
║  ⚠️ Kirim bukti transfer ke  
║  owner setelah bayar!
╚══════════════════════════════╝
`;
}

function getHelpMenu() {
    return `
╔══════════════════════════════╗
║       📞 BANTUAN BOT        ║
╚══════════════════════════════╝

📌 *CARA ORDER:*
1. Ketik ${config.prefix}list
2. Pilih produk & ketik ${config.prefix}beli [id]
3. Ikuti instruksi bot
4. Bayar sesuai total
5. Kirim bukti ke owner
6. Pesanan diproses ✅

📌 *CARA CEK STATUS:*
Ketik ${config.prefix}status [id_order]

📌 *KONTAK OWNER:*
wa.me/${config.ownerNumber}

╔══════════════════════════════╗
║  Butuh bantuan? Chat owner!  
╚══════════════════════════════╝
`;
}

module.exports = {
    getMainMenu,
    getProductList,
    getPaymentInfo,
    getHelpMenu
};
