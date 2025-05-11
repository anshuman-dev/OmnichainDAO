#!/bin/bash

# Render build script - installs all dependencies including dev dependencies

# Install ALL dependencies (including dev dependencies)
echo "Installing all dependencies including development dependencies..."
npm install --include=dev

# Run the build
echo "Building the application..."
npm run build

echo "Build completed successfully!"