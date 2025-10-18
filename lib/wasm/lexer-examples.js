/**
 * Example: Using the WASM Lexer in Guida Compiler
 *
 * This demonstrates how to integrate the high-performance
 * lexer tokenization into your compilation pipeline.
 */

const lexer = require("./lexer-bridge");

// Example 1: Simple tokenization
async function example1_BasicTokenization() {
  console.log("\n═══════════════════════════════════════");
  console.log("Example 1: Basic Tokenization");
  console.log("═══════════════════════════════════════\n");

  await lexer.init();

  const source = `
module Main exposing (main)

main =
    "Hello, World!"
`;

  const tokens = lexer.tokenize(source);
  lexer.prettyPrint(source, tokens, 20);
}

// Example 2: Filter tokens
async function example2_FilterTokens() {
  console.log("\n═══════════════════════════════════════");
  console.log("Example 2: Filter Specific Tokens");
  console.log("═══════════════════════════════════════\n");

  await lexer.init();

  const source = `
type alias User =
    { name : String
    , age : Int
    }
`;

  const allTokens = lexer.tokenize(source);
  const noWhitespace = lexer.removeWhitespace(allTokens);

  console.log("All tokens:", allTokens.length);
  console.log("Without whitespace:", noWhitespace.length);

  // Get only keywords
  const keywords = lexer.filterTokens(noWhitespace, [lexer.TokenType.KEYWORD]);
  console.log("\nKeywords found:");
  keywords.forEach((token) => {
    console.log("  -", lexer.getTokenText(source, token));
  });

  // Get only identifiers
  const idents = lexer.filterTokens(noWhitespace, [
    lexer.TokenType.LOWER_IDENT,
    lexer.TokenType.UPPER_IDENT,
  ]);
  console.log("\nIdentifiers found:");
  idents.forEach((token) => {
    console.log("  -", lexer.getTokenText(source, token));
  });
}

// Example 3: Performance comparison
async function example3_Performance() {
  console.log("\n═══════════════════════════════════════");
  console.log("Example 3: Performance Benchmark");
  console.log("═══════════════════════════════════════\n");

  await lexer.init();

  // Generate a large source file
  const lines = [];
  for (let i = 0; i < 1000; i++) {
    lines.push(`function${i} : Int -> Int`);
    lines.push(`function${i} x = x + ${i}`);
    lines.push("");
  }
  const source = lines.join("\n");

  console.log(`Source size: ${source.length} characters`);
  console.log(`Source lines: ${lines.length}`);

  // Benchmark
  const startTime = Date.now();
  const tokens = lexer.tokenize(source);
  const endTime = Date.now();

  const duration = endTime - startTime;
  const charsPerMs = (source.length / duration).toFixed(0);
  const tokensPerMs = (tokens.length / duration).toFixed(0);

  console.log(`\nTokenization completed in ${duration}ms`);
  console.log(`Tokens generated: ${tokens.length}`);
  console.log(`Performance: ${charsPerMs} chars/ms`);
  console.log(`Performance: ${tokensPerMs} tokens/ms`);

  const stats = lexer.getStats();
  console.log(
    `\nUsing: ${stats.usingWasm ? "WASM (fast!)" : "JavaScript (fallback)"}`
  );
}

// Example 4: Error handling
async function example4_ErrorHandling() {
  console.log("\n═══════════════════════════════════════");
  console.log("Example 4: Error Handling");
  console.log("═══════════════════════════════════════\n");

  await lexer.init();

  const source = "hello @ world"; // @ is not a valid token
  const tokens = lexer.tokenize(source);

  const errors = lexer.filterTokens(tokens, [lexer.TokenType.ERROR]);

  if (errors.length > 0) {
    console.log("❌ Found invalid tokens:");
    errors.forEach((token) => {
      const text = lexer.getTokenText(source, token);
      console.log(`  Line ${token.line}, Col ${token.col}: "${text}"`);
    });
  } else {
    console.log("✓ No errors found");
  }
}

// Example 5: Real-world usage in compiler
async function example5_CompilerIntegration() {
  console.log("\n═══════════════════════════════════════");
  console.log("Example 5: Compiler Integration");
  console.log("═══════════════════════════════════════\n");

  await lexer.init();

  const source = `
module Calculator exposing (add, multiply)

add : Int -> Int -> Int
add x y =
    x + y

multiply : Int -> Int -> Int
multiply x y =
    x * y
`;

  console.log("Tokenizing source...");
  const allTokens = lexer.tokenize(source);

  // Remove whitespace and comments for parser
  const parseTokens = lexer.removeWhitespace(allTokens);

  console.log(`\nToken statistics:`);
  console.log(`  Total tokens: ${allTokens.length}`);
  console.log(`  Parser tokens: ${parseTokens.length}`);

  // Group by type
  const byType = {};
  parseTokens.forEach((token) => {
    const typeName = lexer.getTokenTypeName(token.type);
    byType[typeName] = (byType[typeName] || 0) + 1;
  });

  console.log(`\nToken distribution:`);
  Object.entries(byType).forEach(([type, count]) => {
    if (type !== "EOF") {
      console.log(`  ${type}: ${count}`);
    }
  });
}

// Run all examples
async function runAllExamples() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║  Guida WASM Lexer Usage Examples     ║");
  console.log("╚═══════════════════════════════════════╝");

  await example1_BasicTokenization();
  await example2_FilterTokens();
  await example3_Performance();
  await example4_ErrorHandling();
  await example5_CompilerIntegration();

  console.log("\n═══════════════════════════════════════");
  console.log("All examples completed!");
  console.log("═══════════════════════════════════════\n");
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch((error) => {
    console.error("Error running examples:", error);
    process.exit(1);
  });
}

module.exports = {
  example1_BasicTokenization,
  example2_FilterTokens,
  example3_Performance,
  example4_ErrorHandling,
  example5_CompilerIntegration,
};
