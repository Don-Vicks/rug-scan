import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Config (Set this in a .env file or directly here)
const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY || '';

// Solscan API Base
const SOLSCAN_BASE = 'https://public-api.solscan.io';

// Create server instance
const server = new McpServer({
  name: "RugScan",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

import axios from 'axios';

// Types
interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
}

interface HolderInfo {
  address: string;
  amount: number;
}

interface TokenRiskReport {
  mintAddress: string;
  riskScore: number; // 0 (safe) to 100 (high risk)
  flags: string[];
  summary: string;
}

// Fetch Token Metadata
async function fetchTokenMetadata(mintAddress: string): Promise<TokenMetadata> {
  try {
    const res = await axios.get(`${SOLSCAN_BASE}/token/meta?tokenAddress=${mintAddress}`, {
      headers: {
        'accept': 'application/json',
        'token': SOLSCAN_API_KEY,
      },
    });

    const data = res.data;

    return {
      name: data.name || 'Unknown',
      symbol: data.symbol || '???',
      decimals: data.decimals || 0,
      mintAuthority: data.owner || null,
      freezeAuthority: data.freezeAuthority || null,
    };
  } catch (err) {
    throw new Error(`Failed to fetch token metadata: ${err}`);
  }
}

// Fetch Token Holders
async function fetchTopHolders(mintAddress: string): Promise<HolderInfo[]> {
  try {
    const res = await axios.get(`${SOLSCAN_BASE}/token/holders?tokenAddress=${mintAddress}&limit=10`, {
      headers: {
        'accept': 'application/json',
        'token': SOLSCAN_API_KEY,
      },
    });

    return res.data.data.map((holder: any) => ({
      address: holder.owner,
      amount: parseFloat(holder.amount),
    }));
  } catch (err) {
    throw new Error(`Failed to fetch token holders: ${err}`);
  }
}

// Risk Assessment Logic
function assessRisk(
  mintAddress: string,
  metadata: TokenMetadata,
  holders: HolderInfo[]
): TokenRiskReport {
  let riskScore = 0;
  const flags: string[] = [];

  if (metadata.mintAuthority) {
    riskScore += 30;
    flags.push('Mint authority not renounced');
  }

  if (metadata.freezeAuthority) {
    riskScore += 20;
    flags.push('Freeze authority present');
  }

  const totalHeld = holders.reduce((sum, h) => sum + h.amount, 0);
  const topHolder = holders[0];
  if (topHolder && totalHeld > 0 && topHolder.amount / totalHeld > 0.5) {
    riskScore += 25;
    flags.push('Top holder owns > 50% of supply');
  }

  if (holders.length < 5) {
    riskScore += 10;
    flags.push('Low number of holders');
  }

  if (riskScore > 100) riskScore = 100;

  const summary = flags.length > 0 ? flags.join('; ') : 'No critical risk factors detected.';

  return {
    mintAddress,
    riskScore,
    flags,
    summary,
  };
}

// Entry point to scan a token
export async function scanToken(mintAddress: string): Promise<TokenRiskReport> {
  try {
    const metadata = await fetchTokenMetadata(mintAddress);
    const holders = await fetchTopHolders(mintAddress);
    const report = assessRisk(mintAddress, metadata, holders);
    return report;
  } catch (err) {
    throw new Error(`Token scan failed: ${err}`);
  }
}


server.tool(
    "scanToken",
    "Scan a token for potential issues or risks",
    {
      mintAddress: z.string().describe("The mint address of the token"),
    },
    async ({ mintAddress }) => {
      try {
        const scanResult = await scanToken(mintAddress);
        if (!scanResult) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to scan token: ${mintAddress}`,
              },
            ],
          };
        }
        
        const issues = scanResult
        
        if (!issues) {
          return {
            content: [
              {
                type: "text",
                text: `No issues found for token: ${mintAddress}\n\n`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Token Scan Results for ${mintAddress}:\n\n` +
                    `Risk Score: ${scanResult.riskScore || 'Unknown'}\n\n` +
                    `Flags: ${scanResult.flags.join(', ')}` +
                    `\nIdentified Issues:\n${scanResult.summary}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to scan token:`,
            },
          ],
        };
      }
    },
  );

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });


  