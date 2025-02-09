#!/bin/bash

# Exit on any error
set -e

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

# Configuration
BACKUP_DIR="/Users/mrdevx/Documents/Backups/NotableNomads"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="notable_nomads"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Find postgres container
CONTAINER_NAME=$(docker ps -qf "name=postgres")
if [ -z "$CONTAINER_NAME" ]; then
    log_error "PostgreSQL container is not running!"
    exit 1
fi

# Check if database exists
DB_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -w "$DB_NAME" | wc -l)
if [ "$DB_EXISTS" -eq 0 ]; then
    log_warn "Database '$DB_NAME' does not exist yet. Nothing to backup."
    exit 0
fi

# Backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"

log_info "Starting database backup..."
log_info "Target file: $BACKUP_FILE"

# Create the backup with error handling
if ! docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$DB_NAME" > "$BACKUP_FILE" 2>/tmp/pg_dump_error.log; then
    
    log_error "Backup failed! Error:"
    cat /tmp/pg_dump_error.log
    rm -f /tmp/pg_dump_error.log
    rm -f "$BACKUP_FILE"  # Clean up failed backup file
    exit 1
fi

# Compress the backup
log_info "Compressing backup..."
if ! gzip "$BACKUP_FILE"; then
    log_error "Failed to compress backup file!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Calculate file size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)

log_success "Backup completed successfully!"
log_info "Backup location: ${BACKUP_FILE}.gz"
log_info "Backup size: $BACKUP_SIZE"

# Keep only the last 5 backups
log_info "Cleaning up old backups..."
cd "$BACKUP_DIR" && ls -t *.gz 2>/dev/null | tail -n +6 | xargs -r rm

# List remaining backups
echo -e "\nAvailable backups:"
if ls "$BACKUP_DIR"/*.gz >/dev/null 2>&1; then
    ls -lht "$BACKUP_DIR"/*.gz | awk '{print $9, "(" $5 ")"}'
else
    log_warn "No backup files found."
fi
