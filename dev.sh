#!/bin/bash

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display menu
show_menu() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}    Backend Selection Menu${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "${GREEN}1.${NC} Against Fishmeet Backend"
    echo -e "${GREEN}2.${NC} Against Jitsi Backend"
    echo -e "${GREEN}3.${NC} Against Localhost Backend"
    echo -e "${RED}4.${NC} Exit"
    echo -e "${BLUE}================================${NC}"
}

# Function to copy fishmeet overrides
copy_fishmeet_overrides() {
    echo -e "${YELLOW}Copying fishmeet CSS overrides...${NC}"
    cp fishmeet/css/_*.scss css/

    echo -e "${YELLOW}Copying fishmeet react/ overrides...${NC}"
    rsync -r fishmeet/react/ react/
}

# Function to execute script and handle errors
execute_script() {
    local script_name=fishmeet/scripts/"$1"
    local backend_name="$2"

    if [ -f "$script_name" ]; then
        # Copy fishmeet overrides before running the backend script
        copy_fishmeet_overrides

        echo -e "${YELLOW}Executing $script_name for $backend_name...${NC}"
        chmod +x "$script_name"
        ./"$script_name"
        local exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            echo -e "${GREEN}✓ $backend_name script completed successfully${NC}"
        else
            echo -e "${RED}✗ $backend_name script failed with exit code: $exit_code${NC}"
        fi
    else
        echo -e "${RED}Error: Script '$script_name' not found!${NC}"
        echo -e "${YELLOW}Please create the script file: $script_name${NC}"
    fi
}

# Main loop
while true; do
    show_menu
    echo -n -e "${YELLOW}Please select an option (1-4): ${NC}"
    read -r choice
    
    case $choice in
        1)
            echo -e "${GREEN}Selected: Fishmeet Backend${NC}"
            execute_script "fishmeet_backend.sh" "Fishmeet Backend"
            ;;
        2)
            echo -e "${GREEN}Selected: Jitsi Backend${NC}"
            execute_script "jitsi_backend.sh" "Jitsi Backend"
            ;;
        3)
            echo -e "${GREEN}Selected: Localhost Backend${NC}"
            execute_script "localhost_backend.sh" "Localhost Backend"
            ;;
        4)
            echo -e "${YELLOW}Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option! Please select 1-4.${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}Press Enter to continue...${NC}"
    read -r
    clear
done
