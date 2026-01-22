const express = require('express');
const { SerialPort } = require('serialport');
const { DelimiterParser } = require('@serialport/parser-delimiter'); // Final, robust parser
const Datastore = require('nedb');
const app = express();
const port = 3000;

// Initialize the persistent database
const db = new Datastore({ filename: 'water_usage.db', autoload: true });

// --- CONFIGURATION ---
// IMPORTANT: Set this to 9600 to match the final stable Arduino/NodeMCU code!
const BAUD_RATE = 9600; 
// Check Device Manager for the correct port (e.g., COM6 or COM7)
const serialPortName = 'COM6'; 
let simulationMode = false;

// --- SERIAL CONNECTION SETUP ---
function connectToArduino() {
    let serialPort; 

    // Attempt to create the SerialPort connection
    serialPort = new SerialPort({ 
        path: serialPortName, 
        baudRate: BAUD_RATE, 
        encoding: 'ascii' 
    }, (err) => {
        // --- START OF CALLBACK ---
        
        // 1. Error Handling (Connection Failed)
        if (err) {
            console.warn(`⚠️ Could not open port ${serialPortName}. Error: ${err.message}`);
            startSimulation(); // Fallback to simulation mode if connection fails
            return;
        }

        // 2. Successful Connection: Define Parser and Event Handlers
        
        // Final FIX: Using DelimiterParser with explicit Buffer to handle line endings
        const parser = serialPort.pipe(new DelimiterParser({
            delimiter: Buffer.from([0x0a, 0x0d]), // 0x0A = LF (\n), 0x0D = CR (\r)
            includeDelimiter: false, 
            encoding: 'ascii'
        }));

        // Connection Open Handler
        serialPort.on('open', () => {
            console.log(`✅ Successfully connected to Arduino on ${serialPortName} at ${BAUD_RATE} baud.`);
        });
        
        // Data Listener (Parser)
        parser.on('data', data => {
            // console.log("PARSED LINE RECEIVED:", data); // Uncomment to debug received lines
            processSensorData(data);
        });
        
        // --- END OF CALLBACK ---
    });
}


// --- SIMULATION MODE ---
function startSimulation() {
    simulationMode = true;
    console.log('\n======================================');
    console.log('🧪 Starting SIMULATION MODE: Running tests without Arduino.');
    console.log('======================================\n');
    
    // Send fake data every 1000ms (1 second)
    setInterval(() => {
        const fakeFlowTap1 = (Math.random() * 0.04) + 0.01; 
        const fakeFlowTap2 = (Math.random() * 0.05) + 0.05;
        
        processSensorData(`tap1:${fakeFlowTap1.toFixed(4)}`);
        processSensorData(`tap2:${fakeFlowTap2.toFixed(4)}`);

    }, 1000);
}

// --- DATA PROCESSING (Shared by Real Data and Simulation) ---
function processSensorData(data) {
    // REMOVED primary .trim() and accessing the raw data string
    const dataString = String(data); 
    const [tapName, flowRateStr] = dataString.split(':');
    
    // Safely trim tapName and parse flowRate
    const trimmedTapName = tapName ? tapName.trim() : null;
    const flowRateLPS = parseFloat(flowRateStr);

    // Only save data if a positive flow is detected (to keep the database clean)
    if (trimmedTapName && !isNaN(flowRateLPS) && flowRateLPS > 0) {
        const record = {
            timestamp: Date.now(),
            sensorName: trimmedTapName,
            // flowRateLPM field is used to store the L/sec value for consistency
            flowRateLPM: flowRateLPS 
        };
        db.insert(record, (err) => {
            if (err) console.error('Error saving data:', err);
        });
    }
}

// --- EXPRESS SERVER ---
app.use(express.static('public'));

// API endpoint for the website to retrieve all historical data
app.get('/api/live-data', (req, res) => {
    db.find({}).sort({ timestamp: 1 }).exec((err, docs) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch data' });
        res.json(docs);
    });
});

// Start listening for HTTP connections
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    connectToArduino(); // Attempt to connect to Arduino on startup
});