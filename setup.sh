#!/bin/bash
echo "====================================================="
echo "               FortiGRC Installer                    "
echo "      Governance, Risk, and Compliance Platform      "
echo "====================================================="
echo ""
if ! command -v git &> /dev/null; then
    echo "[!] Error: Git must be installed to run this setup."
    exit 1
fi
if ! command -v docker &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "[!] Error: Docker (or docker-compose) must be installed to run this setup."
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
if sudo docker compose version &> /dev/null; then
    sudo docker compose up --build -d
else
    sudo docker-compose up --build -d
fi
echo ""
echo "====================================================="
echo " SUCCESS! FortiGRC is now live.                      "
echo " Access your dashboard at: http://localhost:3000     "
echo "====================================================="
