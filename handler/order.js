// ORDER HANDLER - © ZenDlouis
const fs = require('fs-extra');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/produk.json');

function loadDB() {
    return fs.readJsonSync(DB_PATH);
}

function saveDB(data) {
    fs.writeJsonSync(DB_PATH, data, { spaces: 4 });
}

function createOrder(userId, userName, produkId) {
    const db = loadDB();
    const produk = db.produk.find(p => p.id === parseInt(produkId));
    
    if (!produk) return { success: false, msg: '❌ Produk gak ada, cek menu !list' };
    if (produk.stok <= 0) return { success: false, msg: '❌ Stok habis, tunggu restock!' };
    
    const orderId = 'INV' + Date.now().toString().slice(-8);
    const total = produk.harga;
    
    const order = {
        id: orderId,
        userId: userId,
        userName: userName,
        produkId: produk.id,
        produkNama: produk.nama,
        harga: produk.harga,
        total: total,
        status: 'PENDING',
        tanggal: new Date().toISOString(),
        pembayaran: null
    };
    
    db.order.push(order);
    
    // Kurangi stok
    const idx = db.produk.findIndex(p => p.id === parseInt(produkId));
    db.produk[idx].stok -= 1;
    
    saveDB(db);
    
    return {
        success: true,
        order: order,
        msg: `
╔══════════════════════════════╗
║     ✅ ORDER BERHASIL! ✅    ║
╚══════════════════════════════╝

📋 *Detail Pesanan:*
├ ID Order: *${orderId}*
├ Produk: *${produk.nama}*
├ Harga: *Rp ${total.toLocaleString('id-ID')}*
├ Status: *PENDING*
└ Tanggal: ${new Date().toLocaleString('id-ID')}

💳 *Silakan bayar ke:*
${require('../config').payment.dana}

Setelah bayar, kirim bukti transfer + ID Order ke owner:
wa.me/${require('../config').ownerNumber}

_Ketik !status ${orderId} buat cek status_
`
    };
}

function getOrderStatus(orderId) {
    const db = loadDB();
    const order = db.order.find(o => o.id === orderId);
    
    if (!order) return '❌ Order gak ditemukan!';
    
    const statusEmoji = {
        'PENDING': '⏳',
        'PAID': '💰',
        'PROCESS': '⚙️',
        'SUCCESS': '✅',
        'CANCEL': '❌'
    };
    
    return `
╔══════════════════════════════╗
║     📋 STATUS ORDER 📋      ║
╚══════════════════════════════╝

🆔 Order ID: *${order.id}*
📦 Produk: *${order.produkNama}*
💰 Total: *Rp ${order.total.toLocaleString('id-ID')}*
📅 Tanggal: ${new Date(order.tanggal).toLocaleString('id-ID')}
${statusEmoji[order.status]} Status: *${order.status}*

${order.status === 'PENDING' ? '⚠️ Segera bayar & kirim bukti ke owner!' : ''}
${order.status === 'SUCCESS' ? '✅ Terima kasih udah order!' : ''}
`;
}

function getUserHistory(userId) {
    const db = loadDB();
    const orders = db.order.filter(o => o.userId === userId);
    
    if (orders.length === 0) return '📭 Belum ada riwayat order.';
    
    let text = `
╔══════════════════════════════╗
║     📜 RIWAYAT ORDER 📜     ║
╚══════════════════════════════╝

`;
    
    orders.slice(-10).forEach((o, i) => {
        text += `
*${i + 1}. ${o.id}*
├ 📦 ${o.produkNama}
├ 💰 Rp ${o.total.toLocaleString('id-ID')}
├ 📅 ${new Date(o.tanggal).toLocaleDateString('id-ID')}
└ Status: ${o.status}
`;
    });
    
    return text;
}

module.exports = {
    createOrder,
    getOrderStatus,
    getUserHistory,
    loadDB,
    saveDB
};
