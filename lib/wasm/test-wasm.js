/**
 * Test WASM Module Integration
 */

const { loadWasm, isSupported } = require("./node-loader");

async function runTests() {
  console.log("=".repeat(60));
  console.log("Guida WASM Module Tests");
  console.log("=".repeat(60));
  console.log("");

  // Check if WebAssembly is supported
  console.log("WebAssembly Support:", isSupported ? "✓ Yes" : "✗ No");
  console.log("");

  if (!isSupported) {
    console.log("WebAssembly not supported in this environment");
    return;
  }

  // Load WASM module
  console.log("Loading WASM module...");
  const wasm = await loadWasm();

  if (!wasm) {
    console.log("✗ WASM module failed to load");
    return;
  }

  console.log("✓ WASM module loaded successfully");
  console.log("");

  // Test 1: String hashing
  console.log("Test 1: String Hashing");
  console.log("-".repeat(60));

  const testStrings = [
    "Main",
    "Data.List",
    "Html.Attributes",
    "Platform.Cmd",
    "Json.Decode.Extra",
  ];

  const encoder = new TextEncoder();

  for (const str of testStrings) {
    const bytes = encoder.encode(str);
    const ptr = wasm.allocate(bytes.length);
    const memory = new Uint8Array(wasm.memory.buffer, ptr, bytes.length);
    memory.set(bytes);

    const hash = wasm.hashString(ptr, bytes.length);
    wasm.deallocate(ptr);

    console.log(`  "${str}" -> ${hash}`);
  }
  console.log("");

  // Test 2: Pattern complexity
  console.log("Test 2: Pattern Complexity Analysis");
  console.log("-".repeat(60));

  const patterns = [
    "x",
    "(x, y)",
    "Just x",
    "(Just (x, y))",
    "_ | Nothing",
    "(Ok _) | (Err msg)",
  ];

  for (const pattern of patterns) {
    const bytes = encoder.encode(pattern);
    const ptr = wasm.allocate(bytes.length);
    const memory = new Uint8Array(wasm.memory.buffer, ptr, bytes.length);
    memory.set(bytes);

    const complexity = wasm.patternComplexity(ptr, bytes.length);
    wasm.deallocate(ptr);

    console.log(`  "${pattern}" -> complexity: ${complexity}`);
  }
  console.log("");

  // Test 3: Performance benchmark
  console.log("Test 3: Performance Benchmark");
  console.log("-".repeat(60));

  const iterations = 100000;
  const testString = "Data.List.Extra.Something.Long.Module.Name";
  const testBytes = encoder.encode(testString);

  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const ptr = wasm.allocate(testBytes.length);
    const memory = new Uint8Array(wasm.memory.buffer, ptr, testBytes.length);
    memory.set(testBytes);
    wasm.hashString(ptr, testBytes.length);
    wasm.deallocate(ptr);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  const opsPerSecond = Math.round((iterations / duration) * 1000);

  console.log(
    `  Hashed ${iterations.toLocaleString()} strings in ${duration}ms`
  );
  console.log(`  Performance: ${opsPerSecond.toLocaleString()} ops/sec`);
  console.log("");

  // Test 4: Integer parsing
  console.log("Test 4: Integer Parsing");
  console.log("-".repeat(60));

  const numbers = ["42", "-123", "0", "999999", "-1"];

  for (const numStr of numbers) {
    const bytes = encoder.encode(numStr);
    const ptr = wasm.allocate(bytes.length);
    const memory = new Uint8Array(wasm.memory.buffer, ptr, bytes.length);
    memory.set(bytes);

    const parsed = wasm.parseInt32(ptr, bytes.length);
    wasm.deallocate(ptr);

    console.log(`  "${numStr}" -> ${parsed}`);
  }
  console.log("");

  console.log("=".repeat(60));
  console.log("✓ All tests completed successfully!");
  console.log("=".repeat(60));
}

// Run tests
runTests().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
