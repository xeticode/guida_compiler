/**
 * Example integration of WASM acceleration into Guida compiler
 *
 * This demonstrates how to progressively enhance the compiler with WASM
 * while maintaining full backward compatibility.
 */

const { loadWasm } = require("./lib/wasm/node-loader");

class GuidaCompiler {
  constructor() {
    this.wasmModule = null;
    this.wasmReady = false;
  }

  /**
   * Initialize compiler with optional WASM acceleration
   */
  async init() {
    try {
      this.wasmModule = await loadWasm();
      this.wasmReady = !!this.wasmModule;

      if (this.wasmReady) {
        console.log("✓ Guida compiler initialized with WASM acceleration");
      } else {
        console.log("ℹ Guida compiler running in JavaScript mode");
      }
    } catch (error) {
      console.warn("WASM initialization failed, using JS fallback");
      this.wasmReady = false;
    }

    return this;
  }

  /**
   * Fast module name hashing (WASM-accelerated when available)
   */
  hashModuleName(moduleName) {
    if (this.wasmReady && this.wasmModule.hashString) {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(moduleName);
      const ptr = this.wasmModule.allocate(bytes.length);

      // Copy string to WASM memory
      const memory = new Uint8Array(
        this.wasmModule.memory.buffer,
        ptr,
        bytes.length
      );
      memory.set(bytes);

      // Call WASM function
      const hash = this.wasmModule.hashString(ptr, bytes.length);
      this.wasmModule.deallocate(ptr);

      return hash;
    }

    // Fallback to JS implementation
    return this.jsHashString(moduleName);
  }

  /**
   * JavaScript fallback for string hashing
   */
  jsHashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash >>> 0; // Convert to unsigned 32-bit integer
  }

  /**
   * Analyze pattern complexity (WASM-accelerated when available)
   */
  getPatternComplexity(pattern) {
    if (this.wasmReady && this.wasmModule.patternComplexity) {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(pattern);
      const ptr = this.wasmModule.allocate(bytes.length);

      const memory = new Uint8Array(
        this.wasmModule.memory.buffer,
        ptr,
        bytes.length
      );
      memory.set(bytes);

      const complexity = this.wasmModule.patternComplexity(ptr, bytes.length);
      this.wasmModule.deallocate(ptr);

      return complexity;
    }

    // Fallback to JS implementation
    return this.jsPatternComplexity(pattern);
  }

  /**
   * JavaScript fallback for pattern complexity
   */
  jsPatternComplexity(pattern) {
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

  /**
   * Compile a module with WASM acceleration where beneficial
   */
  async compile(source, options = {}) {
    // Example compilation flow
    const startTime = Date.now();

    // Use WASM for CPU-intensive operations
    const moduleHash = this.hashModuleName(options.moduleName || "Main");

    // Regular compilation continues...
    // (Your existing Elm-generated compiler code here)

    const endTime = Date.now();
    const wasmStatus = this.wasmReady ? "WASM" : "JS";

    console.log(`Compiled in ${endTime - startTime}ms (${wasmStatus})`);

    return {
      success: true,
      hash: moduleHash,
      mode: wasmStatus,
    };
  }
}

// Usage example
async function main() {
  const compiler = new GuidaCompiler();
  await compiler.init();

  // Run some benchmarks
  console.log("\n=== Performance Benchmarks ===\n");

  const iterations = 10000;

  // Benchmark 1: Module name hashing
  const hashStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    compiler.hashModuleName("Data.List.Extra.Stuff.More");
  }
  const hashEnd = Date.now();
  console.log(`Hash ${iterations} module names: ${hashEnd - hashStart}ms`);

  // Benchmark 2: Pattern complexity
  const patternStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    compiler.getPatternComplexity("(Just (x, y)) | Nothing | (Ok _)");
  }
  const patternEnd = Date.now();
  console.log(`Analyze ${iterations} patterns: ${patternEnd - patternStart}ms`);

  // Example compilation
  console.log("\n=== Compilation Example ===\n");
  await compiler.compile("module Main exposing (..)", {
    moduleName: "Main",
  });
}

// Export for use in your existing code
module.exports = { GuidaCompiler };

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}
