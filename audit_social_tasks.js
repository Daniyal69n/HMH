const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BSON = require('bson');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();

  let base64Count = 0;
  let totalBase64Size = 0;
  let largestBase64Size = 0;
  
  // To rank top largest fields globally
  const fieldSizes = {};
  
  // Track document level stats
  let totalDocumentSize = 0;
  let largestDocumentSize = 0;
  
  const userStats = [];

  const arrayFields = ['investmentPlans', 'socialTaskSubmissions', 'rechargeHistory', 'withdrawHistory', 'teamMembers', 'notifications'];
  const arrayStats = {};
  for (const field of arrayFields) {
    arrayStats[field] = { totalLen: 0, maxLen: 0, maxUserId: null, maxUserPhone: null };
  }

  for (const u of users) {
    const docSize = BSON.calculateObjectSize(u);
    totalDocumentSize += docSize;
    if (docSize > largestDocumentSize) {
      largestDocumentSize = docSize;
    }
    
    // Array lengths
    for (const field of arrayFields) {
      if (Array.isArray(u[field])) {
        const len = u[field].length;
        arrayStats[field].totalLen += len;
        if (len > arrayStats[field].maxLen) {
          arrayStats[field].maxLen = len;
          arrayStats[field].maxUserId = u._id.toString();
          arrayStats[field].maxUserPhone = u.phone;
        }
      }
    }

    let userLargestField = { name: '', size: 0 };
    const userFieldSizes = {};
    
    // Rank all fields globally and per-user
    for (const key of Object.keys(u)) {
      if (!fieldSizes[key]) fieldSizes[key] = 0;
      
      let fieldSize = 0;
      try {
        fieldSize = BSON.calculateObjectSize({ [key]: u[key] });
      } catch (e) {
         fieldSize = Buffer.byteLength(JSON.stringify(u[key] || ''), 'utf8');
      }
      
      fieldSizes[key] += fieldSize;
      userFieldSizes[key] = fieldSize;
      
      if (fieldSize > userLargestField.size) {
        userLargestField = { name: key, size: fieldSize };
      }
    }
    
    userStats.push({
      id: u._id.toString(),
      name: u.name,
      phone: u.phone,
      sizeBytes: docSize,
      sizeMB: (docSize / (1024 * 1024)).toFixed(3),
      largestField: userLargestField,
      fields: userFieldSizes
    });

    // Audit socialTaskSubmissions for base64
    if (Array.isArray(u.socialTaskSubmissions)) {
      for (const sub of u.socialTaskSubmissions) {
        if (typeof sub.screenshotBase64 === 'string' && sub.screenshotBase64.includes('base64')) {
          base64Count++;
          const strSize = Buffer.byteLength(sub.screenshotBase64, 'utf8') + 5;
          totalBase64Size += strSize;
          if (strSize > largestBase64Size) {
            largestBase64Size = strSize;
          }
        }
      }
    }
  }
  
  userStats.sort((a, b) => b.sizeBytes - a.sizeBytes);
  const top10Users = userStats.slice(0, 10);

  const totalUsers = users.length;
  const avgDocumentSize = totalUsers > 0 ? Math.round(totalDocumentSize / totalUsers) : 0;
  const avgBase64Size = base64Count > 0 ? Math.round(totalBase64Size / base64Count) : 0;

  // Convert fieldSizes dict to sorted array
  const sortedFields = Object.keys(fieldSizes).map(key => {
    return {
      field: key,
      sizeBytes: fieldSizes[key],
      sizeMB: (fieldSizes[key] / (1024 * 1024)).toFixed(3),
      percentage: ((fieldSizes[key] / totalDocumentSize) * 100).toFixed(2)
    };
  }).sort((a, b) => b.sizeBytes - a.sizeBytes);

  console.log('========================');
  console.log('FETCH COST ESTIMATE');
  console.log('========================');
  console.log(`Total Users Read: ${totalUsers}`);
  console.log(`Total BSON Read: ${(totalDocumentSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Average BSON Per User: ${(avgDocumentSize / 1024).toFixed(2)} KB`);
  console.log(`Largest BSON Document: ${(largestDocumentSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log('');

  console.log('--- STORAGE AUDIT REPORT ---');
  console.log('Total Number of Users:', totalUsers);
  console.log('Average Document Size:', avgDocumentSize, '(' + (avgDocumentSize / 1024).toFixed(2) + ' KB)');
  console.log('Largest Document Size:', largestDocumentSize, '(' + (largestDocumentSize / (1024 * 1024)).toFixed(2) + ' MB)');
  console.log('Total Collection Size:', totalDocumentSize, '(' + (totalDocumentSize / (1024 * 1024)).toFixed(2) + ' MB)');
  console.log('-----------------------------------');
  console.log('Base64 Images Count:', base64Count);
  console.log('Total Base64 Size:', totalBase64Size, '(' + (totalBase64Size / 1024 / 1024).toFixed(2) + ' MB)');
  console.log('Average Image Size:', avgBase64Size, '(' + (avgBase64Size / 1024).toFixed(2) + ' KB)');
  console.log('Largest Image Size:', largestBase64Size, '(' + (largestBase64Size / 1024 / 1024).toFixed(2) + ' MB)');
  
  const top1 = sortedFields[0];
  const consumesMore = top1.field !== 'socialTaskSubmissions';
  console.log('Any other field consumes more storage than socialTaskSubmissions?', consumesMore ? `Yes (${top1.field})` : 'No');
  
  console.log('\n--- PERCENTAGE CONTRIBUTION BY FIELD ---');
  for (const f of sortedFields) {
    if (f.sizeBytes > 1024 * 1024 || ['socialTaskSubmissions', 'investmentPlans', 'rechargeHistory', 'withdrawHistory', 'teamMembers', 'notifications', 'profilePicture'].includes(f.field)) {
      console.log(`${f.field}: ${f.sizeMB} MB (${f.percentage}%)`);
    }
  }

  console.log('\n--- TOP 10 LARGEST FIELDS GLOBALLY ---');
  for (let i = 0; i < Math.min(10, sortedFields.length); i++) {
    console.log(`${i + 1}. ${sortedFields[i].field}: ${sortedFields[i].sizeBytes} bytes (${sortedFields[i].sizeMB} MB) - ${sortedFields[i].percentage}%`);
  }
  
  console.log('\n--- ARRAY LENGTH METRICS ---');
  for (const field of arrayFields) {
    const stats = arrayStats[field];
    const avgLen = totalUsers > 0 ? (stats.totalLen / totalUsers).toFixed(2) : 0;
    console.log(`${field}:`);
    console.log(`  Average Length: ${avgLen}`);
    console.log(`  Max Length: ${stats.maxLen} (User ID: ${stats.maxUserId} / Phone: ${stats.maxUserPhone})`);
  }
  
  console.log('\n--- TOP 10 LARGEST USER DOCUMENTS ---');
  const targetFields = ['investmentPlans', 'socialTaskSubmissions', 'rechargeHistory', 'withdrawHistory', 'teamMembers', 'notifications', 'profilePicture'];
  for (let i = 0; i < top10Users.length; i++) {
    const u = top10Users[i];
    console.log(`\nUser: ${u.id}`);
    console.log(`Document Size: ${u.sizeMB} MB\n`);
    for (const f of targetFields) {
       const fieldSize = u.fields[f] || 0;
       console.log(`${f}: ${(fieldSize / (1024 * 1024)).toFixed(2)} MB`);
    }
    console.log(`\nLargest field inside this document: ${u.largestField.name}`);
  }

  console.log('\n========================');
  console.log('ROOT CAUSE SUMMARY');
  console.log('========================');
  console.log(`Largest field across the collection:\n${top1.field}`);
  console.log(`\nTotal BSON consumed:\n${top1.sizeMB} MB`);
  console.log(`\nPercentage of total collection:\n${top1.percentage}%`);
  console.log(`\nLargest single user document:\n${(top10Users[0] ? top10Users[0].sizeMB : 0)} MB`);
  console.log(`\nLargest field inside that document:\n${(top10Users[0] ? top10Users[0].largestField.name : '')}`);

  process.exit(0);
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
