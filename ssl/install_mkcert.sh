#!/bin/bash

# Function to get the latest mkcert version from GitHub
get_latest_version() {
  curl --silent "https://api.github.com/repos/FiloSottile/mkcert/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
}

# Function to install mkcert on macOS
install_mac() {
  echo "Installing mkcert on macOS..."
  brew install mkcert
  brew install nss # if you use Firefox
}

# Function to install mkcert on Linux
install_linux() {
  echo "Installing mkcert on Linux..."
  if command -v apt > /dev/null; then
    sudo apt update
    sudo apt install -y libnss3-tools
  elif command -v yum > /dev/null; then
    sudo yum install -y nss-tools
  elif command -v pacman > /dev/null; then
    sudo pacman -S nss
  elif command -v zypper > /dev/null; then
    sudo zypper install mozilla-nss-tools
  else
    echo "No supported package manager found. Exiting."
    exit 1
  fi

  latest_version=$(get_latest_version)
  wget "https://github.com/FiloSottile/mkcert/releases/download/$latest_version/mkcert-$latest_version-linux-amd64"
  chmod +x "mkcert-$latest_version-linux-amd64"
  sudo mv "mkcert-$latest_version-linux-amd64" /usr/local/bin/mkcert
}

# Function to install mkcert on Windows (WSL)
install_windows() {
  echo "Installing mkcert on Windows (WSL)..."
  choco install mkcert
}

# Detect the operating system
OS="$(uname)"
case $OS in
  'Linux')
    install_linux
    ;;
  'Darwin')
    install_mac
    ;;
  'WindowsNT')
    install_windows
    ;;
  *)
    echo "OS $OS not supported"
    exit 1
    ;;
esac

# Install the local CA
mkcert -install

# Create cert.pem and key.pem
mkcert -cert-file cert.pem -key-file key.pem localhost

echo "mkcert installation and certificate generation complete."
