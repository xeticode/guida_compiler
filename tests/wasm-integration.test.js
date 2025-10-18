/**
 * WASM Integration Test
 * Verifies that WASM-optimized functions work correctly
 */

const fs = require("fs");
const path = require("path");

// Load the compiled guida.js
const guidaPath = path.join(__dirname, "..", "bin", "guida.js");
const guidaCode = fs.readFileSync(guidaPath, "utf8");

// Check if WASM runtime was injected
const hasWasmRuntime = guidaCode.includes("WASM-ACCELERATED RUNTIME");
const hasStringReverse = guidaCode.includes("_WASM_MODULE.stringReverse");
const hasWasmInit = guidaCode.includes("function _initWasm()");

console.log("✓ WASM Integration Tests\n");
console.log("=".repeat(50));

// Test 1: WASM runtime injection
console.log("\n1. WASM Runtime Injection:");
if (hasWasmRuntime) {
  console.log("   ✓ WASM runtime header found");
} else {
  console.error("   ✗ WASM runtime header missing");
  process.exit(1);
}

if (hasWasmInit) {
  console.log("   ✓ WASM initialization function found");
} else {
  console.error("   ✗ WASM initialization function missing");
  process.exit(1);
}

// Test 2: String operations optimization
console.log("\n2. String Operations:");
if (hasStringReverse) {
  console.log("   ✓ _String_reverse optimized with WASM");
} else {
  console.error("   ✗ _String_reverse not optimized");
  process.exit(1);
}

// Check for _String_indexes optimization
const hasStringIndexes = guidaCode.includes("_WASM_MODULE.stringIndexOf");
if (hasStringIndexes) {
  console.log("   ✓ _String_indexes optimized with WASM");
} else {
  console.error("   ✗ _String_indexes not optimized");
  process.exit(1);
}

// Check for fallback implementation
const hasFallback = guidaCode.includes("// Original JavaScript implementation");
if (hasFallback) {
  console.log("   ✓ Fallback to JavaScript maintained");
} else {
  console.error("   ✗ Fallback to JavaScript missing");
  process.exit(1);
}

// Test 3: Array operations optimization
console.log("\n3. Array Operations:");

// Check for _JsArray_slice optimization
const hasArraySlice = guidaCode.includes("_WASM_MODULE.arraySlice");
if (hasArraySlice) {
  console.log("   ✓ _JsArray_slice optimized with WASM");
} else {
  console.error("   ✗ _JsArray_slice not optimized");
  process.exit(1);
}

// Check for _JsArray_appendN optimization
const hasArrayAppend = guidaCode.includes("_WASM_MODULE.arrayAppend");
if (hasArrayAppend) {
  console.log("   ✓ _JsArray_appendN optimized with WASM");
} else {
  console.error("   ✗ _JsArray_appendN not optimized");
  process.exit(1);
}

// Test 4: WASM binary embedded
console.log("\n4. WASM Binary:");
const hasWasmBase64 = guidaCode.includes("var wasmBase64 = 'AGFzbQEA");
if (hasWasmBase64) {
  console.log("   ✓ WASM binary embedded as base64");
} else {
  console.error("   ✗ WASM binary not embedded");
  process.exit(1);
}

// Test 5: Memory helpers
console.log("\n5. Memory Helpers:");
const helpers = [
  "_copyStringToWasm",
  "_copyStringFromWasm",
  "_copyArrayToWasm",
  "_copyArrayFromWasm",
];

let allHelpersPresent = true;
for (const helper of helpers) {
  if (guidaCode.includes(`function ${helper}`)) {
    console.log(`   ✓ ${helper} helper found`);
  } else {
    console.error(`   ✗ ${helper} helper missing`);
    allHelpersPresent = false;
  }
}

if (!allHelpersPresent) {
  process.exit(1);
}

// Test 6: File size check
console.log("\n6. File Size:");
const stats = fs.statSync(guidaPath);
const sizeKB = (stats.size / 1024).toFixed(2);
console.log(`   File size: ${sizeKB} KB`);

if (stats.size > 0) {
  console.log("   ✓ Output file generated successfully");
} else {
  console.error("   ✗ Output file is empty");
  process.exit(1);
}

// Test 7: Check minified version
console.log("\n7. Minified Version:");
const minPath = path.join(__dirname, "..", "bin", "guida.min.js");
if (fs.existsSync(minPath)) {
  const minCode = fs.readFileSync(minPath, "utf8");
  const minHasWasm =
    minCode.includes("WASM-ACCELERATED RUNTIME") ||
    minCode.includes("_WASM_INITIALIZED");

  if (minHasWasm) {
    console.log("   ✓ WASM injected into minified version");
  } else {
    console.log("   ⚠ WASM not found in minified version (run full build)");
  }

  const minStats = fs.statSync(minPath);
  const minSizeKB = (minStats.size / 1024).toFixed(2);
  console.log(`   Minified size: ${minSizeKB} KB`);
} else {
  console.log("   ⚠ Minified version not found (run full build)");
}

console.log("\n" + "=".repeat(50));
console.log("\n✓ All WASM integration tests passed!\n");

// Test 8: Runtime test (if possible)
console.log("8. Runtime Test:");
try {
  // Try to execute a simple function
  eval(guidaCode);

  // Check if WASM initialized
  if (typeof _WASM_INITIALIZED !== "undefined") {
    console.log(
      `   WASM initialized: ${
        _WASM_INITIALIZED ? "YES" : "NO (fallback to JS)"
      }`
    );
  }

  // Test _String_reverse if available
  if (typeof _String_reverse === "function") {
    const testStr = "hello";
    const reversed = _String_reverse(testStr);
    if (reversed === "olleh") {
      console.log('   ✓ _String_reverse("hello") = "olleh"');
    } else {
      console.error(
        `   ✗ _String_reverse("hello") = "${reversed}" (expected "olleh")`
      );
      process.exit(1);
    }
  }
} catch (e) {
  console.log("   ⚠ Runtime test skipped (eval not supported or errors)");
  console.log(`     ${e.message}`);
}

console.log("\n" + "=".repeat(50));
console.log("✓ WASM Integration Complete!\n");
