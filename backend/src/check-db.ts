import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = 'mongodb://mongo:iaeHZzrSfmCglsylgIYBMDECbjdMgMrg@turntable.proxy.rlwy.net:27182/whatsapp-saas';

async function checkCollections() {
  console.log('Connecting to:', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');
    
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Collections in database:', collections.map(c => c.name));
      
      if (collections.length === 0) {
        console.log('NO COLLECTIONS FOUND!');
      }
    } else {
      console.log('Database connection not fully established');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCollections();
