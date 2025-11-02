#!/bin/bash
# Script to build Soroban contracts and copy WASM files to frontend public folder

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/../Papex_Contracts/contracts/papex-contract"
FRONTEND_PUBLIC="$PROJECT_ROOT/public/contracts"

echo "🔨 Building Soroban contracts..."

cd "$CONTRACTS_DIR"

# Build all contracts using Soroban CLI
echo "Building contracts with soroban contract build..."
soroban contract build

# Ensure frontend public/contracts directory exists
mkdir -p "$FRONTEND_PUBLIC"

# Copy built WASM files to frontend
echo "📦 Copying WASM files to frontend..."
for wasm_file in target/wasm32v1-none/release/*.wasm; do
    if [ -f "$wasm_file" ]; then
        filename=$(basename "$wasm_file")
        cp "$wasm_file" "$FRONTEND_PUBLIC/$filename"
        echo "  ✓ Copied $filename"
    fi
done

echo "✅ Contract build and copy complete!"
echo "   WASM files are available in: $FRONTEND_PUBLIC"

