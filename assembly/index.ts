/**
 * Guida Compiler - WASM Computation Kernels
 * 
 * This module contains performance-critical operations:
 * - String hashing for module names and identifiers
 * - Pattern matching optimization
 * - Expression tree traversal
 */

// Memory management
let allocatedBlocks = new Map<i32, i32>();

export function allocate(size: i32): i32 {
  const ptr = heap.alloc(size);
  allocatedBlocks.set(ptr, size);
  return ptr;
}

export function deallocate(ptr: i32): void {
  if (allocatedBlocks.has(ptr)) {
    heap.free(ptr);
    allocatedBlocks.delete(ptr);
  }
}

/**
 * Fast string hashing using FNV-1a algorithm
 * Used for quick module name and identifier lookups
 */
export function hashString(ptr: i32, len: i32): u32 {
  let hash: u32 = 2166136261; // FNV offset basis
  
  for (let i: i32 = 0; i < len; i++) {
    const byte = load<u8>(ptr + i);
    hash ^= byte;
    hash = hash * 16777619; // FNV prime
  }
  
  return hash;
}

/**
 * Quick pattern complexity check
 * Returns a score indicating how complex a pattern is
 */
export function patternComplexity(ptr: i32, len: i32): i32 {
  let complexity: i32 = 0;
  let depth: i32 = 0;
  
  for (let i: i32 = 0; i < len; i++) {
    const char = load<u8>(ptr + i);
    
    if (char == 40) { // '('
      depth++;
      complexity += depth;
    } else if (char == 41) { // ')'
      depth--;
    } else if (char == 124) { // '|'
      complexity += 2;
    } else if (char == 95) { // '_'
      complexity -= 1;
    }
  }
  
  return max(complexity, 0);
}

/**
 * Count occurrences of a character in a string
 * Useful for various parsing operations
 */
export function countChar(ptr: i32, len: i32, target: u8): i32 {
  let count: i32 = 0;
  
  for (let i: i32 = 0; i < len; i++) {
    if (load<u8>(ptr + i) == target) {
      count++;
    }
  }
  
  return count;
}

/**
 * Fast integer parsing for optimization passes
 */
export function parseInt32(ptr: i32, len: i32): i32 {
  let result: i32 = 0;
  let negative: bool = false;
  let start: i32 = 0;
  
  if (len > 0 && load<u8>(ptr) == 45) { // '-'
    negative = true;
    start = 1;
  }
  
  for (let i = start; i < len; i++) {
    const char = load<u8>(ptr + i);
    if (char >= 48 && char <= 57) { // '0'-'9'
      result = result * 10 + (char - 48);
    } else {
      break;
    }
  }
  
  return negative ? -result : result;
}

// Store result length for retrieval
let lastResultLength: i32 = 0;

export function getResultLength(): i32 {
  return lastResultLength;
}

export function setResultLength(len: i32): void {
  lastResultLength = len;
}
