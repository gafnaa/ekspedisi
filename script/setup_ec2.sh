#!/bin/bash

# Update package database
echo "Updating package database..."
sudo yum update -y

# Install Git
echo "Installing Git..."
sudo yum install git -y

# Install Docker
echo "Installing Docker..."
sudo yum install docker -y

# Start Docker service
echo "Starting Docker service..."
sudo service docker start

# Add ec2-user to the docker group so you can execute Docker commands without using sudo
echo "Adding ec2-user to docker group..."
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
# Check if docker-compose is already installed
if ! command -v docker-compose &> /dev/null
then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully."
else
    echo "Docker Compose is already installed."
fi

# Print versions
echo "Git Version: $(git --version)"
echo "Docker Version: $(docker --version)"
echo "Docker Compose Version: $(docker-compose --version)"

echo "----------------------------------------------------------------"
echo "Setup Complete!"
echo "IMPORTANT: You must log out and log back in for the group changes to take effect."
echo "----------------------------------------------------------------"
