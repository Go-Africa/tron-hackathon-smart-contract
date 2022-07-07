const TronWeb = require('tronweb');
require('dotenv').config({ path: '.env' });
const tronWeb = new TronWeb({
    fullHost: 'https://api.nileex.io',
    // headers: { "TRON-PRO-API-KEY": 'your api key' },
    privateKey: "24a6da2e40f392be1ef0f102b2918ae47b72b64122704c041a5e6a296f9b262a"
});
exports.tronWeb = tronWeb;
