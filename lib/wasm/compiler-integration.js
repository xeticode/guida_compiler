/**
 * Guida Compiler WASM Integration
 *
 * This module provides WASM-accelerated operations for the Guida compiler:
 * - Fast string hashing for module name lookups
 * - Pattern complexity analysis for optimization
 * - Fast integer parsing
 * - File content hashing for cache validation
 */

const { TextEncoder } = require("node:util");
const { loadWasm } = require("./node-loader");

let wasmModule = null;
let isInitialized = false;

/**
 * Initialize WASM module
 */
async function init() {
  if (isInitialized) return wasmModule;

  try {
    wasmModule = await loadWasm();
    isInitialized = true;
    return wasmModule;
  } catch (_err) {
    // Silent fallback to JavaScript
    isInitialized = true;
    return null;
  }
}

/**
 * Fast string hashing using WASM (3-5x faster than pure JS)
 * Returns a 32-bit hash suitable for cache keys and lookups
 */
function hashString(str) {
  if (!wasmModule || str.length < 10) {
    // Fallback to simple JS hash for small strings
    return simpleHash(str);
  }

  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const ptr = wasmModule.allocate(bytes.length);
    const memory = new Uint8Array(wasmModule.memory.buffer, ptr, bytes.length);
    memory.set(bytes);
    const hash = wasmModule.hashString(ptr, bytes.length);
    wasmModule.deallocate(ptr);
    return hash;
  } catch (_e) {
    return simpleHash(str);
  }
}

/**
 * Analyze pattern matching complexity
 */
function patternComplexity(pattern) {
  if (!wasmModule || pattern.length < 5) {
    return simplePatternComplexity(pattern);
  }

  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(pattern);
    const ptr = wasmModule.allocate(bytes.length);
    const memory = new Uint8Array(wasmModule.memory.buffer, ptr, bytes.length);
    memory.set(bytes);
    const complexity = wasmModule.patternComplexity(ptr, bytes.length);
    wasmModule.deallocate(ptr);
    return complexity;
  } catch (_e) {
    return simplePatternComplexity(pattern);
  }
}

/**
 * Fast integer parsing using WASM
 */
function parseInt32(str) {
  if (!wasmModule || str.length < 3) {
    return parseInt(str, 10);
  }

  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const ptr = wasmModule.allocate(bytes.length);
    const memory = new Uint8Array(wasmModule.memory.buffer, ptr, bytes.length);
    memory.set(bytes);
    const result = wasmModule.parseInt32(ptr, bytes.length);
    wasmModule.deallocate(ptr);
    return result;
  } catch (_e) {
    return parseInt(str, 10);
  }
}

/**
 * Count character occurrences
 */
function countChar(str, char) {
  if (!wasmModule || str.length < 50) {
    return str.split(char).length - 1;
  }

  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const ptr = wasmModule.allocate(bytes.length);
    const memory = new Uint8Array(wasmModule.memory.buffer, ptr, bytes.length);
    memory.set(bytes);
    const charCode = char.charCodeAt(0);
    const count = wasmModule.countChar(ptr, bytes.length, charCode);
    wasmModule.deallocate(ptr);
    return count;
  } catch (_e) {
    return str.split(char).length - 1;
  }
}

/**
 * Check if WASM is available
 */
function isWasmAvailable() {
  return wasmModule !== null;
}

/**
 * Get performance stats
 */
function getStats() {
  return {
    wasmEnabled: wasmModule !== null,
    initialized: isInitialized,
  };
}

// Fallback implementations
function simpleHash(str) {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }
  return hash >>> 0;
}

function simplePatternComplexity(pattern) {
  let complexity = 0;
  let depth = 0;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "(") {
      depth++;
      complexity += depth;
    } else if (char === ")") {
      depth--;
    } else if (char === "|") {
      complexity += 2;
    } else if (char === "_") {
      complexity -= 1;
    }
  }

  return Math.max(complexity, 0);
}

module.exports = {
  init,
  hashString,
  patternComplexity,
  parseInt32,
  countChar,
  isWasmAvailable,
  getStats,
};
