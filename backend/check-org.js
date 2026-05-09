const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  slug: String,
  name: String
});
const Organization = mongoose.model('Organization', OrganizationSchema);

async function check() {
  await mongoose.connect('mongodb://mongo:iaeHZzrSfmCglsylgIYBMDECbjdMgMrg@turntable.proxy.rlwy.net:27182/whatsapp-saas');
  const org = await Organization.findOne({ slug: 'klb-connect' });
  console.log('Org:', org);
  process.exit(0);
}

check();
