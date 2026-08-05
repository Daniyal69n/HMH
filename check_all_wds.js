const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const withdrawTxs = await db.collection('transactions').find({ type: /withdraw/i }).toArray();
  console.log('Total withdraw txs in transactions collection:', withdrawTxs.length);

  withdrawTxs.forEach((t, i) => {
    console.log('[Tx ' + (i+1) + '] User: ' + t.userId + ' | Amt: ' + t.amount + ' | Status: ' + t.status + ' | Date: ' + t.createdAt + ' | Desc: ' + t.description);
  });

  const users = await db.collection('users').find({ withdrawHistory: { $exists: true } }).toArray();
  let totalUserWds = 0;
  users.forEach(u => {
    if (u.withdrawHistory && u.withdrawHistory.length > 0) {
      totalUserWds += u.withdrawHistory.length;
      console.log('User: ' + u.phone + ' (' + u.name + ') has ' + u.withdrawHistory.length + ' items in user.withdrawHistory:', u.withdrawHistory);
    }
  });
  console.log('Total items inside user.withdrawHistory arrays across all users:', totalUserWds);

  process.exit(0);
}

check().catch(console.error);
