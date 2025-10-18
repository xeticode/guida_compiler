/**
 * Test Suite for Lexer Tokenization
 *
 * Tests both WASM and JavaScript implementations
 */

const lexer = require("./lexer-bridge");
const { TokenType } = require("./lexer-fallback");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  } else {
    testsFailed++;
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  const condition = JSON.stringify(actual) === JSON.stringify(expected);
  assert(condition, message);
  if (!condition) {
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Actual:   ${JSON.stringify(actual)}`);
  }
}

function testKeywords() {
  console.log(`\n${colors.blue}Test Suite: Keywords${colors.reset}`);

  const source = "if then else case of let in type";
  const tokens = lexer.tokenize(source);
  const keywords = tokens.filter((t) => t.type === TokenType.KEYWORD);

  assertEquals(keywords.length, 8, "Should find 8 keywords");
  assertEquals(
    lexer.getTokenText(source, keywords[0]),
    "if",
    'First keyword is "if"'
  );
  assertEquals(
    lexer.getTokenText(source, keywords[1]),
    "then",
    'Second keyword is "then"'
  );
}

function testIdentifiers() {
  console.log(`\n${colors.blue}Test Suite: Identifiers${colors.reset}`);

  const source = "myVar MyType foo123 Bar_456";
  const tokens = lexer.removeWhitespace(lexer.tokenize(source));

  assertEquals(tokens.length, 5, "Should find 4 identifiers + EOF"); // +EOF
  assertEquals(
    tokens[0].type,
    TokenType.LOWER_IDENT,
    "myVar is lowercase identifier"
  );
  assertEquals(
    tokens[1].type,
    TokenType.UPPER_IDENT,
    "MyType is uppercase identifier"
  );
  assertEquals(
    tokens[2].type,
    TokenType.LOWER_IDENT,
    "foo123 is lowercase identifier"
  );
  assertEquals(
    tokens[3].type,
    TokenType.UPPER_IDENT,
    "Bar_456 is uppercase identifier"
  );
}

function testNumbers() {
  console.log(`\n${colors.blue}Test Suite: Numbers${colors.reset}`);

  const source = "42 3.14 1_000_000 42.5";
  const tokens = lexer.removeWhitespace(lexer.tokenize(source));

  assert(tokens.length >= 4, "Should find at least 4 number tokens");
  assertEquals(tokens[0].type, TokenType.INT, "42 is an integer");
  assertEquals(tokens[1].type, TokenType.FLOAT, "3.14 is a float");
  assertEquals(
    tokens[2].type,
    TokenType.INT,
    "1_000_000 is an integer with underscores"
  );
  assertEquals(tokens[3].type, TokenType.FLOAT, "42.5 is a float");
}

function testStrings() {
  console.log(`\n${colors.blue}Test Suite: Strings${colors.reset}`);

  const source = '"hello" "world\\n" "escaped\\"quote"';
  const tokens = lexer.removeWhitespace(lexer.tokenize(source));

  assert(tokens.length >= 3, "Should find 3 string tokens");
  assertEquals(tokens[0].type, TokenType.STRING, "First token is string");
  assertEquals(tokens[1].type, TokenType.STRING, "Second token is string");
  assertEquals(tokens[2].type, TokenType.STRING, "Third token is string");
  assertEquals(
    lexer.getTokenText(source, tokens[0]),
    '"hello"',
    "String includes quotes"
  );
}

function testCharacters() {
  console.log(`\n${colors.blue}Test Suite: Characters${colors.reset}`);

  const source = "'a' '\\n' '\\''";
  const tokens = lexer.removeWhitespace(lexer.tokenize(source));

  assert(tokens.length >= 3, "Should find 3 char tokens");
  assertEquals(tokens[0].type, TokenType.CHAR, "'a' is a character");
  assertEquals(tokens[1].type, TokenType.CHAR, "'\\n' is a character");
  assertEquals(tokens[2].type, TokenType.CHAR, "'\\'  is a character");
}

function testOperators() {
  console.log(`\n${colors.blue}Test Suite: Operators${colors.reset}`);

  const source = "+ - * / ++ /= < > && <|";
  const tokens = lexer.removeWhitespace(lexer.tokenize(source));

  assert(tokens.length >= 10, "Should find multiple operator tokens");

  // Check specific operators
  const opTexts = tokens.slice(0, -1).map((t) => lexer.getTokenText(source, t)); // -1 for EOF
  assert(opTexts.includes("+"), "Should find + operator");
  assert(opTexts.includes("++"), "Should find ++ operator");
  assert(opTexts.includes("&&"), "Should find && operator");
}

function testSymbols() {
  console.log(`\n${colors.blue}Test Suite: Symbols${colors.reset}`);

  const source = "( ) { } [ ] , . = | : -> \\";
  const tokens = lexer.removeWhitespace(lexer.tokenize(source));

  assertEquals(tokens[0].type, TokenType.LEFT_PAREN, "( is left paren");
  assertEquals(tokens[1].type, TokenType.RIGHT_PAREN, ") is right paren");
  assertEquals(tokens[2].type, TokenType.LEFT_BRACE, "{ is left brace");
  assertEquals(tokens[3].type, TokenType.RIGHT_BRACE, "} is right brace");
  assertEquals(tokens[4].type, TokenType.LEFT_BRACKET, "[ is left bracket");
  assertEquals(tokens[5].type, TokenType.RIGHT_BRACKET, "] is right bracket");
  assertEquals(tokens[6].type, TokenType.COMMA, ", is comma");
  assertEquals(tokens[7].type, TokenType.DOT, ". is dot");
  assertEquals(tokens[8].type, TokenType.EQUALS, "= is equals");
  assertEquals(tokens[9].type, TokenType.PIPE, "| is pipe");
  assertEquals(tokens[10].type, TokenType.COLON, ": is colon");
  assertEquals(tokens[11].type, TokenType.ARROW, "-> is arrow");
  assertEquals(tokens[12].type, TokenType.BACKSLASH, "\\ is backslash");
}

function testComments() {
  console.log(`\n${colors.blue}Test Suite: Comments${colors.reset}`);

  const source = `
-- Line comment
{- Block comment -}
{- Nested {- comment -} here -}
`;
  const tokens = lexer.tokenize(source);
  const comments = tokens.filter(
    (t) =>
      t.type === TokenType.LINE_COMMENT || t.type === TokenType.BLOCK_COMMENT
  );

  assertEquals(comments.length, 3, "Should find 3 comments");
  assertEquals(
    comments[0].type,
    TokenType.LINE_COMMENT,
    "First is line comment"
  );
  assertEquals(
    comments[1].type,
    TokenType.BLOCK_COMMENT,
    "Second is block comment"
  );
  assertEquals(
    comments[2].type,
    TokenType.BLOCK_COMMENT,
    "Third is nested block comment"
  );
}

function testComplexExpression() {
  console.log(`\n${colors.blue}Test Suite: Complex Expression${colors.reset}`);

  const source = `
addNumbers : Int -> Int -> Int
addNumbers x y =
    let
        sum = x + y
    in
    sum
`;

  const tokens = lexer.tokenize(source);
  assert(tokens.length > 20, "Should generate many tokens");

  const nonWhitespace = lexer.removeWhitespace(tokens);
  assert(
    nonWhitespace.length > 10,
    "Should have multiple non-whitespace tokens"
  );

  // Find the function name
  const addNumbersToken = nonWhitespace.find(
    (t) =>
      t.type === TokenType.LOWER_IDENT &&
      lexer.getTokenText(source, t) === "addNumbers"
  );
  assert(addNumbersToken !== undefined, "Should find addNumbers identifier");

  // Find keywords
  const keywords = nonWhitespace.filter((t) => t.type === TokenType.KEYWORD);
  assert(keywords.length >= 2, "Should find let and in keywords");
}

function testPerformance() {
  console.log(`\n${colors.blue}Test Suite: Performance${colors.reset}`);

  // Generate a large source file
  const lines = [];
  for (let i = 0; i < 1000; i++) {
    lines.push(`myFunction${i} x y = x + y + ${i}`);
  }
  const source = lines.join("\n");

  const startTime = Date.now();
  const tokens = lexer.tokenize(source);
  const endTime = Date.now();
  const duration = endTime - startTime;

  assert(tokens.length > 5000, "Should generate thousands of tokens");
  console.log(
    `  ${colors.cyan}Tokenized ${source.length} characters in ${duration}ms${colors.reset}`
  );
  console.log(
    `  ${colors.cyan}Performance: ${(source.length / duration).toFixed(
      0
    )} chars/ms${colors.reset}`
  );

  assert(duration < 1000, "Should complete in less than 1 second");
}

function testEdgeCases() {
  console.log(`\n${colors.blue}Test Suite: Edge Cases${colors.reset}`);

  // Empty source
  let tokens = lexer.tokenize("");
  assertEquals(tokens.length, 1, "Empty source should have EOF token");
  assertEquals(tokens[0].type, TokenType.EOF, "Only token should be EOF");

  // Only whitespace
  tokens = lexer.tokenize("   \n  \t  \n");
  assert(
    tokens[tokens.length - 1].type === TokenType.EOF,
    "Should end with EOF"
  );

  // Unclosed string
  tokens = lexer.tokenize('"unclosed');
  const stringTokens = tokens.filter((t) => t.type === TokenType.STRING);
  assertEquals(stringTokens.length, 1, "Should still create string token");

  // Multiple operators
  tokens = lexer.removeWhitespace(lexer.tokenize("+++"));
  assertEquals(tokens[0].type, TokenType.OPERATOR, "+++ is an operator");
}

function testRealWorldCode() {
  console.log(`\n${colors.blue}Test Suite: Real World Code${colors.reset}`);

  const source = `
module Main exposing (main)

import Html exposing (text)

type alias Model =
    { count : Int
    , name : String
    }

update : Msg -> Model -> Model
update msg model =
    case msg of
        Increment ->
            { model | count = model.count + 1 }

        Decrement ->
            { model | count = model.count - 1 }

main =
    text "Hello, World!"
`;

  const tokens = lexer.tokenize(source);
  assert(tokens.length > 50, "Real code should generate many tokens");

  const nonWhitespace = lexer.removeWhitespace(tokens);

  // Find 'module' keyword
  const moduleToken = nonWhitespace.find(
    (t) =>
      t.type === TokenType.KEYWORD && lexer.getTokenText(source, t) === "module"
  );
  assert(moduleToken !== undefined, "Should find module keyword");

  // Find 'Main' identifier
  const mainIdent = nonWhitespace.find(
    (t) =>
      t.type === TokenType.UPPER_IDENT &&
      lexer.getTokenText(source, t) === "Main"
  );
  assert(mainIdent !== undefined, "Should find Main identifier");

  // Find numbers
  const numbers = nonWhitespace.filter((t) => t.type === TokenType.INT);
  assert(numbers.length >= 2, "Should find numeric literals");
}

async function runAllTests() {
  console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}Guida Lexer Test Suite${colors.reset}`);
  console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}`);

  // Initialize lexer
  await lexer.init();

  const stats = lexer.getStats();
  console.log(`\nUsing: ${stats.usingWasm ? "WASM" : "JavaScript fallback"}`);

  try {
    testKeywords();
    testIdentifiers();
    testNumbers();
    testStrings();
    testCharacters();
    testOperators();
    testSymbols();
    testComments();
    testComplexExpression();
    testPerformance();
    testEdgeCases();
    testRealWorldCode();

    console.log(`\n${colors.cyan}${"=".repeat(60)}${colors.reset}`);
    console.log(`${colors.green}✓ All tests passed!${colors.reset}`);
    console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}`);
    console.log(`Total: ${testsRun} assertions`);
    console.log(`Passed: ${colors.green}${testsPassed}${colors.reset}`);
    console.log(
      `Failed: ${testsFailed > 0 ? colors.red : colors.green}${testsFailed}${
        colors.reset
      }`
    );
    console.log();

    process.exit(0);
  } catch (error) {
    console.log(`\n${colors.red}${"=".repeat(60)}${colors.reset}`);
    console.log(`${colors.red}✗ Tests failed${colors.reset}`);
    console.log(`${colors.red}${"=".repeat(60)}${colors.reset}`);
    console.log(`Total: ${testsRun} assertions`);
    console.log(`Passed: ${colors.green}${testsPassed}${colors.reset}`);
    console.log(`Failed: ${colors.red}${testsFailed}${colors.reset}`);
    console.log(`\nError: ${error.message}`);
    console.log();

    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
