const dns = require('dns');
const mongoose = require('mongoose');

// Khắc phục lỗi querySrv EBADRESP trên Windows khi phân giải DNS SRV của MongoDB Atlas
if (typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('[DB] Không thể đặt DNS công cộng:', err.message);
  }
}

const connectDB = async (uri) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
};

module.exports = connectDB;
