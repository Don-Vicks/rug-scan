# 🛡️ RugScan AI — Solana Token Risk Analyzer (MCP Server)

RugScan AI is a lightweight and effective **risk assessment tool** for Solana tokens. Powered by Solscan’s API, this MCP server flags **centralized control**, **holder concentration**, and other **on-chain red flags** — giving retail users and developers an instant trust score for any SPL token.

> ✅ Built for DeMCP MCP Hackathon  
> 🔗 Uses only Solscan's public API  
> 🛠 Written in TypeScript

---

## 🚀 Features

- 🔍 Analyze any SPL token on Solana by mint address
- 📊 Detect risky patterns:
  - Mint authority not renounced
  - Freeze authority still active
  - Top holder dominance (> 50%)
  - Very low number of holders
- ⚖️ Generate a **0–100 Risk Score**
- 🧠 Human-readable risk summary (can be extended with LLMs)
- 🔌 Built to run as an MCP server (or standalone CLI)

---

## 📦 Installation

```bash
git clone https://github.com/don-vicks/rug-scan.git
cd rugscan-ai
npm install
