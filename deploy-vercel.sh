#!/bin/bash
set -e

echo "🚀 LIT MVP Web - Vercel Deployment Script"
echo "=========================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📝 Step 1: Get Railway API URL"
echo ""
echo "Please enter your Railway API URL:"
echo "(Example: https://lit-mvp-production.up.railway.app)"
read -p "Railway URL: " RAILWAY_URL

# Remove trailing slash if present
RAILWAY_URL="${RAILWAY_URL%/}"

echo ""
echo "🔧 Creating .env.production file..."
cat > .env.production <<EOF
VITE_API_URL=$RAILWAY_URL
VITE_SOCKET_URL=$RAILWAY_URL
EOF

echo "✅ .env.production created"
echo ""
echo "📤 Step 2: Deploy to Vercel..."
echo ""
echo "Follow the prompts:"
echo "  - Set up and deploy: Y"
echo "  - Link to existing project: N (unless you already have one)"
echo "  - Project name: lit-mvp-web (or your choice)"
echo "  - Directory: ./"
echo "  - Override settings: N"
echo ""
read -p "Press Enter to continue..."

vercel --prod

echo ""
echo "✅ Vercel deployment complete!"
echo ""
echo "🔄 Step 3: Update Railway CORS settings..."
echo "Get your Vercel URL from above and run:"
echo ""
echo "cd ../api"
echo "railway variables --set ALLOWED_ORIGINS=https://your-vercel-url.vercel.app"
echo ""
echo "📊 View deployment: vercel inspect"
echo "📋 View logs: vercel logs"
echo "🌐 Dashboard: https://vercel.com/dashboard"
