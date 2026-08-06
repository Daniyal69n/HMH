const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.hmh.3mzzggw.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("SRV Lookup Error:", err);
  } else {
    console.log("SRV Addresses:", addresses);
    dns.resolveTxt('hmh.3mzzggw.mongodb.net', (err, txts) => {
      if (err) console.error("TXT Lookup Error:", err);
      else console.log("TXT Records:", txts);
    });
  }
});
