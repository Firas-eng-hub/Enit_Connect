#!/bin/bash
# Self-Hosted GitHub Actions Runner Setup Script
# Run this on the deployment server (192.168.1.141)

set -e

RUNNER_DIR="/opt/actions-runner"
REPO_URL="https://github.com/firaskali/ENIT-CONNECT"

echo "=== GitHub Actions Self-Hosted Runner Setup ==="
echo ""
echo "Prerequisites:"
echo "  1. Docker must be installed (already done)"
echo "  2. User must be in docker group (already done)"
echo ""

# Create runner directory
sudo mkdir -p $RUNNER_DIR
sudo chown $USER:$USER $RUNNER_DIR
cd $RUNNER_DIR

# Download latest runner
echo "Downloading GitHub Actions Runner..."
RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | grep -oP '"tag_name": "v\K[^"]+')
curl -o actions-runner-linux-x64.tar.gz -L "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

echo "Extracting runner..."
tar xzf actions-runner-linux-x64.tar.gz
rm actions-runner-linux-x64.tar.gz

echo ""
echo "=== MANUAL STEPS REQUIRED ==="
echo ""
echo "1. Go to: ${REPO_URL}/settings/actions/runners/new"
echo ""
echo "2. Copy the registration token from GitHub"
echo ""
echo "3. Run the following command (replace TOKEN with your token):"
echo ""
echo "   cd $RUNNER_DIR"
echo "   ./config.sh --url $REPO_URL --token YOUR_TOKEN_HERE --name 'lan-server' --labels 'self-hosted,lan,ubuntu'"
echo ""
echo "4. Install as a service:"
echo ""
echo "   sudo ./svc.sh install"
echo "   sudo ./svc.sh start"
echo ""
echo "5. Verify the runner appears in GitHub:"
echo "   ${REPO_URL}/settings/actions/runners"
echo ""
echo "=== Runner setup script complete ==="
