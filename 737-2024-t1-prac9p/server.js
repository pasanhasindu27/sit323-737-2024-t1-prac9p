const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables (for local testing)
dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

// MongoDB connection details
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'calculatorDB';
const collectionName = 'calculations';

let dbClient;
let collection;

// Connect to MongoDB
async function connectToDB() {
    try {
        dbClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await dbClient.connect();
        const db = dbClient.db(dbName);
        collection = db.collection(collectionName);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

// Establish DB connection
connectToDB();

// Helper to validate numbers
const validateNumbers = (num1, num2 = null) => {
    const n1 = parseFloat(num1);
    const n2 = num2 !== null ? parseFloat(num2) : null;
    if (isNaN(n1) || (num2 !== null && isNaN(n2))) {
        return { error: 'Invalid numbers. Please provide valid numerical values.' };
    }
    return { num1: n1, num2: n2 };
};

// Log and respond
const performOperation = async (req, res, operation, func) => {
    const { num1, num2, error } = validateNumbers(req.query.num1, req.query.num2);
    if (error) return res.status(400).json({ error });

    const result = func(num1, num2);
    const log = {
        operation,
        num1,
        num2,
        result,
        timestamp: new Date()
    };

    try {
        await collection.insertOne(log);
    } catch (err) {
        console.error('Error saving to MongoDB:', err);
    }

    res.json({ operation, result });
};

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Advanced Calculator Microservice' });
});

app.get('/add', (req, res) => performOperation(req, res, 'addition', (a, b) => a + b));
app.get('/subtract', (req, res) => performOperation(req, res, 'subtraction', (a, b) => a - b));
app.get('/multiply', (req, res) => performOperation(req, res, 'multiplication', (a, b) => a * b));

app.get('/divide', (req, res) => {
    const { num1, num2, error } = validateNumbers(req.query.num1, req.query.num2);
    if (error) return res.status(400).json({ error });
    if (num2 === 0) return res.status(400).json({ error: 'Cannot divide by zero' });
    performOperation(req, res, 'division', (a, b) => a / b);
});

app.get('/power', (req, res) => performOperation(req, res, 'exponentiation', (a, b) => Math.pow(a, b)));

app.get('/sqrt', (req, res) => {
    const { num1, error } = validateNumbers(req.query.num1);
    if (error) return res.status(400).json({ error });
    if (num1 < 0) return res.status(400).json({ error: 'Cannot calculate square root of a negative number' });
    const result = Math.sqrt(num1);
    const log = {
        operation: 'square root',
        num1,
        num2: null,
        result,
        timestamp: new Date()
    };
    collection.insertOne(log).catch(err => console.error('DB error:', err));
    res.json({ operation: 'square root', result });
});

app.get('/mod', (req, res) => performOperation(req, res, 'modulo', (a, b) => a % b));

// History route - get last 10 operations
app.get('/history', async (req, res) => {
    try {
        const history = await collection.find().sort({ timestamp: -1 }).limit(10).toArray();
        res.json(history);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ error: 'Failed to retrieve operation history' });
    }
});

// Global error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Calculator Microservice running on port ${PORT}`);
});
