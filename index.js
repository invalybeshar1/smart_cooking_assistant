import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import registerRoute from './routes/register.js'; 
import questionnaireRoute from './routes/questionnaire.js';
import loginRoute from './routes/login.js';
import userRoute from './routes/user.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/register', registerRoute); 
app.use('/api/questionnaire', questionnaireRoute);
app.use('/api/login', loginRoute);
app.use('/api/user', userRoute);

// Test route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
