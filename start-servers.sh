#!/bin/bash

# HPCL Procurement System - Server Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting HPCL Procurement System..."
echo ""

# Kill any existing processes on ports 8080 and 3000
echo "📋 Cleaning up existing processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Start backend in background
echo "🔧 Starting Backend (Spring Boot) on port 8080..."
nohup mvn spring-boot:run -Dspring-boot.run.profiles=dev > /tmp/procurement-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "   Waiting for backend to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/pr > /dev/null 2>&1; then
        echo "   ✅ Backend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "   ⚠️  Backend did not start in time. Check /tmp/procurement-backend.log"
    fi
done

# Navigate to frontend directory
cd ../frontend

# Start frontend in background
echo ""
echo "⚛️  Starting Frontend (Vite/React) on port 3000..."
nohup npm run dev > /tmp/procurement-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "   Waiting for frontend to initialize..."
for i in {1..15}; do
    if lsof -i:3000 > /dev/null 2>&1; then
        echo "   ✅ Frontend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 15 ]; then
        echo "   ⚠️  Frontend did not start in time. Check /tmp/procurement-frontend.log"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ HPCL Procurement System is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:8080/api"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/procurement-backend.log"
echo "   Frontend: tail -f /tmp/procurement-frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or: lsof -ti:8080 -ti:3000 | xargs kill -9"
echo ""
