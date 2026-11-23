const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = require('@modelcontextprotocol/sdk/inMemory.js');

const { createBankingMcpServer } = require('../mcp/banking/server');
const { createAnalyticsMcpServer } = require('../mcp/analytics/server');
const { createSplitMcpServer } = require('../mcp/split/server');
const { createReminderMcpServer } = require('../mcp/reminders/server');
const AuditService = require('../services/auditService');

class CentralMcpClient {
  constructor() {
    this.servers = [];
    this.toolRegistry = new Map(); // toolName -> { serverName, client, toolDef }
    this.isInitialized = false;
  }

  /**
   * Initialize connections to all 4 official MCP servers
   */
  async init() {
    if (this.isInitialized) return;

    console.log('🚀 Connecting Central MCP Client to 4 MCP Servers...');

    const serverDefinitions = [
      {
        name: 'banking-mcp-server',
        displayName: 'Banking MCP Server',
        factory: createBankingMcpServer,
        icon: 'Landmark'
      },
      {
        name: 'analytics-mcp-server',
        displayName: 'Analytics MCP Server',
        factory: createAnalyticsMcpServer,
        icon: 'BarChart3'
      },
      {
        name: 'upi-split-mcp-server',
        displayName: 'UPI & Split MCP Server',
        factory: createSplitMcpServer,
        icon: 'SplitSquareVertical'
      },
      {
        name: 'reminder-mcp-server',
        displayName: 'Reminder MCP Server',
        factory: createReminderMcpServer,
        icon: 'Bell'
      }
    ];

    for (const def of serverDefinitions) {
      try {
        const serverInstance = def.factory();
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        // Connect server to transport
        await serverInstance.connect(serverTransport);

        // Connect client to paired transport
        const client = new Client(
          { name: `paisapilot-${def.name}-client`, version: '1.0.0' },
          { capabilities: {} }
        );
        await client.connect(clientTransport);

        // Dynamically discover all exposed tools
        const toolsResponse = await client.listTools();
        const discoveredTools = toolsResponse.tools || [];

        for (const tool of discoveredTools) {
          this.toolRegistry.set(tool.name, {
            serverName: def.name,
            serverDisplayName: def.displayName,
            serverIcon: def.icon,
            client,
            toolDef: tool
          });
        }

        this.servers.push({
          name: def.name,
          displayName: def.displayName,
          icon: def.icon,
          status: 'CONNECTED',
          transport: 'InMemoryTransport (Official MCP SDK)',
          toolsCount: discoveredTools.length,
          tools: discoveredTools.map(t => t.name)
        });

        console.log(`✅ [${def.displayName}] Connected with ${discoveredTools.length} tools: ${discoveredTools.map(t => t.name).join(', ')}`);
      } catch (err) {
        console.error(`❌ Failed to connect to ${def.displayName}:`, err);
        this.servers.push({
          name: def.name,
          displayName: def.displayName,
          status: 'ERROR',
          error: err.message
        });
      }
    }

    this.isInitialized = true;
    console.log(`🎯 Central MCP Client fully ready. Total tools registered: ${this.toolRegistry.size}`);
  }

  /**
   * Get list of all discovered tools
   */
  getTools() {
    return Array.from(this.toolRegistry.entries()).map(([name, entry]) => ({
      name,
      serverName: entry.serverName,
      serverDisplayName: entry.serverDisplayName,
      serverIcon: entry.serverIcon,
      description: entry.toolDef.description,
      inputSchema: entry.toolDef.inputSchema
    }));
  }

  /**
   * Get status of all MCP servers
   */
  getServersStatus() {
    return this.servers;
  }

  /**
   * Execute an MCP tool via its registered server
   */
  async executeTool(toolName, args = {}, sessionId = 'session_default') {
    if (!this.isInitialized) {
      await this.init();
    }

    const entry = this.toolRegistry.get(toolName);
    if (!entry) {
      throw new Error(`MCP Tool '${toolName}' not found in any registered MCP server.`);
    }

    const startTime = Date.now();
    try {
      console.log(`⚡ [MCP EXECUTE] Calling ${entry.serverName} -> ${toolName} with:`, JSON.stringify(args));
      
      const response = await entry.client.callTool({
        name: toolName,
        arguments: args
      });

      const durationMs = Date.now() - startTime;

      // Extract result content
      let parsedResult = null;
      if (response && response.content && response.content.length > 0) {
        const textContent = response.content[0].text;
        try {
          parsedResult = JSON.parse(textContent);
        } catch {
          parsedResult = textContent;
        }
      }

      console.log(`✅ [MCP SUCCESS] ${toolName} completed in ${durationMs}ms`);

      return {
        success: true,
        serverName: entry.serverName,
        serverDisplayName: entry.serverDisplayName,
        toolName,
        args,
        durationMs,
        result: parsedResult,
        rawResponse: response
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error(`❌ [MCP ERROR] ${toolName} failed after ${durationMs}ms:`, err);
      return {
        success: false,
        serverName: entry.serverName,
        serverDisplayName: entry.serverDisplayName,
        toolName,
        args,
        durationMs,
        error: err.message
      };
    }
  }
}

// Export singleton instance
const centralMcpClient = new CentralMcpClient();
module.exports = centralMcpClient;
