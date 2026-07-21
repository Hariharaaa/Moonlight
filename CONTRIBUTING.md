# Contributing to FullMoon Midnight Counter

Thank you for your interest in contributing!

## Development Setup

```bash
# 1. Install Node.js v22
nvm install 22 && nvm use 22

# 2. Install Compact compiler
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
export PATH="$PATH:$HOME/.local/bin"
compact update 0.31.1

# 3. Install dependencies
npm install

# 4. Compile contract
npm run compile

# 5. Run tests
npm test
```

## Compact Language Notes

Key syntax rules learned building this project:

| Feature | Correct Syntax |
|---------|---------------|
| Assert with message | `assert(condition, "message")` |
| Disclose ledger Counter | `disclose(counter)` → `Uint<64>` |
| Counter increment by literal | `counter.increment(1)` |
| Counter increment by variable | `counter.increment(myUint16Var)` |
| Counter type for methods | Must use `Uint<16>` for variable increments |
| Private witness parameter | Circuit parameter = witness by default |
| Required disclose for ledger write | Must `disclose(witnessVar)` before using it in Counter.increment |

## Privacy Model Rules

When writing Compact contracts:
1. **Ledger fields** = always PUBLIC on-chain
2. **Circuit parameters** = private witnesses by default
3. **`disclose(x)`** = intentionally reveals `x` in the proof's public output
4. **`assert(cond, msg)`** = ZK-proves constraint without revealing witness value
5. Any witness value that **mutates ledger state** must go through `disclose()`

## Commit Guidelines

Use conventional commits:
- `feat:` — new contract feature
- `fix:` — bug fix in contract or tests
- `docs:` — documentation update
- `test:` — new or updated tests
- `ci:` — CI/CD changes
- `refactor:` — code refactoring without behavior change
