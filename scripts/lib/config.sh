#!/bin/bash

# Default configuration values
DEFAULT_CONFIG=(
    ["API_DOMAIN"]="api.notablenomads.com"
    ["FRONTEND_DOMAIN"]="notablenomads.com"
    ["SERVER_USER"]="root"
    ["MAX_RETRIES"]=5
    ["RETRY_DELAY"]=10
)

# Initialize config with default values
declare -A CONFIG

# Load default configuration
load_default_config() {
    for key in "${!DEFAULT_CONFIG[@]}"; do
        CONFIG[$key]="${DEFAULT_CONFIG[$key]}"
    done
}

# Load custom configuration file if provided
load_config_file() {
    local config_file="$1"
    if [ -f "$config_file" ]; then
        source "$config_file"
        # Override default values with custom ones
        for key in "${!DEFAULT_CONFIG[@]}"; do
            if [ -n "${!key}" ]; then
                CONFIG[$key]="${!key}"
            fi
        done
        return 0
    else
        return 1
    fi
}

# Get configuration value
get_config() {
    local key="$1"
    echo "${CONFIG[$key]}"
}

# Set configuration value
set_config() {
    local key="$1"
    local value="$2"
    CONFIG[$key]="$value"
}

# Initialize configuration
init_config() {
    local custom_config="$1"
    
    # Load default configuration first
    load_default_config
    
    # If custom config provided, load it
    if [ -n "$custom_config" ]; then
        if ! load_config_file "$custom_config"; then
            echo "Warning: Custom config file not found: $custom_config"
        fi
    fi
}

# Export configuration to environment
export_config() {
    for key in "${!CONFIG[@]}"; do
        export "$key"="${CONFIG[$key]}"
    done
}
