
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));

// Route for specific user requests
app.get('/user/:id', (req, res) => {
  // Log the user ID
  console.log("User ID requested:", req.params.id);
  
  // For now, we send the index.html; later it will return user data.
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Test route to verify server functionality
app.get('/test', (req, res) => {
  res.send('Test route works!');
});

// Error handling middleware for server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!'); 
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});