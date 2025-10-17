/**
 * Node.js WASM Loader
 * Handles WASM module loading with fallback to pure JS
 */

const fs = require('fs');
const path = require('path');

let wasmModule = null;
let isInitialized = false;

async function loadWasm() {
  if (isInitialized) {
    return wasmModule;
  }

  try {
    const wasmPath = path.join(__dirname, 'guida-core.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    
    const imports = {
      env: {
        abort: (msg, file, line, column) => {
          console.error(`WASM abort: ${msg} at ${file}:${line}:${column}`);
        },
        trace: (msg) => {
          if (process.env.DEBUG_WASM) {
            console.log(`WASM: ${msg}`);
          }
        }
      }
    };

    const compiled = await WebAssembly.instantiate(wasmBuffer, imports);
    wasmModule = compiled.instance.exports;
    isInitialized = true;
    
    if (process.env.DEBUG_WASM) {
      console.log('✓ WASM module loaded successfully');
    }
    
    return wasmModule;
  } catch (error) {
    console.warn('WASM module failed to load, using JS fallback:', error.message);
    isInitialized = true;
    return null;
  }
}

// Export functions with automatic fallback
module.exports = {
  loadWasm,
  isSupported: typeof WebAssembly !== 'undefined'
};
