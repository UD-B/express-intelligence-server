const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// --- CONSTANTS & PATHS ---
const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
    users: path.join(DATA_DIR, 'users.json'),
    agents: path.join(DATA_DIR, 'agents.json'),
    reports: path.join(DATA_DIR, 'reports.json')
};

// --- MISSION 4: IO UTILS & INITIALIZATION [cite: 39] ---

// Ensure data folder and files exist on startup [cite: 42]
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

Object.values(FILES).forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '[]'); // Initialize with empty array
    }
});

// Helper: Read Data
const readData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        return [];
    }
};

// Helper: Write Data (Read-Modify-Write strategy) [cite: 44]
const writeData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// --- MISSION 3: AUTH MIDDLEWARE [cite: 30] ---
const authMiddleware = (req, res, next) => {
    const username = req.headers['x-username'];
    const password = req.headers['x-password'];

    if (!username || !password) {
        return res.status(401).json({ error: 'Missing credentials' }); // [cite: 71]
    }

    const users = readData(FILES.users);
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' }); // [cite: 38]
    }

    next();
};

// --- ROUTES ---

// Health Check [cite: 47]
app.get('/health', (req, res) => res.json({ ok: true }));

// ==========================
// USERS CRUD (Protected) [cite: 32]
// ==========================
app.use('/users', authMiddleware); // Protect all user routes

app.get('/users', (req, res) => {
    const users = readData(FILES.users);
    // Return users without passwords for security
    res.json(users.map(({ password, ...u }) => u)); 
});

app.post('/users', (req, res) => { // [cite: 51]
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const users = readData(FILES.users);
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Username exists' }); // [cite: 75]
    }

    const newUser = { username, password };
    users.push(newUser);
    writeData(FILES.users, users);
    res.status(201).json({ message: 'User created' });
});

// ==========================
// AGENTS CRUD
// ==========================

// GET Agents (Public decision based on Mission 2) [cite: 56]
app.get('/agents', (req, res) => {
    res.json(readData(FILES.agents));
});

app.get('/agents/:id', (req, res) => {
    const agents = readData(FILES.agents);
    const agent = agents.find(a => a.id === req.params.id);
    agent ? res.json(agent) : res.status(404).json({ error: 'Agent not found' });
});

// Protected Agent Routes
app.post('/agents', authMiddleware, (req, res) => { // [cite: 58]
    const { id, name, nickname } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'Missing fields' });

    const agents = readData(FILES.agents);
    if (agents.find(a => a.id === id)) {
        return res.status(409).json({ error: 'Agent ID exists' }); // [cite: 75]
    }

    // Initialize reportsCount to 0 [cite: 105]
    const newAgent = { id, name, nickname, reportsCount: 0 };
    agents.push(newAgent);
    writeData(FILES.agents, agents);
    res.status(201).json(newAgent);
});

app.put('/agents/:id', authMiddleware, (req, res) => {
    const agents = readData(FILES.agents);
    const index = agents.findIndex(a => a.id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Agent not found' });

    // Update only allowed fields (preserve reportsCount)
    agents[index] = { ...agents[index], ...req.body, id: agents[index].id, reportsCount: agents[index].reportsCount };
    writeData(FILES.agents, agents);
    res.json(agents[index]);
});

app.delete('/agents/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const agents = readData(FILES.agents);
    const reports = readData(FILES.reports);

    // Business Logic: Cannot delete agent if they have reports [cite: 81]
    const hasReports = reports.some(r => r.agentId === id);
    if (hasReports) {
        return res.status(400).json({ error: 'Cannot delete agent with existing reports' });
    }

    const newAgents = agents.filter(a => a.id !== id);
    if (agents.length === newAgents.length) return res.status(404).json({ error: 'Agent not found' });

    writeData(FILES.agents, newAgents);
    res.json({ message: 'Agent deleted' });
});

// ==========================
// REPORTS CRUD
// ==========================

app.get('/reports', (req, res) => { // [cite: 65]
    res.json(readData(FILES.reports));
});

app.post('/reports', authMiddleware, (req, res) => { // [cite: 95]
    const { id, date, content, agentId } = req.body;
    
    // Validation
    if (!id || !date || !content || !agentId) return res.status(400).json({ error: 'Missing fields' });

    const reports = readData(FILES.reports);
    if (reports.find(r => r.id === id)) return res.status(409).json({ error: 'Report ID exists' });

    // Critical Business Logic: Agent must exist [cite: 28]
    const agents = readData(FILES.agents);
    const agentIndex = agents.findIndex(a => a.id === agentId);
    if (agentIndex === -1) return res.status(400).json({ error: 'Invalid Agent ID' });

    // Create Report
    const newReport = { id, date, content, agentId };
    reports.push(newReport);
    writeData(FILES.reports, reports);

    // Update Agent's reportsCount [cite: 28]
    agents[agentIndex].reportsCount += 1;
    writeData(FILES.agents, agents);

    res.status(201).json(newReport);
});

app.delete('/reports/:id', authMiddleware, (req, res) => { // [cite: 67]
    const { id } = req.params;
    const reports = readData(FILES.reports);
    const reportIndex = reports.findIndex(r => r.id === id);

    if (reportIndex === -1) return res.status(404).json({ error: 'Report not found' });

    const report = reports[reportIndex];
    
    // Business Logic: Decrement agent count on delete [cite: 64]
    const agents = readData(FILES.agents);
    const agentIndex = agents.findIndex(a => a.id === report.agentId);
    
    if (agentIndex !== -1) {
        agents[agentIndex].reportsCount = Math.max(0, agents[agentIndex].reportsCount - 1);
        writeData(FILES.agents, agents);
    }

    reports.splice(reportIndex, 1);
    writeData(FILES.reports, reports);
    
    res.json({ message: 'Report deleted' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data folder: ${DATA_DIR}`);
});