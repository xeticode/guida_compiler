/**
 * Lexer Bridge Module
 *
 * High-level API for lexical tokenization with automatic fallback.
 * This module uses WASM when available and falls back to pure JavaScript.
 */

const { loadWasm } = require("./node-loader");
const fallback = require("./lexer-fallback");

let wasmModule = null;
let useWasm = false;

/**
 * Initialize the lexer (attempts to load WASM)
 */
async function init() {
  try {
    wasmModule = await loadWasm();
    useWasm = wasmModule !== null;

    if (useWasm) {
      console.log("✓ Lexer using WASM acceleration");
    } else {
      console.log("ℹ Lexer using JavaScript fallback");
    }
  } catch (error) {
    console.warn("Lexer falling back to JavaScript:", error.message);
    useWasm = false;
  }
}

/**
 * Tokenize source code using WASM or JavaScript fallback
 *
 * @param {string} source - Source code to tokenize
 * @returns {Array<Token>} Array of tokens
 */
function tokenize(source) {
  if (useWasm && wasmModule) {
    return tokenizeWasm(source);
  }
  return fallback.tokenizeSource(source);
}

/**
 * Tokenize using WASM
 * @private
 */
function tokenizeWasm(source) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(source);

  // Allocate memory for source
  const sourcePtr = wasmModule.allocate(bytes.length);
  const sourceView = new Uint8Array(
    wasmModule.memory.buffer,
    sourcePtr,
    bytes.length
  );
  sourceView.set(bytes);

  // Tokenize
  const tokenCount = wasmModule.tokenizeSource(sourcePtr, bytes.length);

  // Extract tokens
  const tokens = [];
  for (let i = 0; i < tokenCount; i++) {
    const packedToken = wasmModule.getToken(i);
    const token = unpackToken(packedToken);
    tokens.push(token);
  }

  // Clean up
  wasmModule.deallocate(sourcePtr);

  return tokens;
}

/**
 * Unpack a token from i64 format
 * Format: [type:8][start:16][end:16][line:12][col:12]
 * @private
 */
function unpackToken(packed) {
  // Convert number to BigInt if needed
  const bigPacked = typeof packed === "bigint" ? packed : BigInt(packed);

  const type = Number((bigPacked >> 56n) & 0xffn);
  const start = Number((bigPacked >> 40n) & 0xffffn);
  const end = Number((bigPacked >> 24n) & 0xffffn);
  const line = Number((bigPacked >> 12n) & 0xfffn);
  const col = Number(bigPacked & 0xfffn);

  return { type, start, end, line, col };
}

/**
 * Get the text of a token
 *
 * @param {string} source - Original source code
 * @param {Token} token - Token object
 * @returns {string} Token text
 */
function getTokenText(source, token) {
  return source.slice(token.start, token.end);
}

/**
 * Get token type name for debugging
 *
 * @param {number} type - Token type ID
 * @returns {string} Token type name
 */
function getTokenTypeName(type) {
  const typeNames = {
    0: "EOF",
    1: "SPACE",
    2: "NEWLINE",
    3: "LINE_COMMENT",
    4: "BLOCK_COMMENT",
    10: "KEYWORD",
    20: "LOWER_IDENT",
    21: "UPPER_IDENT",
    30: "INT",
    31: "FLOAT",
    32: "STRING",
    33: "CHAR",
    40: "OPERATOR",
    41: "LEFT_PAREN",
    42: "RIGHT_PAREN",
    43: "LEFT_BRACE",
    44: "RIGHT_BRACE",
    45: "LEFT_BRACKET",
    46: "RIGHT_BRACKET",
    47: "COMMA",
    48: "DOT",
    49: "EQUALS",
    50: "PIPE",
    51: "ARROW",
    52: "COLON",
    53: "BACKSLASH",
    54: "UNDERSCORE",
    99: "ERROR",
  };
  return typeNames[type] || "UNKNOWN";
}

/**
 * Filter tokens by type
 *
 * @param {Array<Token>} tokens - Array of tokens
 * @param {Array<number>} types - Token types to include
 * @returns {Array<Token>} Filtered tokens
 */
function filterTokens(tokens, types) {
  const typeSet = new Set(types);
  return tokens.filter((token) => typeSet.has(token.type));
}

/**
 * Remove whitespace and comment tokens
 *
 * @param {Array<Token>} tokens - Array of tokens
 * @returns {Array<Token>} Tokens without whitespace/comments
 */
function removeWhitespace(tokens) {
  return tokens.filter(
    (token) =>
      token.type !== fallback.TokenType.SPACE &&
      token.type !== fallback.TokenType.NEWLINE &&
      token.type !== fallback.TokenType.LINE_COMMENT &&
      token.type !== fallback.TokenType.BLOCK_COMMENT
  );
}

/**
 * Pretty print tokens for debugging
 *
 * @param {string} source - Original source code
 * @param {Array<Token>} tokens - Array of tokens
 * @param {number} maxTokens - Maximum tokens to print (default: 50)
 */
function prettyPrint(source, tokens, maxTokens = 50) {
  console.log("\nTokens:");
  console.log("═".repeat(80));

  const tokensToShow = tokens.slice(0, maxTokens);

  for (const token of tokensToShow) {
    const text = getTokenText(source, token);
    const typeName = getTokenTypeName(token.type).padEnd(15);
    const location = `${token.line}:${token.col}`.padEnd(8);
    const preview = text
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t")
      .slice(0, 30);

    console.log(`${typeName} ${location} "${preview}"`);
  }

  if (tokens.length > maxTokens) {
    console.log(`... and ${tokens.length - maxTokens} more tokens`);
  }

  console.log("═".repeat(80));
  console.log(`Total tokens: ${tokens.length}`);
}

/**
 * Get performance statistics
 *
 * @returns {object} Stats about WASM usage
 */
function getStats() {
  return {
    usingWasm: useWasm,
    wasmLoaded: wasmModule !== null,
    fallbackAvailable: true,
  };
}

module.exports = {
  init,
  tokenize,
  getTokenText,
  getTokenTypeName,
  filterTokens,
  removeWhitespace,
  prettyPrint,
  getStats,
  TokenType: fallback.TokenType,
};
