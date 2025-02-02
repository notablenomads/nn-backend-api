#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_USER="root"
API_DOMAIN="api.notablenomads.com"
FRONTEND_DOMAIN="notablenomads.com"

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

# Function to check parent directory permissions
check_parent_directory_permissions() {
    log_info "Checking parent directory permissions..."
    ssh "$SERVER_USER@$SERVER_IP" "
        # Check /etc permissions
        if [ \$(stat -c '%a' /etc) -lt 755 ]; then
            chmod 755 /etc
        fi
        
        # Ensure /etc/letsencrypt parent exists with correct permissions
        mkdir -p /etc/letsencrypt
        chmod 755 /etc/letsencrypt
        
        # Check selinux context if selinux is enabled
        if command -v getenforce >/dev/null && [ \$(getenforce) != 'Disabled' ]; then
            chcon -Rt etc_t /etc/letsencrypt || true
        fi"
}

# Enhanced SSL permission fix function
fix_ssl_permissions() {
    log_info "Fixing SSL certificate permissions..."
    ssh "$SERVER_USER@$SERVER_IP" "
        # Create ssl-cert group if it doesn't exist
        groupadd -f ssl-cert &&

        # Backup existing certificates
        if [ -d /etc/letsencrypt/archive ]; then
            timestamp=\$(date +%Y%m%d_%H%M%S)
            backup_dir=/root/letsencrypt_backup_\$timestamp
            mkdir -p \$backup_dir
            cp -rp /etc/letsencrypt/archive \$backup_dir/
            cp -rp /etc/letsencrypt/live \$backup_dir/
            log_info 'Created backup at \$backup_dir'
        fi

        # Set base directory permissions
        chown root:ssl-cert /etc/letsencrypt &&
        chmod 755 /etc/letsencrypt &&

        # Create and set permissions for renewal hooks directory
        mkdir -p /etc/letsencrypt/renewal-hooks/{pre,post,deploy}
        chmod 755 /etc/letsencrypt/renewal-hooks
        chmod 755 /etc/letsencrypt/renewal-hooks/{pre,post,deploy}
        chown -R root:ssl-cert /etc/letsencrypt/renewal-hooks

        # Set directory permissions with error handling
        find /etc/letsencrypt/archive -type d -exec chmod 755 {} \; || log_warn 'Some archive directories could not be chmod'
        find /etc/letsencrypt/live -type d -exec chmod 755 {} \; || log_warn 'Some live directories could not be chmod'

        # Set file permissions with error handling
        find /etc/letsencrypt/archive -type f -name 'privkey*.pem' -exec chmod 640 {} \; || log_warn 'Some private keys could not be chmod'
        find /etc/letsencrypt/archive -type f ! -name 'privkey*.pem' -exec chmod 644 {} \; || log_warn 'Some public certificates could not be chmod'
        
        # Set ownership with error handling
        chown -R root:ssl-cert /etc/letsencrypt/archive || log_warn 'Archive ownership could not be set completely'
        chown -R root:ssl-cert /etc/letsencrypt/live || log_warn 'Live ownership could not be set completely'
        
        # Fix symlinks with error handling
        find /etc/letsencrypt/live -type l -exec chown -h root:ssl-cert {} \; || log_warn 'Some symlinks could not be fixed'
        
        # Set SELinux context if enabled
        if command -v selinuxenabled >/dev/null && selinuxenabled; then
            semanage fcontext -a -t cert_t '/etc/letsencrypt/archive(/.*)?'
            semanage fcontext -a -t cert_t '/etc/letsencrypt/live(/.*)?'
            restorecon -R /etc/letsencrypt
        fi
        
        # Verify the changes
        echo 'Verifying permissions:' &&
        ls -lZ /etc/letsencrypt/{live,archive} 2>/dev/null || ls -l /etc/letsencrypt/{live,archive}"
}

# Enhanced verify SSL permissions function
verify_ssl_permissions() {
    local domain="$1"
    log_info "Verifying SSL permissions for $domain..."
    
    if ! ssh "$SERVER_USER@$SERVER_IP" "
        # Check if directory exists
        if [ ! -d /etc/letsencrypt/live/$domain ]; then
            echo 'Directory does not exist'
            exit 1
        fi
        
        # Check parent directory permissions
        [ \$(stat -c '%a' /etc/letsencrypt) = '755' ] &&
        
        # Check directory permissions
        [ \$(stat -c '%a' /etc/letsencrypt/live/$domain) = '755' ] &&
        [ \$(stat -c '%a' /etc/letsencrypt/archive/$domain) = '755' ] &&
        
        # Check group ownership
        [ \$(stat -c '%G' /etc/letsencrypt/live/$domain) = 'ssl-cert' ] &&
        [ \$(stat -c '%G' /etc/letsencrypt/archive/$domain) = 'ssl-cert' ] &&
        
        # Check file permissions
        [ \$(stat -c '%a' /etc/letsencrypt/archive/$domain/privkey1.pem) = '640' ] &&
        [ \$(stat -c '%a' /etc/letsencrypt/archive/$domain/fullchain1.pem) = '644' ] &&
        
        # Check renewal hooks permissions if they exist
        { [ ! -d /etc/letsencrypt/renewal-hooks ] || [ \$(stat -c '%a' /etc/letsencrypt/renewal-hooks) = '755' ]; }"; then
        log_warn "SSL permissions need to be fixed for $domain"
        return 1
    fi
    
    log_success "SSL permissions are correct for $domain"
    return 0
}

# Enhanced nginx permissions function
ensure_nginx_permissions() {
    log_info "Ensuring nginx has proper permissions..."
    ssh "$SERVER_USER@$SERVER_IP" "
        # Ensure ssl-cert group exists
        groupadd -f ssl-cert

        # Ensure nginx user exists and is in ssl-cert group
        if ! getent passwd nginx >/dev/null; then
            log_warn 'nginx user does not exist, it should be created by the nginx container'
        else
            usermod -a -G ssl-cert nginx || true
        fi
        
        # Verify nginx can read the certificates
        if ! su -s /bin/sh nginx -c 'test -r /etc/letsencrypt/live/*/fullchain.pem' 2>/dev/null; then
            log_warn 'Nginx might have issues reading certificates'
            
            # Additional debugging information
            echo 'Current permissions:'
            ls -la /etc/letsencrypt/live/
            echo 'Groups for nginx user:'
            groups nginx || true
            echo 'SELinux context:'
            ls -Z /etc/letsencrypt/live/ 2>/dev/null || true
            
            return 1
        fi
        
        # Verify nginx can traverse the directory structure
        for dir in /etc /etc/letsencrypt /etc/letsencrypt/live /etc/letsencrypt/archive; do
            if [ ! -x \"\$dir\" ]; then
                log_warn \"nginx cannot traverse \$dir\"
                return 1
            fi
        done"
}

# Print usage
usage() {
    echo "Usage: $0 <server-ip> [--force-cleanup] [--force-ssl]"
    echo
    echo "Options:"
    echo "  --force-cleanup    Force cleanup of all certificates and data"
    echo "  --force-ssl       Force SSL certificate regeneration even if valid certificates exist"
    echo
    echo "Environment variables required:"
    echo "  DOCKER_HUB_TOKEN    Docker Hub access token"
    exit 1
}

# Check if required commands exist
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' is not installed."
        exit 1
    fi
}

# Function to check SSL certificate validity
check_ssl_certificates() {
    local domain="$1"
    local days_threshold=30  # Warn if certificate expires in less than 30 days
    
    log_info "Checking SSL certificates for $domain..."
    
    # Check if certificates exist and are valid
    if ssh "$SERVER_USER@$SERVER_IP" "[ -d /etc/letsencrypt/live/$domain ]"; then
        local cert_info
        cert_info=$(ssh "$SERVER_USER@$SERVER_IP" "openssl x509 -in /etc/letsencrypt/live/$domain/fullchain.pem -noout -dates -subject 2>/dev/null") || return 1
        
        if [ -n "$cert_info" ]; then
            local expiry_date
            expiry_date=$(echo "$cert_info" | grep 'notAfter=' | cut -d= -f2)
            local expiry_epoch
            expiry_epoch=$(ssh "$SERVER_USER@$SERVER_IP" "date -d '$expiry_date' +%s")
            local current_epoch
            current_epoch=$(ssh "$SERVER_USER@$SERVER_IP" "date +%s")
            local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
            
            if [ $days_left -lt 0 ]; then
                log_error "Certificate for $domain has expired!"
                return 1
            elif [ $days_left -lt $days_threshold ]; then
                log_warn "Certificate for $domain will expire in $days_left days"
                return 1
            else
                log_success "Certificate for $domain is valid for $days_left days"
                return 0
            fi
        fi
    fi
    
    return 1
}

# Function to ensure Docker Hub login
ensure_docker_hub_login() {
    local target="${1:-local}"  # 'local' or 'remote'
    log_info "Ensuring Docker Hub authentication for $target..."
    
    if [ "$target" = "remote" ]; then
        # Ensure remote server is logged out first to prevent stale credentials
        ssh "$SERVER_USER@$SERVER_IP" "docker logout"
        
        # Login on remote server
        ssh "$SERVER_USER@$SERVER_IP" "echo '$DOCKER_HUB_TOKEN' | docker login -u mrdevx --password-stdin" || {
            log_error "Failed to authenticate with Docker Hub on remote server"
            return 1
        }
    else
        # Ensure local machine is logged out first
        docker logout
        
        # Login on local machine
        echo "$DOCKER_HUB_TOKEN" | docker login -u mrdevx --password-stdin || {
            log_error "Failed to authenticate with Docker Hub on local machine"
            return 1
        }
    fi
    
    log_success "Docker Hub authentication successful for $target"
    return 0
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    usage
fi

SERVER_IP="$1"
shift

FORCE_CLEANUP=false
FORCE_SSL=false

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --force-cleanup)
            FORCE_CLEANUP=true
            shift
            ;;
        --force-ssl)
            FORCE_SSL=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Check required environment variables
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    log_error "DOCKER_HUB_TOKEN environment variable is not set"
    usage
fi

# Check required commands
check_command "ssh"
check_command "scp"
check_command "docker"

# Function to wait for user confirmation
wait_for_confirmation() {
    local step="$1"
    echo
    read -p "Press Enter to continue with $step (or Ctrl+C to abort)..."
}

# Function to check deployment health
check_deployment_health() {
    local protocol="$1"
    local max_retries=5
    local retry_count=0
    local endpoint="$protocol://$API_DOMAIN/v1/health"

    log_info "Checking deployment health at $endpoint..."
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -sk "$endpoint" | grep -q "status.*ok"; then
            log_success "Deployment health check passed!"
            return 0
        fi
        log_warn "Health check failed, retrying in 10 seconds... ($(($retry_count + 1))/$max_retries)"
        sleep 10
        retry_count=$((retry_count + 1))
    done
    
    log_error "Deployment health check failed after $max_retries attempts"
    return 1
}

# Main deployment sequence
log_info "Starting full deployment sequence for $API_DOMAIN and $FRONTEND_DOMAIN"
echo "Server IP: $SERVER_IP"
echo "Force cleanup: $FORCE_CLEANUP"
echo "Force SSL regeneration: $FORCE_SSL"
wait_for_confirmation "Step 1: Cleanup"

# Step 1: Cleanup
log_info "Step 1: Cleaning up existing deployment..."
if [ "$FORCE_CLEANUP" = true ]; then
    ./scripts/cleanup.sh "$SERVER_IP" --force
else
    ./scripts/cleanup.sh "$SERVER_IP"
fi

wait_for_confirmation "Step 2: HTTP-only deployment"

# Step 2: Deploy with HTTP-only
log_info "Step 2: Deploying with HTTP-only configuration..."
DOCKER_HUB_TOKEN="$DOCKER_HUB_TOKEN" ./scripts/deploy.sh "$SERVER_IP" --http-only

# Ensure containers are running after HTTP deployment
log_info "Starting containers in HTTP mode..."
ensure_docker_hub_login "remote"

# Pull and start containers
ssh "$SERVER_USER@$SERVER_IP" "cd /root && docker compose pull && docker compose up -d"

# Verify HTTP deployment
if ! check_deployment_health "http"; then
    log_error "HTTP deployment verification failed"
    exit 1
fi

# Step 3: Check and set up SSL certificates if needed
log_info "Step 3: Checking SSL certificates..."

NEED_SSL=false
if [ "$FORCE_SSL" = true ]; then
    log_info "Force SSL regeneration requested"
    NEED_SSL=true
else
    if ! check_ssl_certificates "$API_DOMAIN" || ! check_ssl_certificates "$FRONTEND_DOMAIN"; then
        log_info "SSL certificates need to be generated or renewed"
        NEED_SSL=true
    else
        log_success "Valid SSL certificates found for both domains"
    fi
fi

if [ "$NEED_SSL" = true ]; then
    wait_for_confirmation "SSL certificate setup"
    log_info "Setting up SSL certificates..."
    ./scripts/manage-ssl.sh "$SERVER_IP" --production

    # Check parent directory permissions first
    check_parent_directory_permissions
    
    # Fix permissions and verify after SSL setup
    fix_ssl_permissions
    ensure_nginx_permissions
    
    # Double-check permissions after fixes
    if ! verify_ssl_permissions "$API_DOMAIN" || ! verify_ssl_permissions "$FRONTEND_DOMAIN"; then
        log_warn "SSL permissions could not be fixed completely. Manual intervention may be required."
    fi
else
    log_info "Skipping SSL certificate generation as valid certificates exist"
    
    # Check parent directory permissions first
    check_parent_directory_permissions
    
    # Verify and fix permissions if needed
    if ! verify_ssl_permissions "$API_DOMAIN" || ! verify_ssl_permissions "$FRONTEND_DOMAIN"; then
        log_info "Fixing SSL permissions..."
        fix_ssl_permissions
    fi
    ensure_nginx_permissions
    
    # Double-check permissions after fixes
    if ! verify_ssl_permissions "$API_DOMAIN" || ! verify_ssl_permissions "$FRONTEND_DOMAIN"; then
        log_warn "SSL permissions could not be fixed completely. Manual intervention may be required."
    fi
fi

wait_for_confirmation "Step 4: HTTPS deployment"

# Step 4: Deploy with HTTPS
log_info "Step 4: Deploying with HTTPS configuration..."
DOCKER_HUB_TOKEN="$DOCKER_HUB_TOKEN" ./scripts/deploy.sh "$SERVER_IP" --production

# Ensure containers are running after HTTPS deployment
log_info "Starting containers in HTTPS mode..."
ensure_docker_hub_login "remote"

# Fix SSL permissions one last time before starting containers
if [ -d "/etc/letsencrypt" ]; then
    # Verify permissions for both domains
    if ! verify_ssl_permissions "$API_DOMAIN" || ! verify_ssl_permissions "$FRONTEND_DOMAIN"; then
        log_info "Fixing SSL permissions..."
        fix_ssl_permissions
    fi
    
    # Ensure nginx has proper access
    ensure_nginx_permissions
fi

# Pull and start containers with proper authentication
ssh "$SERVER_USER@$SERVER_IP" "cd /root && docker compose pull && docker compose up -d"

# Verify HTTPS deployment
if ! check_deployment_health "https"; then
    log_error "HTTPS deployment verification failed"
    exit 1
fi

log_success "Full deployment sequence completed successfully!"
echo
echo "📝 Deployment Summary:"
echo "1. API endpoint: https://$API_DOMAIN"
echo "2. Frontend: https://$FRONTEND_DOMAIN"
echo
echo "🔍 Verify the deployment:"
echo "1. Check API health: curl -v https://$API_DOMAIN/v1/health"
echo "2. Visit the frontend: https://$FRONTEND_DOMAIN"
echo "3. Monitor logs: ssh $SERVER_USER@$SERVER_IP 'docker compose logs -f'"
echo
echo "⚠️ If you need to redeploy:"
echo "1. Use this script again: ./scripts/deploy-full.sh $SERVER_IP"
echo "2. Add --force-cleanup to start fresh: ./scripts/deploy-full.sh $SERVER_IP --force-cleanup"
echo "3. Add --force-ssl to regenerate certificates: ./scripts/deploy-full.sh $SERVER_IP --force-ssl" 