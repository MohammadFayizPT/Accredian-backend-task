const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const salt = 10;

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, 
}));

// Create MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'accredian'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// User Registration
app.post('/register', (req, res) => {
  bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
    if (err) {
      return res.json({ Error: 'Error for hashing password' });
    }

    const sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
    const values = [req.body.username, hash, req.body.email];

    console.log(values);
    
    connection.query(sql, values, (err, result) => {
      if (err) {
        return res.json({ Error: "Inserting data Error in server" });
      }
      return res.json({ Status: "Success" });
    });
  });
});


// User Login
app.post('/login', (req, res) => {
  const sql = 'SELECT * FROM users WHERE username = ?';
  console.log(req.body);
  connection.query(sql, [req.body.username], (err, data) => {
    if (err) {
      return res.json({ Error: 'Login error in server' });
    }
    if (data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (bcryptErr, bcryptRes) => {
        if (bcryptErr) {
          return res.json({ Error: "Password compare error" });
        }
        if (bcryptRes) {
          const name = data[0].name;
          const token = jwt.sign({name}, "jwt-secret-key", {expiresIn: '1d'});
          res.cookie('token',token);
          return res.json({ Status: "Success" });
        } else {
          return res.json({ Error: "Password not matched" });
        }
      });
    } else {
      return res.json({ Error: 'No Username exists, please sign up' });
    }
  });
});

// Start the server
const PORT = 3000 || process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
