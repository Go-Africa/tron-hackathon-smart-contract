const TronWeb = require('tronweb');
require('dotenv').config({ path: '.env' });
const tronWeb = new TronWeb({
    fullHost: 'https://api.nileex.io',
    // headers: { "TRON-PRO-API-KEY": 'your api key' },
    privateKey: process.env.PRIVATE_KEY_NILE
});
exports.tronWeb = tronWeb;