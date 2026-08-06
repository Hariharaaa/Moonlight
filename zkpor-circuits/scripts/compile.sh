#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUIT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$CIRCUIT_DIR/build"

echo "🔧 Installing circom (if needed)..."
which circom >/dev/null 2>&1 || npm install -g circom

echo "📁 Creating build directories..."
mkdir -p "$BUILD_DIR/solvency" "$BUILD_DIR/inclusion"

PTAU="$BUILD_DIR/pot16_final.ptau"
if [ ! -f "$PTAU" ]; then
    echo "📥 Downloading Powers of Tau (Hermez, 16)..."
    curl -L "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau" \
         -o "$PTAU"
fi

compile_circuit() {
    local name="$1"
    local out="$BUILD_DIR/$name"
    echo ""
    echo "━━━ Compiling $name.circom ━━━"

    circom "$CIRCUIT_DIR/$name.circom" \
        --r1cs --wasm --sym \
        --output "$out" \
        -l "$CIRCUIT_DIR/node_modules"

    echo "🔑 Phase 2 trusted setup for $name..."
    snarkjs groth16 setup \
        "$out/$name.r1cs" \
        "$PTAU" \
        "$out/${name}_0000.zkey"

    snarkjs zkey contribute \
        "$out/${name}_0000.zkey" \
        "$out/${name}_0001.zkey" \
        --name="zkpor initial contribution" \
        -v -e="some entropy for the contribution"

    snarkjs zkey beacon \
        "$out/${name}_0001.zkey" \
        "$out/${name}_final.zkey" \
        0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f \
        10 -n="Final Beacon phase2"

    echo "📜 Exporting verification key for $name..."
    snarkjs zkey export verificationkey \
        "$out/${name}_final.zkey" \
        "$out/${name}_verification_key.json"

    echo "⚙️  Exporting Solidity verifier for $name..."
    snarkjs zkey export solidityverifier \
        "$out/${name}_final.zkey" \
        "$out/${name}Verifier.sol"

    echo "✅ $name compiled successfully"
}

compile_circuit "solvency"
compile_circuit "inclusion"

echo ""
echo "🎉 All circuits compiled. Verifier contracts in build/*/:"
ls "$BUILD_DIR/solvency/" "$BUILD_DIR/inclusion/"
