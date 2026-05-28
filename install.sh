#!/bin/bash

# ============================================================
# AnimPMS — One-Click Install Script
# ============================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   AnimPMS — Animation Production Manager     ║${NC}"
echo -e "${CYAN}║          One-Click Install Script            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found. Please install Node.js 20+ from https://nodejs.org${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required. You have $(node -v)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &>/dev/null; then
  echo -e "${RED}✗ npm not found${NC}"; exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

echo ""
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check for .env.local
echo ""
if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}Step 2: Creating .env.local from template...${NC}"
  cp .env.example .env.local
  echo -e "${GREEN}✓ .env.local created${NC}"
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}  ACTION REQUIRED: Fill in your API keys!          ${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  Open .env.local and fill in:"
  echo "  1. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  — from clerk.com"
  echo "  2. CLERK_SECRET_KEY                   — from clerk.com"
  echo "  3. NEXT_PUBLIC_SUPABASE_URL           — from supabase.com"
  echo "  4. NEXT_PUBLIC_SUPABASE_ANON_KEY      — from supabase.com"
  echo "  5. SUPABASE_SERVICE_ROLE_KEY          — from supabase.com"
  echo "  6. OPENAI_API_KEY                     — from platform.openai.com"
  echo ""
  echo "  Then run: npm run dev"
  echo ""
  echo -e "${YELLOW}  See README.md for detailed setup instructions${NC}"
  echo ""
else
  echo -e "${GREEN}✓ .env.local already exists${NC}"

  # Try to start if keys look filled in
  if grep -q "REPLACE_ME" .env.local 2>/dev/null; then
    echo ""
    echo -e "${YELLOW}⚠  .env.local has unfilled values (REPLACE_ME found).${NC}"
    echo "   Please edit .env.local before running."
  else
    echo ""
    echo -e "${YELLOW}Step 3: Starting development server...${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  App running at: http://localhost:3000            ${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    npm run dev
  fi
fi
