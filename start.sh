#!/bin/bash

# ============================================
# AI DEI Analytics & Reporting - Start Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║     AI DEI Analytics & Reporting Platform         ║"
echo "║     Enterprise Diversity Analytics Suite          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Creating default...${NC}"
  cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dei_analytics
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
JWT_SECRET=dei-analytics-secret-key-2024
PORT=3001
FRONTEND_PORT=3000
EOF
  export $(grep -v '^#' .env | xargs)
  echo -e "${YELLOW}! Default .env created. Please update OPENROUTER_API_KEY${NC}"
fi

# Function to kill process on a port
kill_port() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}  Killing process on port $port (PID: $pid)${NC}"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

# Clean up used ports
echo -e "\n${CYAN}[1/6] Cleaning up ports...${NC}"
kill_port 3000
kill_port 3001
echo -e "${GREEN}✓ Ports 3000 and 3001 are free${NC}"

# Check PostgreSQL
echo -e "\n${CYAN}[2/6] Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
  if pg_isready -q; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}! Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
    if pg_isready -q; then
      echo -e "${GREEN}✓ PostgreSQL started${NC}"
    else
      echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}! pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# Create database if not exists
echo -e "\n${CYAN}[3/6] Setting up database...${NC}"
createdb dei_analytics 2>/dev/null && echo -e "${GREEN}✓ Database 'dei_analytics' created${NC}" || echo -e "${YELLOW}! Database 'dei_analytics' already exists${NC}"

# Install dependencies
echo -e "\n${CYAN}[4/6] Installing dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
  echo -e "  Installing backend dependencies..."
  npm install --silent
else
  echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi
cd ..

cd frontend
if [ ! -d "node_modules" ]; then
  echo -e "  Installing frontend dependencies..."
  npm install --silent
else
  echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
cd ..

# Seed database
echo -e "\n${CYAN}[5/6] Seeding database...${NC}"
cd backend
node db/seed.js
cd ..
echo -e "${GREEN}✓ Database seeded with sample data${NC}"

# Start servers with hot reload
echo -e "\n${CYAN}[6/6] Starting servers with hot reload...${NC}"

# Start backend with nodemon for hot reload
cd backend
npx nodemon server.js &
BACKEND_PID=$!
cd ..

# Start frontend with React hot reload (built-in)
cd frontend
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           All Systems Running!                     ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:  ${CYAN}http://localhost:3000${GREEN}                 ║${NC}"
echo -e "${GREEN}║  Backend:   ${CYAN}http://localhost:3001${GREEN}                 ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  Login Credentials:                                ║${NC}"
echo -e "${GREEN}║  Email:    ${YELLOW}admin@deicorp.com${GREEN}                     ║${NC}"
echo -e "${GREEN}║  Password: ${YELLOW}password123${GREEN}                           ║${NC}"
echo -e "${GREEN}║                                                   ║${NC}"
echo -e "${GREEN}║  Hot reload enabled - changes auto-refresh!        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Trap Ctrl+C to cleanup
cleanup() {
  echo -e "\n${RED}Shutting down servers...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  kill_port 3000
  kill_port 3001
  echo -e "${GREEN}✓ All servers stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
