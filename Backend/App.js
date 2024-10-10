require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcryptjs');

//Kanchana Aiya
const dgram = require('dgram');
var buffer = require('./components/seach_controller');
const reversal_buf = require('./components/reverse_buffer');
const udpClient = dgram.createSocket('udp4');

const UDP_PORT = 60000;                   
udpClient.lastMessage = [];
let controller_serial_no;
let controller_serial_no_str;

////End define kanchana aiya

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Configure database connection
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    options: {
        encrypt: true, 
        trustServerCertificate: true,
    }
    
};

// Connect to the database
sql.connect(dbConfig).catch(err => console.log("Database connection error:", err));

app.post('/register', async (req, res) => {
    const { User_Id, User_Name, User_Password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Check if User_Id already exists
        const existingUser = await pool.request()
            .input('User_Id', sql.VarChar, User_Id)
            .query('SELECT * FROM Users WHERE User_Id = @User_Id');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: 'User ID already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(User_Password, 10);

        // Insert the new user
        await pool.request()
            .input('User_Id', sql.VarChar, User_Id)
            .input('User_Name', sql.VarChar, User_Name)
            .input('User_Password', sql.VarChar, hashedPassword)
            .query('INSERT INTO Users (User_Id, User_Name, User_Password) VALUES (@User_Id, @User_Name, @User_Password)');

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
});

app.get('/users', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT User_Id, User_Name FROM Users');
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

app.put('/updateUser', async (req, res) => {
    const { User_Id, User_Name, User_Password } = req.body;
    console.log('name>>'+user_name+'<<pass>>'+user_password) 
    try {
        const pool = await sql.connect(dbConfig);

        // If password is provided, hash it
        let query = '';
        if (User_Password) {
            const hashedPassword = await bcrypt.hash(User_Password, 10);
            query = `UPDATE Users SET User_Name = @User_Name, User_Password = @User_Password WHERE User_Id = @User_Id`;
            await pool.request()
                .input('User_Id', sql.VarChar, User_Id)
                .input('User_Name', sql.VarChar, User_Name)
                .input('User_Password', sql.VarChar, hashedPassword)
                .query(query);
        } else {
            query = `UPDATE Users SET User_Name = @User_Name WHERE User_Id = @User_Id`;
            await pool.request()
                .input('User_Id', sql.VarChar, User_Id)
                .input('User_Name', sql.VarChar, User_Name)
                .query(query);
        }

        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating user', error: err.message });
    }
});

app.delete('/deleteUser/:User_Id', async (req, res) => {
    const { User_Id } = req.params;

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('User_Id', sql.VarChar, User_Id)
            .query('DELETE FROM Users WHERE User_Id = @User_Id');

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
});

// User login
app.post('/login', async (req, res) => {
    const { user_name, user_password } = req.body; 
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('user_name', sql.VarChar, user_name)  // Updated to use lowercase
            .query('SELECT * FROM Users WHERE user_name = @user_name');  // Updated query

        const user = result.recordset[0];
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare the password using bcrypt
        const isMatch = await bcrypt.compare(user_password, user.user_password);  // Updated to use lowercase
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Password' });
        }

        res.status(200).json({
            message: 'Successfully logged in',
            user: {
                id: user.User_id,
                username: user.user_name  // Updated to use lowercase
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
});

app.post('/createCard', async (req, res) => {
    const { Card_Id, kcc_Id, Max_Amount,Card_Status, Acces_Status } = req.body;
 
    try {
        const pool = await sql.connect(dbConfig);

        // Check if the Card_Id already exists
        const existingCard = await pool.request()
            .input('Card_Id', sql.Int, Card_Id)
            .query('SELECT * FROM Cards WHERE Card_Id = @Card_Id');

        if (existingCard.recordset.length > 0) {
            return res.status(400).json({ message: 'Card ID already exists' });
        }

        // Check if the kcc_Id already exists
        const existingKcc = await pool.request()
            .input('kcc_Id', sql.Int, kcc_Id)
            .query('SELECT * FROM Cards WHERE kcc_Id = @kcc_Id');

        if (existingKcc.recordset.length > 0) {
            return res.status(400).json({ message: 'kcc_Id already exists' });
        }

        // Insert new card details into the Cards table
        await pool.request()
            .input('Card_Id', sql.Int, Card_Id)
            .input('kcc_Id', sql.Int, kcc_Id)
            .input('Max_Amount', sql.Int, Max_Amount)
            .input('Card_Status', sql.VarChar, Card_Status)
            .input('Acces_Status', sql.VarChar, Acces_Status)
            .query('INSERT INTO Cards (Card_Id, kcc_Id,Max_Amount, Card_Status, Acces_Status) VALUES (@Card_Id, @kcc_Id,@Max_Amount, @Card_Status, @Acces_Status)');

        res.status(201).json({ message: 'Card created successfully' });
    } catch (err) {
        console.error('Error adding card:', err.message);
        res.status(500).json({ message: 'Error creating card', error: err.message });
    }
});


app.get('/getCards', async (req, res) => {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request().query('SELECT * FROM Cards');
      //console.log('Database Result:', result.recordset); 
      res.status(200).json(result.recordset);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching cards', error: err.message });
    } finally {
      sql.close();
    }
  });
  
  
  // Delete a card
  app.delete('/deleteCard/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await sql.connect(dbConfig);
      await pool.request()
        .input('Card_Id', sql.Int, id)
        .query('DELETE FROM Cards WHERE Card_Id = @Card_Id');
      res.status(200).json({ message: 'Card deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting card', error: err.message });
    } finally {
      sql.close();
    }
  });
  

// Update card
app.put('/updateCard', async (req, res) => {
    const { Card_Id, kcc_Id, Max_Amount, Card_Status, Acces_Status } = req.body;
    try {
        const pool = await sql.connect(dbConfig);

        const existingKcc = await pool.request()
            .input('kcc_Id', sql.Int, kcc_Id)
            .input('Card_Id', sql.Int, Card_Id)
            .query('SELECT * FROM Cards WHERE kcc_Id = @kcc_Id AND Card_Id != @Card_Id');
        
        if (existingKcc.recordset.length > 0) {
            return res.status(400).json({ message: 'kcc_Id already exists for another card' });
        }
        
        // First, retrieve the current kcc_Id for the card if it's not provided
        let currentKccId = kcc_Id;

        if (!kcc_Id) {
            const cardQuery = await pool.request()
                .input('Card_Id', sql.Int, Card_Id)
                .query('SELECT kcc_Id FROM Cards WHERE Card_Id = @Card_Id');
            
            if (cardQuery.recordset.length > 0) {
                currentKccId = cardQuery.recordset[0].kcc_Id; 
            } else {
                return res.status(404).json({ message: 'Card not found' });
            }
        }

        // Proceed with the update using the existing or new kcc_Id
        const updateResult = await pool.request()
            .input('Card_Id', sql.Int, Card_Id)
            .input('kcc_Id', sql.Int, currentKccId)  // Use current or new kcc_Id
            .input('Max_Amount', sql.Int, Max_Amount)
            .input('Card_Status', sql.VarChar, Card_Status)
            .input('Acces_Status', sql.VarChar, Acces_Status)
            .query('UPDATE Cards SET kcc_Id = @kcc_Id, Max_Amount = @Max_Amount, Card_Status = @Card_Status, Acces_Status = @Acces_Status WHERE Card_Id = @Card_Id');

        res.status(200).json({ message: 'Card updated successfully' });
    } catch (error) {
        console.error('Error during card update:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        sql.close(); 
    }
});

/////Funtion Start kanchana aiya
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
app.get('/send-udp', (req, res) => {  
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

/////End of kanchana aiya
  

// Connect to the database and start server only if connected successfully
sql.connect(dbConfig)
    .then(() => {
        console.log('Connected to the database');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            const serverAddress = `http://localhost:${PORT}`;
            console.log(`Server is running at ${serverAddress}`);
        });
    })
    .catch(err => {
        console.log('Database connection error:', err);
    });
