const { Buffer } = require('node:buffer');

var buf = Buffer.allocUnsafe(64);
buf[0]  = 0x19;
buf[1]  = 0x94;


exports.GetBuffer = function() {
    return buf;
}