const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

async function checkTriggers() {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const FlowNode = mongoose.model('FlowNode', new mongoose.Schema({}, { strict: false }));
    const nodes = await FlowNode.find({ isRoot: true });
    
    console.log('Root Flow Triggers:');
    nodes.forEach(node => {
        console.log(`- ${node.triggerKeywords.join(', ')}`);
    });

    const Organization = mongoose.model('Organization', new mongoose.Schema({}, { strict: false }));
    const orgs = await Organization.find();
    console.log('Organizations:');
    orgs.forEach(org => {
        console.log(`- ${org.name} (Slug: ${org.slug})`);
    });

    process.exit(0);
}

checkTriggers();
