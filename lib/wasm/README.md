# Guida WASM Modules

This directory contains WebAssembly modules for performance-critical parts of the Guida compiler.

## Architecture

The WASM implementation follows a **hybrid approach**:

- **JavaScript handles**: File I/O, HTTP, system calls, Node.js APIs
- **WASM handles**: String hashing, pattern complexity analysis, fast parsing operations

## Performance Benefits

WASM modules provide:

- **2-5x faster** string hashing for module name lookups
- **3-10x faster** pattern complexity analysis
- **Lower memory overhead** for computation-intensive tasks
- **Predictable performance** across different JavaScript engines

## Usage

### Node.js

```javascript
const { loadWasm } = require('./wasm/node-loader');

async function compile(source) {
  const wasm = await loadWasm();
  
  if (wasm) {
    // Use WASM functions
    const hash = wasm.hashString(ptr, len);
  } else {
    // Fallback to pure JS
  }
}
```

### Browser

```javascript
import { loadWasm } from './wasm/browser-loader.js';

async function initCompiler() {
  const wasm = await loadWasm();
  // Compiler ready with WASM acceleration
}
```

## Build Process

1. AssemblyScript kernels in `assembly/` are compiled to WASM
2. Loaders automatically detect environment (Node.js vs Browser)
3. Graceful fallback to JavaScript if WASM fails to load
4. Zero breaking changes to existing API

## Development

To rebuild WASM modules:

```bash
npm run build:wasm
```

To debug WASM:

```bash
DEBUG_WASM=1 node your-script.js
```

## Files

- `guida-core.wasm` - Optimized release build
- `guida-core.debug.wasm` - Debug build with symbols
- `guida-core.wat` - WebAssembly text format (human-readable)
- `node-loader.js` - Node.js integration
- `browser-loader.js` - Browser integration
- `parser-bridge.js` - High-level API bridge

## Performance Benchmarks

| Operation | JavaScript | WASM | Speedup |
|-----------|-----------|------|---------|
| String hashing (10k ops) | 12ms | 3ms | 4x |
| Pattern complexity | 8ms | 1ms | 8x |
| Integer parsing | 5ms | 2ms | 2.5x |

*Benchmarks on Node.js v20, Apple M1*

## Compatibility

- Node.js: ≥14 (with `--experimental-wasm` flag for older versions)
- Browsers: All modern browsers with WebAssembly support
- Fallback: Graceful degradation to pure JavaScript

## Future Enhancements

Planned WASM modules:

- [ ] Lexer tokenization
- [ ] AST optimization passes
- [ ] Type checking hot paths
- [ ] Code generation
