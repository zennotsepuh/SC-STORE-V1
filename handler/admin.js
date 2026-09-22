// ADMIN HANDLER - © ZenDlouis
const { loadDB, saveDB } = require('./order');
const config = require('../config');

function isAdmin(number) {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    return config.adminNumbers.some(admin => 
        cleanNumber.includes(admin) || admin.includes(cleanNumber)
    );
}

function addProduct(nama, harga, stok, kategori, deskripsi) {
    const db = loadDB();
    const newId = db.produk.length > 0 ? Math.max(...db.produk.map(p => p.id)) + 1 : 1;
    
    db.produk.push({
        id: newId,
        nama: nama,
        harga: parseInt(harga),
        stok: parseInt(stok),
        kategori: kategori,
        deskripsi: deskripsi
    });
    
    saveDB(db);
    return `✅ Produk *${nama}* berhasil ditambah!\n🆔 ID: ${newId}`;
}

function deleteProduct(id) {
    const db = loadDB();
    const idx = db.produk.findIndex(p => p.id === parseInt(id));
    
    if (idx === -1) return '❌ Produk gak ditemukan!';
    
    const nama = db.produk[idx].nama;
    db.produk.splice(idx, 1);
    saveDB(db);
    
    return `✅ Produk *${nama}* berhasil dihapus!`;
}

function updateOrderStatus(orderId, status) {
    const db = loadDB();
    const order = db.order.find(o => o.id === orderId);
    
    if (!order) return '❌ Order gak ditemukan!';
    
    order.status = status.toUpperCase();
    saveDB(db);
    
    return `✅ Status order *${orderId}* diubah jadi *${status.toUpperCase()}*`;
}

function getAllOrders() {
    const db = loadDB();
    
    if (db.order.length === 0) return '📭 Belum ada order.';
    
    let text = `
╔══════════════════════════════╗
║     📋 SEMUA ORDER 📋       ║
╚══════════════════════════════╝

`;
    
    db.order.slice(-20).forEach((o, i) => {
        text += `${i + 1}. *${o.id}* - ${o.produkNama} - ${o.status}\n`;
    });
    
    return text;
}

function getStats() {
    const db = loadDB();
    const totalProduk = db.produk.length;
    const totalOrder = db.order.length;
    const totalPendapatan = db.order
        .filter(o => o.status === 'SUCCESS')
        .reduce((sum, o) => sum + o.total, 0);
    const pendingOrder = db.order.filter(o => o.status === 'PENDING').length;
    
    return `
╔══════════════════════════════╗
║     📊 STATISTIK TOKO 📊    ║
╚══════════════════════════════╝

📦 Total Produk: *${totalProduk}*
🛒 Total Order: *${totalOrder}*
⏳ Pending Order: *${pendingOrder}*
💰 Total Pendapatan: *Rp ${totalPendapatan.toLocaleString('id-ID')}*

╔══════════════════════════════╗
║  © ${config.ownerName} - Admin Panel  
╚══════════════════════════════╝
`;
}

module.exports = {
    isAdmin,
    addProduct,
    deleteProduct,
    updateOrderStatus,
    getAllOrders,
    getStats
};
