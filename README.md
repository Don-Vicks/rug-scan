# 🛡️ RugScan AI — Solana Token Risk Analyzer (MCP Server)

RugScan AI is a lightweight, effective risk assessment tool for Solana tokens. It runs as an MCP server and leverages the Helius API to scan SPL tokens for on-chain red flags like centralized control, holder concentration, and missing authority renouncements. It's built to give degens and developers instant clarity and trust scores.

> ✅ Built for the DeMCP MCP Hackathon  
> 🔗 Uses only Solana's public APIs  
> 🛠 Written in TypeScript

## 🚀 Features

Analyze any SPL token on Solana using its mint address

Detect risk factors such as:
- Mint authority not renounced
- Freeze authority still active
- Top holder dominance (> 50%)
- Very few unique holders

Generates a 0–100 Risk Score

Returns a human-readable risk summary (LLM-ready)

Can run as an MCP Server or standalone CLI

## 📽 Demo Video

Watch the demo

## ⚙️ How to Use

### 1. Clone the Repo

```
git clone https://github.com/Don-Vicks/rug-scan.git
cd rug-scan
npm install
npm run build
```

> Make sure Node.js and TypeScript are installed globally.

### 2. Configure with Claude Desktop

Locate the index.js build file:
- After building, go to the build folder
- Copy the full file path to index.js

Edit Claude Desktop MCP config:

**Windows**
```json
{
  "mcpServers": {
    "rugscan": {
      "command": "node",
      "args": [
        "C:\\FULL\\PATH\\TO\\rug-scan\\build\\index.js"
      ]
    }
  }
}
```

**macOS**
```json
{
  "mcpServers": {
    "rugscan": {
      "command": "node",
      "args": [
        "/absolute/path/to/rug-scan/build/index.js"
      ]
    }
  }
}
```

> Replace the file paths with your actual local path to index.js.

## Coming Soon

- NFT collection scanning
- Wallet reputation scoring
- dApp contract safety checks
- Broader DeFi protocol support

## License

MIT
