const express = require('express');
const dgram = require('dgram');
var buffer = require('./components/seach_controller');
const reversal_buf = require('./components/reverse_buffer');


const app = express();
const udpClient = dgram.createSocket('udp4');

const UDP_PORT = 60000;                   
udpClient.lastMessage = [];
let controller_serial_no;
let controller_serial_no_str;

udpClient.bind(() => {
  udpClient.on('message', (msg, rinfo) => {
    console.log(`UDP response from ${rinfo.address}:${rinfo.port} - ${msg.toString()}`);
    if (msg[1] == 0x94){
    // Store response for further use in the route
    controller_serial_no = Buffer.copyBytesFrom(msg, 4, 4);
    controller_serial_no = reversal_buf.Reverse(controller_serial_no);
    controller_serial_no_str = parseInt(controller_serial_no.toString('hex'),16);
    console.log(controller_serial_no_str);
    udpClient.lastMessage.push(controller_serial_no_str);
    }
  });
});
// Endpoint that React app will call
app.get('/api/send-udp', (req, res) => {  
  udpClient.setBroadcast(true);
  udpClient.lastMessage = [];
  // Send UDP message 
  var buf = buffer.GetBuffer();
  udpClient.send(buf, 0, buf.length, UDP_PORT, '255.255.255.255', (err) => {
    if (err) {
      console.error('Error sending UDP message:', err);
      res.status(500).json({ message: 'Failed to send UDP message' });
    } else {
      console.log('UDP message sent successfully');
    }
  });
  

  setTimeout(() => {
    if (udpClient.lastMessage.length > 0 ) {
      //res.json({ message: udpClient.lastMessage });
      res.json(udpClient.lastMessage);
    } else {
      res.status(500).json({ message: 'No UDP response received' });
    }
  }, 2000); 
 
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
