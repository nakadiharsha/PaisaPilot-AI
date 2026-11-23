require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./database/db');
const { seedDatabase } = require('./database/seed');
const centralMcpClient = require('./agent/mcpClient');
const apiRoutes = require('./routes/api');
const agentRoutes = require('./routes/agent');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database schema and ensure seed exists
try {
  initSchema();
  // If accounts table is empty, auto-seed
  const { db } = require('./database/db');
  const countRes = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
  if (!countRes || countRes.count === 0) {
    console.log('No accounts found, automatically seeding database...');
    seedDatabase();
  }
} catch (err) {
  console.error('Error during database verification:', err);
}

// Mount API routes
app.use('/api', apiRoutes);
app.use('/api/agent', agentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'PaisaPilot AI Server',
    mcpServers: 4,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  // If API route not found, let Express handle 404
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('PaisaPilot Client Build not found. In development, run Vite on port 5173.');
    }
  });
});

// Start server
async function startServer() {
  try {
    // Pre-initialize MCP connections
    await centralMcpClient.init();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 PaisaPilot AI Backend Server running on port ${PORT}`);
      console.log(`🌐 API Endpoints: http://localhost:${PORT}/api`);
      console.log(`🤖 AI Copilot:    http://localhost:${PORT}/api/agent/chat`);
      console.log(`🔗 MCP Status:    http://localhost:${PORT}/api/mcp/status`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start PaisaPilot server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
