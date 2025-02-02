#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"
API_DOMAIN="api.notablenomads.com"
FRONTEND_DOMAIN="notablenomads.com"
DOMAINS=("$API_DOMAIN" "$FRONTEND_DOMAIN")
DEBUG_LOG="/root/ssl_debug.log"
REMOTE_WORKSPACE="/root"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Check if required commands exist
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' is not installed."
        exit 1
    fi
}

# Validate domain DNS
validate_domain_dns() {
    local domain="$1"
    local server_ip="$2"
    
    log_info "Validating DNS for $domain..."
    local resolved_ip
    resolved_ip=$(dig +short "$domain" | tail -n1)
    
    if [ -z "$resolved_ip" ]; then
        log_error "Could not resolve domain $domain"
        return 1
    fi
    
    if [ "$resolved_ip" != "$server_ip" ]; then
        log_error "Domain $domain resolves to $resolved_ip, expected $server_ip"
        return 1
    fi
    
    # Also check if port 80 and 443 are accessible
    if ! nc -z -w5 "$domain" 80 2>/dev/null; then
        log_warn "Port 80 is not accessible for $domain"
    fi
    
    if ! nc -z -w5 "$domain" 443 2>/dev/null; then
        log_warn "Port 443 is not accessible for $domain"
    fi
    
    log_success "DNS validation passed for $domain"
    return 0
}

# Check if SSH connection can be established
check_ssh_connection() {
    log_info "Checking SSH connection to $1..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$1" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Could not establish SSH connection to $1"
        exit 1
    fi
    log_success "SSH connection successful"
}

# Print usage
usage() {
    echo "Usage: $0 <server-ip> [--staging|--production] [--force-renew] [--cleanup]"
    echo
    echo "Options:"
    echo "  --staging      Use Let's Encrypt staging environment (for testing)"
    echo "  --production   Use Let's Encrypt production environment"
    echo "  --force-renew  Force renewal of existing certificates"
    echo "  --cleanup      Clean up all certificates and start fresh"
    exit 1
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    usage
fi

SERVER_IP="$1"
shift

# Parse options
USE_STAGING=true
FORCE_RENEW=false
CLEANUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --staging)
            USE_STAGING=true
            shift
            ;;
        --production)
            USE_STAGING=false
            shift
            ;;
        --force-renew)
            FORCE_RENEW=true
            shift
            ;;
        --cleanup)
            CLEANUP=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Check required commands
check_command "ssh"
check_command "scp"
check_command "dig"
check_command "nc"

# Verify SSH connection
check_ssh_connection "$SERVER_USER@$SERVER_IP"

# Validate DNS for all domains
for domain in "${DOMAINS[@]}"; do
    validate_domain_dns "$domain" "$SERVER_IP" || exit 1
done

# Function to check remote system requirements
check_remote_requirements() {
    log_info "Checking remote system requirements..."
    ssh "$SERVER_USER@$SERVER_IP" << 'CHECK'
        # Check Docker
        if ! command -v docker &> /dev/null; then
            echo "ERROR: Docker is not installed"
            exit 1
        fi
        
        # Check Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            echo "ERROR: Docker Compose is not installed"
            exit 1
        fi
        
        # Check if nginx configuration exists
        if [ ! -f "/root/nginx.conf" ]; then
            echo "ERROR: nginx.conf is missing"
            exit 1
        fi
        
        # Check if ports are available
        if ! ss -tln | grep -q ':80 '; then
            echo "WARN: Port 80 might not be available"
        fi
        
        if ! ss -tln | grep -q ':443 '; then
            echo "WARN: Port 443 might not be available"
        fi
        
        exit 0
CHECK
}

# Copy SSL management script
log_info "Copying SSL certificate management script..."
scp scripts/ssl-cert.sh "$SERVER_USER@$SERVER_IP:$REMOTE_WORKSPACE/"

# Check remote requirements
check_remote_requirements

# Execute SSL management on remote server
ssh "$SERVER_USER@$SERVER_IP" << SSLSETUP
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions for remote execution
log_info() { echo -e "\${BLUE}[INFO]\${NC} \$1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} \$1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} \$1" >&2; }
log_success() { echo -e "\${GREEN}[SUCCESS]\${NC} \$1"; }

cd "$REMOTE_WORKSPACE"

# Create SSL backup directory
mkdir -p /root/ssl_backup

# Save debug information
log_info "Saving debug information to $DEBUG_LOG..."
{
    echo "=== System Information ==="
    uname -a
    echo
    echo "=== Docker Version ==="
    docker --version
    docker-compose --version
    echo
    echo "=== Docker Status ==="
    docker ps -a
    echo
    echo "=== Docker Compose Status ==="
    docker-compose ps
    echo
    echo "=== Certificate Status ==="
    certbot certificates || true
    echo
    echo "=== Port Status ==="
    ss -tlnp | grep -E ':80|:443' || true
    echo
    echo "=== Disk Space ==="
    df -h /etc/letsencrypt /root/certbot
} > "$DEBUG_LOG" 2>&1

# Install required packages
log_info "Installing required packages..."
apt-get update
apt-get install -y certbot openssl netcat-openbsd lsof

# Make SSL script executable
chmod +x ssl-cert.sh

# Handle cleanup if requested
if [ "${CLEANUP}" = "true" ]; then
    log_info "Performing cleanup for all domains..."
    for DOMAIN in "${API_DOMAIN}" "${FRONTEND_DOMAIN}"; do
        export DOMAIN
        ./ssl-cert.sh --cleanup
    done
fi

# Handle SSL certificates for each domain
for DOMAIN in "${API_DOMAIN}" "${FRONTEND_DOMAIN}"; do
    log_info "Managing SSL certificates for \$DOMAIN..."
    export DOMAIN
    export USE_STAGING
    export FORCE_RENEW
    ./ssl-cert.sh
done

# Fix certificate permissions
log_info "Fixing SSL certificate permissions..."
# Set directory permissions
chmod 755 /etc/letsencrypt/live /etc/letsencrypt/archive
chmod 755 /etc/letsencrypt/live/*/
chmod 755 /etc/letsencrypt/archive/*/

# Set file permissions
chmod 644 /etc/letsencrypt/archive/*/cert*.pem
chmod 644 /etc/letsencrypt/archive/*/chain*.pem
chmod 644 /etc/letsencrypt/archive/*/fullchain*.pem
chmod 600 /etc/letsencrypt/archive/*/privkey*.pem

# Set ownership
chown -R root:root /etc/letsencrypt

# Final verification
log_info "Performing final verification..."
{
    echo "=== Final Docker Status ==="
    docker-compose ps
    echo
    echo "=== Final Certificate Status ==="
    certbot certificates
    echo
    echo "=== Service Health Check ==="
    for DOMAIN in "${API_DOMAIN}" "${FRONTEND_DOMAIN}"; do
        echo "Checking \$DOMAIN..."
        curl -sI "https://\$DOMAIN" || true
    done
} >> "$DEBUG_LOG" 2>&1

log_success "SSL certificate management completed!"
SSLSETUP

log_success "SSL certificates have been configured on the remote server!"
echo -e "\n📝 Next steps:"
for DOMAIN in "${DOMAINS[@]}"; do
    echo "1. Verify SSL certificate for $DOMAIN:"
    echo "   curl -v https://$DOMAIN"
    echo "2. Check certificate details:"
    echo "   echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -text"
    echo "3. Verify certificate expiry:"
    echo "   echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates"
done

if [ "$USE_STAGING" = true ]; then
    echo -e "\n${YELLOW}Note: SSL certificates are in staging mode. Run with --production for valid certificates.${NC}"
fi

echo -e "\n💡 Troubleshooting:"
echo "1. Check logs: ssh $SERVER_USER@$SERVER_IP 'cat $DEBUG_LOG'"
echo "2. View service status: ssh $SERVER_USER@$SERVER_IP 'docker-compose ps'"
echo "3. View service logs: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs'" 