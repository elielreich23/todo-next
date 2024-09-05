// Import necessary modules
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

// Express app setup
const app = express();
app.use(bodyParser.json());

// Mock database
const users = [];

// Secret key for JWT (store this in environment variables in production)
const JWT_SECRET = 'your_jwt_secret';

// Signup route
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password before saving it
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store the new user
  const newUser = { email, password: hashedPassword };
  users.push(newUser);

  // Respond with a success message
  res.status(201).json({ message: 'User registered successfully' });
});

// Signin route
app.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Compare the password with the hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Generate a JWT token
  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  // Respond with the token
  res.json({ token });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
