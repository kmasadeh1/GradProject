#!/bin/bash
echo "====================================================="
echo "               FortiGRC Installer                    "
echo "      Governance, Risk, and Compliance Platform      "
echo "====================================================="
echo ""
if ! command -v git &> /dev/null || ! command -v docker &> /dev/null; then
    echo "[!] Error: Git and Docker must be installed to run this setup."
    exit 1
fi
echo "To connect your GRC dashboard, please provide your database credentials:"
read -p "Enter your Supabase URL: " DB_URL
read -p "Enter your Supabase Anon Key: " DB_KEY
echo ""
echo "[*] Downloading FortiGRC core engine..."
git clone https://github.com/kmasadeh1/GradProject.git fortigrc-deploy
cd fortigrc-deploy || exit
echo "[*] Configuring environment..."
cat <<EOF > .env.local
NEXT_PUBLIC_SUPABASE_URL=\$DB_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=\$DB_KEY
EOF
echo "[*] Initializing Docker containers. This may take a few minutes..."
docker compose up --build -d
echo ""
echo "====================================================="
echo " SUCCESS! FortiGRC is now live.                      "
echo " Access your dashboard at: http://localhost:3000     "
echo "====================================================="
