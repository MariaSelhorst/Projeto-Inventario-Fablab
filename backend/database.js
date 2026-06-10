const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '../.env')
});

const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('✅ MongoDB conectado');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

module.exports = connectDB;