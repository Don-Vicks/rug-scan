import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Config (Set this in a .env file or directly here)
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/';
const API_KEY = '0adb45e1-d6d9-4afb-83db-db3e0c856fe5'; // Replace with your Helius API key
// Create server instance
const server = new McpServer({
    name: "RugScan",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Fetch Token Metadata using Helius RPC
async function getAsset(mintAddress) {
    const response = await fetch(`${HELIUS_RPC_URL}?api-key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: '1',
            method: 'getAsset',
            params: {
                id: mintAddress,
            },
        }),
    });
    const data = await response.json();
    const result = data.result;
    const name = result.content?.metadata?.name || 'Unknown';
    const symbol = result.content?.metadata?.symbol || 'Unknown';
    const supply = result.token_info?.supply || 0;
    const decimals = result.token_info?.decimals || 0;
    const authorities = result.authorities?.map((auth) => auth.address) || [];
    return { name, symbol, supply, decimals, authorities };
}
// Fetch Token Holders using Helius RPC
async function getTokenLargestAccounts(mintAddress) {
    const response = await fetch(`${HELIUS_RPC_URL}?api-key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: '1',
            method: 'getTokenLargestAccounts',
            params: [mintAddress],
        }),
    });
    const data = await response.json();
    const holders = data.result.value;
    return holders.map((holder) => ({
        address: holder.address,
        amount: parseFloat(holder.uiAmountString),
        percent: 0, // Will be calculated later
    }));
}
// Risk Assessment Logic
function analyzeRisks(metadata, holders, mintAddress) {
    const totalSupply = metadata.supply / Math.pow(10, metadata.decimals);
    let riskScore = 0;
    const flags = [];
    // Calculate percentage for each holder
    holders.forEach((holder) => {
        holder.percent = (holder.amount / totalSupply) * 100;
    });
    // Sort holders by amount descending
    holders.sort((a, b) => b.amount - a.amount);
    // Check if top holder owns more than 50%
    if (holders.length > 0 && holders[0].percent > 50) {
        riskScore += 50;
        flags.push('Top holder owns more than 50% of total supply.');
    }
    // Check if top 5 holders own more than 90%
    const top5Total = holders.slice(0, 5).reduce((sum, h) => sum + h.percent, 0);
    if (top5Total > 90) {
        riskScore += 30;
        flags.push('Top 5 holders own more than 90% of total supply.');
    }
    // Check for missing authorities
    if (metadata.authorities.length === 0) {
        riskScore += 20;
        flags.push('No authorities found for this token.');
    }
    // Generate explanation
    let explanation = 'Risk analysis completed. ';
    if (flags.length === 0) {
        explanation += 'No significant risks detected.';
    }
    else {
        explanation += 'Potential risks identified: ' + flags.join(' ');
    }
    return {
        token: metadata.name,
        symbol: metadata.symbol,
        mintAddress,
        totalSupply,
        topHolders: holders.slice(0, 5),
        riskScore,
        flags,
        explanation,
        summary: flags.length > 0 ? flags.join('; ') : 'No critical risk factors detected.'
    };
}
// Entry point to scan a token
async function scanToken(mintAddress) {
    try {
        const metadata = await getAsset(mintAddress);
        const holders = await getTokenLargestAccounts(mintAddress);
        const report = analyzeRisks(metadata, holders, mintAddress);
        return report;
    }
    catch (err) {
        throw new Error(`Token scan failed: ${err}`);
    }
}
// Register the tool with the MCP server
server.tool("scanToken", "Scan this token", {
    mintAddress: z.string().describe("The mint address of the token"),
}, async ({ mintAddress }) => {
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
        return {
            content: [
                {
                    type: "text",
                    text: `Token Scan Results for ${mintAddress}:\n\n` +
                        `Token: ${scanResult.token} (${scanResult.symbol})\n` +
                        `Total Supply: ${scanResult.totalSupply}\n\n` +
                        `Risk Score: ${scanResult.riskScore}/100\n\n` +
                        `Top Holders:\n` +
                        scanResult.topHolders.map((holder, index) => `${index + 1}. Address: ${holder.address}, Amount: ${holder.amount}, Percent: ${holder.percent.toFixed(2)}%`).join('\n') +
                        `\n\nFlags:\n` +
                        scanResult.flags.map(flag => `- ${flag}`).join('\n') +
                        `\n\nSummary: ${scanResult.explanation}`,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to scan token: ${error}`,
                },
            ],
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
