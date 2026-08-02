# Khaata

A LangGraph-powered AI agent that converts natural-language shop talk into structured ledger transactions — built for small shopkeepers who run their businesses on credit (khata).

**Live Demo:** [khaata-ten.vercel.app](https://khaata-ten.vercel.app)

---

## Problem

Small shopkeepers across South Asia track credit in physical notebooks. Customers buy on tab and pay later. Notebooks get lost, names get mixed up, and there's no way to quickly check who's overdue. Shopkeepers speak naturally — "Ali took milk 150, Sara paid her tab" — but digital tools force structured forms and menus.

## Solution

Khata Assistant bridges this gap with a LangGraph Deep Agent Harness — a 3-node agentic pipeline that parses free-form input (English or Roman Urdu), executes database operations, and confirms back in plain language.

## Architecture

```
User Message → PLANNER → EXECUTOR → RESPONDER → Chat Response
                  ↑          |
                  └──────────┘ (loop until all tasks done)
```

| Node | Role |
|------|------|
| **Planner** | LLM decomposes input into a JSON task list with dependencies |
| **Executor** | Calls Supabase tools deterministically (find, update, create, delete) |
| **Responder** | LLM summarizes results in the user's language |

### Tools

| Tool | Purpose |
|------|---------|
| `find_customer` | Fuzzy name matching with ambiguity detection |
| `update_ledger` | Records charges/payments, updates balance |
| `create_customer` | Creates new customer records |
| `delete_customer` | Removes customer and transaction history |
| `get_overdue_customers` | Queries overdue balances |

## Key Features

- **Natural language input** — "Ali took milk 150, Sara paid her tab" in one prompt
- **Name disambiguation** — asks "Ali Khan or Ali Raza?" when ambiguous
- **Bilingual** — responds in English or Roman Urdu matching user input
- **Overpayment handling** — explains extra change and settles balance
- **Balance clearing** — "0 krdo uska balance" sets any balance to zero
- **Live ledger table** — real-time balance updates with status badges (ACTIVE, OVERDUE, PAID, ADVANCE)
- **Dark/light theme** toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, shadcn/ui, Tailwind CSS |
| Agent | LangGraph JS (StateGraph) |
| LLM | OpenAI GPT-4o |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

## Getting Started

```bash
# 1. Clone
git clone https://github.com/ABDULAH-ab/Khaata.git
cd Khaata

# 2. Install
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in your Supabase and OpenAI keys

# 4. Set up database
npx tsx --env-file=.env.local scripts/setup-db.ts

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (/)
│   ├── chat/page.tsx         # Chat + Ledger app (/chat)
│   └── api/
│       ├── chat/route.ts     # Agent API endpoint
│       └── ledger/route.ts   # Ledger data API
├── components/
│   ├── chat-panel.tsx        # Chat terminal UI
│   ├── ledger-panel.tsx      # Live ledger table UI
│   └── landing-view.tsx      # Landing page hero
└── lib/
    ├── agent/graph.ts        # LangGraph 3-node pipeline
    ├── tools/                # Supabase tool functions
    ├── supabase.ts           # Supabase client
    └── types.ts              # TypeScript interfaces
```

## URLs

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/chat` | Chat terminal + Live ledger |

## License

MIT
