/**
 * Guida Compiler - WASM Computation Kernels
 * 
 * This module contains performance-critical operations:
 * - String hashing for module names and identifiers
 * - Pattern matching optimization
 * - Expression tree traversal
 * - Lexical tokenization
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

// ============================================================
// LEXER TOKENIZATION
// ============================================================

/**
 * Token types returned by the lexer
 * These correspond to common Elm/Guida token categories
 */
export enum TokenType {
  EOF = 0,
  // Whitespace and comments
  SPACE = 1,
  NEWLINE = 2,
  LINE_COMMENT = 3,
  BLOCK_COMMENT = 4,
  // Keywords
  KEYWORD = 10,
  // Identifiers
  LOWER_IDENT = 20,
  UPPER_IDENT = 21,
  // Literals
  INT = 30,
  FLOAT = 31,
  STRING = 32,
  CHAR = 33,
  // Operators and symbols
  OPERATOR = 40,
  LEFT_PAREN = 41,
  RIGHT_PAREN = 42,
  LEFT_BRACE = 43,
  RIGHT_BRACE = 44,
  LEFT_BRACKET = 45,
  RIGHT_BRACKET = 46,
  COMMA = 47,
  DOT = 48,
  EQUALS = 49,
  PIPE = 50,
  ARROW = 51,
  COLON = 52,
  BACKSLASH = 53,
  UNDERSCORE = 54,
  // Error
  ERROR = 99
}

/**
 * Token structure (5 integers per token)
 */
class Token {
  type: i32 = 0;
  start: i32 = 0;
  end: i32 = 0;
  line: i32 = 0;
  col: i32 = 0;
}

// Token buffer for storing results
let tokens: Token[] = [];

/**
 * Check if character is whitespace (space, tab, carriage return)
 */
@inline
function isSpace(char: u8): bool {
  return char == 32 || char == 9 || char == 13; // space, tab, \r
}

/**
 * Check if character is a newline
 */
@inline
function isNewline(char: u8): bool {
  return char == 10; // \n
}

/**
 * Check if character is a digit
 */
@inline
function isDigit(char: u8): bool {
  return char >= 48 && char <= 57; // 0-9
}

/**
 * Check if character can start a lowercase identifier
 */
@inline
function isLowerStart(char: u8): bool {
  return char >= 97 && char <= 122; // a-z
}

/**
 * Check if character can start an uppercase identifier
 */
@inline
function isUpperStart(char: u8): bool {
  return char >= 65 && char <= 90; // A-Z
}

/**
 * Check if character can be part of an identifier
 */
@inline
function isIdentChar(char: u8): bool {
  return (char >= 97 && char <= 122) || // a-z
         (char >= 65 && char <= 90) || // A-Z
         (char >= 48 && char <= 57) || // 0-9
         char == 95; // _
}

/**
 * Check if character can be part of an operator
 */
@inline
function isOperatorChar(char: u8): bool {
  return char == 43 || // +
         char == 45 || // -
         char == 42 || // *
         char == 47 || // /
         char == 61 || // =
         char == 60 || // <
         char == 62 || // >
         char == 58 || // :
         char == 38 || // &
         char == 124 || // |
         char == 94 || // ^
         char == 63 || // ?
         char == 37 || // %
         char == 33 || // !
         char == 46; // .
}

/**
 * Check if a string (in memory) is a keyword
 * Returns true if keyword, false otherwise
 */
function isKeyword(ptr: i32, len: i32): bool {
  if (len == 2) {
    const c0 = load<u8>(ptr);
    const c1 = load<u8>(ptr + 1);
    // if, in, of, as
    return (c0 == 105 && c1 == 102) || // if
           (c0 == 105 && c1 == 110) || // in
           (c0 == 111 && c1 == 102) || // of
           (c0 == 97 && c1 == 115); // as
  } else if (len == 3) {
    const c0 = load<u8>(ptr);
    const c1 = load<u8>(ptr + 1);
    const c2 = load<u8>(ptr + 2);
    // let, non
    return (c0 == 108 && c1 == 101 && c2 == 116) || // let
           (c0 == 110 && c1 == 111 && c2 == 110); // non
  } else if (len == 4) {
    const c0 = load<u8>(ptr);
    const c1 = load<u8>(ptr + 1);
    const c2 = load<u8>(ptr + 2);
    const c3 = load<u8>(ptr + 3);
    // type, port, case, then, else, left, wher
    return (c0 == 116 && c1 == 121 && c2 == 112 && c3 == 101) || // type
           (c0 == 112 && c1 == 111 && c2 == 114 && c3 == 116) || // port
           (c0 == 99 && c1 == 97 && c2 == 115 && c3 == 101) || // case
           (c0 == 116 && c1 == 104 && c2 == 101 && c3 == 110) || // then
           (c0 == 101 && c1 == 108 && c2 == 115 && c3 == 101) || // else
           (c0 == 108 && c1 == 101 && c2 == 102 && c3 == 116); // left
  } else if (len == 5) {
    const c0 = load<u8>(ptr);
    const c1 = load<u8>(ptr + 1);
    const c2 = load<u8>(ptr + 2);
    const c3 = load<u8>(ptr + 3);
    const c4 = load<u8>(ptr + 4);
    // alias, infix, right, where
    return (c0 == 97 && c1 == 108 && c2 == 105 && c3 == 97 && c4 == 115) || // alias
           (c0 == 105 && c1 == 110 && c2 == 102 && c3 == 105 && c4 == 120) || // infix
           (c0 == 114 && c1 == 105 && c2 == 103 && c3 == 104 && c4 == 116) || // right
           (c0 == 119 && c1 == 104 && c2 == 101 && c3 == 114 && c4 == 101); // where
  } else if (len == 6) {
    const c0 = load<u8>(ptr);
    const c1 = load<u8>(ptr + 1);
    const c2 = load<u8>(ptr + 2);
    const c3 = load<u8>(ptr + 3);
    const c4 = load<u8>(ptr + 4);
    const c5 = load<u8>(ptr + 5);
    // module, import, effect
    return (c0 == 109 && c1 == 111 && c2 == 100 && c3 == 117 && c4 == 108 && c5 == 101) || // module
           (c0 == 105 && c1 == 109 && c2 == 112 && c3 == 111 && c4 == 114 && c5 == 116) || // import
           (c0 == 101 && c1 == 102 && c2 == 102 && c3 == 101 && c4 == 99 && c5 == 116); // effect
  } else if (len == 7) {
    const c0 = load<u8>(ptr);
    const c1 = load<u8>(ptr + 1);
    const c2 = load<u8>(ptr + 2);
    const c3 = load<u8>(ptr + 3);
    const c4 = load<u8>(ptr + 4);
    const c5 = load<u8>(ptr + 5);
    const c6 = load<u8>(ptr + 6);
    // command
    return (c0 == 99 && c1 == 111 && c2 == 109 && c3 == 109 && c4 == 97 && c5 == 110 && c6 == 100); // command
  } else if (len == 8) {
    const c0 = load<u8>(ptr);
    const c1 = load<u8>(ptr + 1);
    const c2 = load<u8>(ptr + 2);
    const c3 = load<u8>(ptr + 3);
    const c4 = load<u8>(ptr + 4);
    const c5 = load<u8>(ptr + 5);
    const c6 = load<u8>(ptr + 6);
    const c7 = load<u8>(ptr + 7);
    // exposing
    return (c0 == 101 && c1 == 120 && c2 == 112 && c3 == 111 && c4 == 115 && c5 == 105 && c6 == 110 && c7 == 103); // exposing
  } else if (len == 12) {
    // subscription
    const c0 = load<u8>(ptr);
    const c1 = load<u8>(ptr + 1);
    const c2 = load<u8>(ptr + 2);
    return (c0 == 115 && c1 == 117 && c2 == 98); // starts with "sub"
  }
  return false;
}

/**
 * Tokenize a complete source file
 * Returns the number of tokens generated
 * Tokens are stored in the token buffer
 */
export function tokenizeSource(ptr: i32, len: i32): i32 {
  // Clear token buffer
  tokens = [];
  
  let pos: i32 = 0;
  let line: i32 = 1;
  let col: i32 = 1;
  
  while (pos < len) {
    const start = pos;
    const startLine = line;
    const startCol = col;
    const char = load<u8>(ptr + pos);
    
    // Whitespace
    if (isSpace(char)) {
      pos++;
      col++;
      const tok = new Token();
      tok.type = TokenType.SPACE;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Newline
    if (isNewline(char)) {
      pos++;
      line++;
      col = 1;
      const tok = new Token();
      tok.type = TokenType.NEWLINE;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Line comment (--)
    if (char == 45 && pos + 1 < len && load<u8>(ptr + pos + 1) == 45) {
      pos += 2;
      col += 2;
      while (pos < len && !isNewline(load<u8>(ptr + pos))) {
        pos++;
        col++;
      }
      const tok = new Token();
      tok.type = TokenType.LINE_COMMENT;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Block comment ({-)
    if (char == 123 && pos + 1 < len && load<u8>(ptr + pos + 1) == 45) {
      pos += 2;
      col += 2;
      let depth = 1;
      
      while (pos < len && depth > 0) {
        const c = load<u8>(ptr + pos);
        if (c == 123 && pos + 1 < len && load<u8>(ptr + pos + 1) == 45) {
          depth++;
          pos += 2;
          col += 2;
        } else if (c == 45 && pos + 1 < len && load<u8>(ptr + pos + 1) == 125) {
          depth--;
          pos += 2;
          col += 2;
        } else {
          if (isNewline(c)) {
            line++;
            col = 1;
          } else {
            col++;
          }
          pos++;
        }
      }
      
      const tok = new Token();
      tok.type = TokenType.BLOCK_COMMENT;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Numbers
    if (isDigit(char)) {
      pos++;
      col++;
      let isFloat = false;
      
      while (pos < len) {
        const c = load<u8>(ptr + pos);
        if (isDigit(c) || c == 95) { // Allow underscores in numbers (Guida feature)
          pos++;
          col++;
        } else if (c == 46 && !isFloat && pos + 1 < len && isDigit(load<u8>(ptr + pos + 1))) {
          isFloat = true;
          pos++;
          col++;
        } else {
          break;
        }
      }
      
      const tok = new Token();
      tok.type = isFloat ? TokenType.FLOAT : TokenType.INT;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Lowercase identifiers (and keywords)
    if (isLowerStart(char)) {
      pos++;
      col++;
      
      while (pos < len && isIdentChar(load<u8>(ptr + pos))) {
        pos++;
        col++;
      }
      
      const identLen = pos - start;
      const isKw = isKeyword(ptr + start, identLen);
      const tok = new Token();
      tok.type = isKw ? TokenType.KEYWORD : TokenType.LOWER_IDENT;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Uppercase identifiers
    if (isUpperStart(char)) {
      pos++;
      col++;
      
      while (pos < len && isIdentChar(load<u8>(ptr + pos))) {
        pos++;
        col++;
      }
      
      const tok = new Token();
      tok.type = TokenType.UPPER_IDENT;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // String literals
    if (char == 34) { // "
      pos++;
      col++;
      let escaped = false;
      
      while (pos < len) {
        const c = load<u8>(ptr + pos);
        if (escaped) {
          escaped = false;
        } else if (c == 92) { // backslash
          escaped = true;
        } else if (c == 34) { // closing quote
          pos++;
          col++;
          break;
        } else if (isNewline(c)) {
          line++;
          col = 1;
        } else {
          col++;
        }
        pos++;
      }
      
      const tok = new Token();
      tok.type = TokenType.STRING;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Character literals
    if (char == 39) { // '
      pos++;
      col++;
      
      if (pos < len) {
        const c = load<u8>(ptr + pos);
        if (c == 92 && pos + 1 < len) { // Escaped character
          pos += 2;
          col += 2;
        } else {
          pos++;
          col++;
        }
      }
      
      if (pos < len && load<u8>(ptr + pos) == 39) {
        pos++;
        col++;
      }
      
      const tok = new Token();
      tok.type = TokenType.CHAR;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Special single-character tokens
    if (char == 40) { // (
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.LEFT_PAREN;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    if (char == 41) { // )
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.RIGHT_PAREN;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    if (char == 123) { // {
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.LEFT_BRACE;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    if (char == 125) { // }
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.RIGHT_BRACE;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    if (char == 91) { // [
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.LEFT_BRACKET;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    if (char == 93) { // ]
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.RIGHT_BRACKET;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    if (char == 44) { // ,
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.COMMA;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    if (char == 95) { // _
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.UNDERSCORE;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    if (char == 92) { // backslash
      pos++; col++;
      const tok = new Token();
      tok.type = TokenType.BACKSLASH;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Multi-character operators
    if (char == 45 && pos + 1 < len && load<u8>(ptr + pos + 1) == 62) { // ->
      pos += 2; col += 2;
      const tok = new Token();
      tok.type = TokenType.ARROW;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Operators (including special ones)
    if (isOperatorChar(char)) {
      // Check for special single-char operators
      if (char == 61) { // =
        pos++; col++;
        const tok = new Token();
        tok.type = TokenType.EQUALS;
        tok.start = start;
        tok.end = pos;
        tok.line = startLine;
        tok.col = startCol;
      tokens.push(tok);
      continue;
      }
      if (char == 124) { // |
        pos++; col++;
        const tok = new Token();
        tok.type = TokenType.PIPE;
        tok.start = start;
        tok.end = pos;
        tok.line = startLine;
        tok.col = startCol;
      tokens.push(tok);
      continue;
      }
      if (char == 58) { // :
        pos++; col++;
        const tok = new Token();
        tok.type = TokenType.COLON;
        tok.start = start;
        tok.end = pos;
        tok.line = startLine;
        tok.col = startCol;
      tokens.push(tok);
      continue;
      }
      if (char == 46) { // .
        pos++; col++;
        const tok = new Token();
        tok.type = TokenType.DOT;
        tok.start = start;
        tok.end = pos;
        tok.line = startLine;
        tok.col = startCol;
      tokens.push(tok);
      continue;
      }
      
      // General operator
      pos++;
      col++;
      while (pos < len && isOperatorChar(load<u8>(ptr + pos))) {
        pos++;
        col++;
      }
      const tok = new Token();
      tok.type = TokenType.OPERATOR;
      tok.start = start;
      tok.end = pos;
      tok.line = startLine;
      tok.col = startCol;
      tokens.push(tok);
      continue;
    }
    
    // Unknown character - error token
    pos++;
    col++;
    const tok = new Token();
    tok.type = TokenType.ERROR;
    tok.start = start;
    tok.end = pos;
    tok.line = startLine;
    tok.col = startCol;
  }
  
  // Add EOF token
  const eofTok = new Token();
  eofTok.type = TokenType.EOF;
  eofTok.start = pos;
  eofTok.end = pos;
  eofTok.line = line;
  eofTok.col = col;
  tokens.push(eofTok);
  
  return tokens.length;
}

/**
 * Get token information at index
 * Returns a packed i64 with: type (8 bits) | start (16 bits) | end (16 bits) | line (12 bits) | col (12 bits)
 */
export function getToken(index: i32): i64 {
  if (index < 0 || index >= tokens.length) {
    return 0;
  }
  
  const token = tokens[index];
  
  // Pack into i64: [type:8][start:16][end:16][line:12][col:12]
  let result: i64 = 0;
  result |= i64(token.type) << 56;
  result |= (i64(token.start) & 0xFFFF) << 40;
  result |= (i64(token.end) & 0xFFFF) << 24;
  result |= (i64(token.line) & 0xFFF) << 12;
  result |= (i64(token.col) & 0xFFF);
  
  return result;
}

/**
 * Get the text of a token
 * Returns the length of the copied text
 */
export function getTokenText(sourcePtr: i32, tokenIndex: i32, outputPtr: i32): i32 {
  if (tokenIndex < 0 || tokenIndex >= tokens.length) {
    return 0;
  }
  
  const token = tokens[tokenIndex];
  const len = token.end - token.start;
  
  // Copy token text to output buffer
  for (let i: i32 = 0; i < len; i++) {
    store<u8>(outputPtr + i, load<u8>(sourcePtr + token.start + i));
  }
  
  return len;
}
