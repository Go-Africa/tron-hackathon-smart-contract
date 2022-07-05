const createKeccakHash = require('keccak')
const { tronWeb } = require("./tron.config");

function toChecksumAddress (addr) {
  let address = tronWeb.address.toHex(addr);
  address = address.toLowerCase().replace('41', '')
  var hash = createKeccakHash('keccak256').update(address).digest('hex')
  var ret = '0x'

  for (var i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}

function isAddress(address) {
  return tronWeb.isAddress(address);
}

exports.isAddress = isAddress;
exports.converter = toChecksumAddress;