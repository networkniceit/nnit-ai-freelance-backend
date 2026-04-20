// scripts/mongo-test-seed.js
const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');

const uri = process.env.MONGODB_URI;
if(!uri){
  console.error('MONGODB_URI not set in environment.');
  process.exit(1);
}

async function run(seed){
  try{
    console.log('Connecting to', uri);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');
    if(seed){
      console.log('Seeding sample Transaction and Invoice documents...');
      await Transaction.create([
        { txId: 'tx_seed_001', amount: 500, currency: 'USD', type: 'credit', date: new Date('2026-01-01') },
        { txId: 'tx_seed_002', amount: 150, currency: 'USD', type: 'debit', date: new Date('2026-01-05') },
        { txId: 'tx_seed_003', amount: 1200, currency: 'USD', type: 'credit', date: new Date('2026-01-10') }
      ]).catch(e=>console.warn('Some transactions may already exist:', e.message));

      await Invoice.create([
        { invoiceId: 'inv_seed_001', amount: 750, currency: 'USD', status: 'unpaid', dueDate: new Date('2026-02-01') },
        { invoiceId: 'inv_seed_002', amount: 300, currency: 'USD', status: 'paid', dueDate: new Date('2026-01-15') }
      ]).catch(e=>console.warn('Some invoices may already exist:', e.message));

      console.log('Seed complete.');
    }
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  }catch(err){
    console.error('Mongo connection or operation failed:', err.message);
    process.exit(2);
  }
}

const seed = process.argv.includes('--seed');
run(seed);
