/**
 * WASM Bridge for Parser and Optimizer
 * This module provides a bridge between the Elm-generated JS and WASM modules
 */

let wasmInstance = null;
let wasmMemory = null;

export async function initWasm() {
  if (wasmInstance) {
    return wasmInstance;
  }

  try {
    // Check if running in browser or Node.js
    const isBrowser = typeof window !== 'undefined';
    
    let wasmModule;
    if (isBrowser) {
      const response = await fetch('guida-core.wasm');
      const buffer = await response.arrayBuffer();
      wasmModule = await WebAssembly.instantiate(buffer, {
        env: {
          abort: (msg, file, line, column) => {
            console.error(`WASM abort at ${file}:${line}:${column} - ${msg}`);
          },
          trace: (msg) => {
            console.log(`WASM trace: ${msg}`);
          }
        }
      });
    } else {
      // Node.js environment
      const fs = require('fs');
      const path = require('path');
      const wasmPath = path.join(__dirname, 'guida-core.wasm');
      const buffer = fs.readFileSync(wasmPath);
      wasmModule = await WebAssembly.instantiate(buffer, {
        env: {
          abort: (msg, file, line, column) => {
            console.error(`WASM abort at ${file}:${line}:${column} - ${msg}`);
          },
          trace: (msg) => {
            console.log(`WASM trace: ${msg}`);
          }
        }
      });
    }

    wasmInstance = wasmModule.instance;
    wasmMemory = wasmInstance.exports.memory;
    
    console.log('WASM module initialized successfully');
    return wasmInstance;
  } catch (error) {
    console.error('Failed to initialize WASM:', error);
    // Fallback to pure JS implementation
    return null;
  }
}

/**
 * High-performance string hashing using WASM
 */
export function hashString(str) {
  if (!wasmInstance || !wasmInstance.exports.hashString) {
    // Fallback to JS implementation
    return jsHashString(str);
  }
  
  // Use WASM implementation for better performance
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  
  // Allocate memory in WASM
  const ptr = wasmInstance.exports.allocate(bytes.length);
  const memory = new Uint8Array(wasmMemory.buffer, ptr, bytes.length);
  memory.set(bytes);
  
  const hash = wasmInstance.exports.hashString(ptr, bytes.length);
  wasmInstance.exports.deallocate(ptr);
  
  return hash;
}

/**
 * Fallback JS hash implementation
 */
function jsHashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Parse optimization - offload heavy computation to WASM
 */
export function optimizeExpression(exprJson) {
  if (!wasmInstance || !wasmInstance.exports.optimizeExpr) {
    return null; // Fallback to JS
  }
  
  const str = JSON.stringify(exprJson);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  
  const ptr = wasmInstance.exports.allocate(bytes.length);
  const memory = new Uint8Array(wasmMemory.buffer, ptr, bytes.length);
  memory.set(bytes);
  
  const resultPtr = wasmInstance.exports.optimizeExpr(ptr, bytes.length);
  const resultLen = wasmInstance.exports.getResultLength();
  
  const resultMemory = new Uint8Array(wasmMemory.buffer, resultPtr, resultLen);
  const decoder = new TextDecoder();
  const result = decoder.decode(resultMemory);
  
  wasmInstance.exports.deallocate(ptr);
  wasmInstance.exports.deallocate(resultPtr);
  
  return JSON.parse(result);
}

export const isWasmSupported = typeof WebAssembly !== 'undefined';
