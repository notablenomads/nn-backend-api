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
    
    log_success "DNS validation passed for $domain"
    return 0
}

# Check if SSH connection can be established
check_ssh_connection() {
    log_info "Checking SSH connection to $1..."
    if ! ssh -o ConnectTimeout=10 "$1" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Could not establish SSH connection to $1"
        exit 1
    fi
    log_success "SSH connection successful"
}

# Print usage
usage() {
    echo "Usage: $0 <server-ip> [--staging|--production] [--force-renew]"
    echo
    echo "Options:"
    echo "  --staging      Use Let's Encrypt staging environment (for testing)"
    echo "  --production   Use Let's Encrypt production environment"
    echo "  --force-renew  Force renewal of existing certificates"
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

# Verify SSH connection
check_ssh_connection "$SERVER_USER@$SERVER_IP"

# Validate DNS for all domains
for domain in "${DOMAINS[@]}"; do
    validate_domain_dns "$domain" "$SERVER_IP" || exit 1
done

# Copy SSL management script
log_info "Copying SSL certificate management script..."
scp scripts/ssl-cert.sh "$SERVER_USER@$SERVER_IP:/root/"

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

cd /root

# Create SSL backup directory
mkdir -p /root/ssl_backup

# Save debug information
log_info "Saving debug information to $DEBUG_LOG..."
{
    echo "=== System Information ==="
    uname -a
    echo
    echo "=== Docker Status ==="
    docker ps -a
    echo
    echo "=== Docker Compose Status ==="
    docker-compose ps
    echo
    echo "=== Certificate Status ==="
    certbot certificates || true
} > "$DEBUG_LOG" 2>&1

# Install certbot standalone
log_info "Installing certbot..."
apt-get update
apt-get install -y certbot openssl

# Make SSL script executable
chmod +x ssl-cert.sh

# Handle SSL certificates for each domain
for DOMAIN in "${API_DOMAIN}" "${FRONTEND_DOMAIN}"; do
    log_info "Managing SSL certificates for \$DOMAIN..."
    export DOMAIN
    
    if [ -d "/etc/letsencrypt/live/\${DOMAIN}" ]; then
        if [ "${FORCE_RENEW}" = "true" ]; then
            log_info "Force renewing certificates for \$DOMAIN..."
            ./ssl-cert.sh --force-renew
        else
            log_info "Checking existing certificates for \$DOMAIN..."
            ./ssl-cert.sh --check
        fi
    else
        log_info "No existing certificates found for \$DOMAIN, generating new ones..."
        if [ "${USE_STAGING}" = "true" ]; then
            ./ssl-cert.sh --new --staging
        else
            ./ssl-cert.sh --new
        fi
    fi
done

# Final verification
log_info "Performing final verification..."
docker-compose ps >> "$DEBUG_LOG" 2>&1
certbot certificates >> "$DEBUG_LOG" 2>&1

log_success "SSL certificate management completed!"
SSLSETUP

log_success "SSL management completed successfully!"
echo -e "\n📝 Next steps:"
for DOMAIN in "${DOMAINS[@]}"; do
    echo "1. Verify SSL certificate for $DOMAIN: curl -v https://$DOMAIN"
    echo "2. Check certificate details for $DOMAIN: echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -text"
done

if [ "$USE_STAGING" = true ]; then
    echo -e "\n${YELLOW}Note: SSL certificates are in staging mode. Run with --production for valid certificates.${NC}"
fi 