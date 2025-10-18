/**
 * Pure JavaScript Lexer Fallback
 *
 * This module provides a JavaScript implementation of the tokenizer
 * for environments where WASM is not available or fails to load.
 */

// Token types (match WASM enum values)
const TokenType = {
  EOF: 0,
  // Whitespace and comments
  SPACE: 1,
  NEWLINE: 2,
  LINE_COMMENT: 3,
  BLOCK_COMMENT: 4,
  // Keywords
  KEYWORD: 10,
  // Identifiers
  LOWER_IDENT: 20,
  UPPER_IDENT: 21,
  // Literals
  INT: 30,
  FLOAT: 31,
  STRING: 32,
  CHAR: 33,
  // Operators and symbols
  OPERATOR: 40,
  LEFT_PAREN: 41,
  RIGHT_PAREN: 42,
  LEFT_BRACE: 43,
  RIGHT_BRACE: 44,
  LEFT_BRACKET: 45,
  RIGHT_BRACKET: 46,
  COMMA: 47,
  DOT: 48,
  EQUALS: 49,
  PIPE: 50,
  ARROW: 51,
  COLON: 52,
  BACKSLASH: 53,
  UNDERSCORE: 54,
  // Error
  ERROR: 99,
};

// Keywords set for fast lookup
const KEYWORDS = new Set([
  "if",
  "then",
  "else",
  "case",
  "of",
  "let",
  "in",
  "type",
  "alias",
  "port",
  "module",
  "import",
  "exposing",
  "as",
  "where",
  "effect",
  "command",
  "subscription",
  "infix",
  "left",
  "right",
  "non",
]);

/**
 * Check if string is whitespace (space, tab, carriage return)
 */
function isSpace(char) {
  return char === " " || char === "\t" || char === "\r";
}

/**
 * Check if string is newline
 */
function isNewline(char) {
  return char === "\n";
}

/**
 * Check if character is a digit
 */
function isDigit(char) {
  const code = char.charCodeAt(0);
  return code >= 48 && code <= 57; // 0-9
}

/**
 * Check if character starts a lowercase identifier
 */
function isLowerStart(char) {
  const code = char.charCodeAt(0);
  return code >= 97 && code <= 122; // a-z
}

/**
 * Check if character starts an uppercase identifier
 */
function isUpperStart(char) {
  const code = char.charCodeAt(0);
  return code >= 65 && code <= 90; // A-Z
}

/**
 * Check if character can be part of an identifier
 */
function isIdentChar(char) {
  const code = char.charCodeAt(0);
  return (
    (code >= 97 && code <= 122) || // a-z
    (code >= 65 && code <= 90) || // A-Z
    (code >= 48 && code <= 57) || // 0-9
    char === "_"
  );
}

/**
 * Check if character can be part of an operator
 */
function isOperatorChar(char) {
  return "+-/*=.<>:&|^?%!".includes(char);
}

/**
 * Tokenize source code
 * Returns an array of tokens
 */
function tokenizeSource(source) {
  const tokens = [];
  const len = source.length;
  let pos = 0;
  let line = 1;
  let col = 1;

  while (pos < len) {
    const start = pos;
    const startLine = line;
    const startCol = col;
    const char = source[pos];

    // Whitespace
    if (isSpace(char)) {
      pos++;
      col++;
      tokens.push({
        type: TokenType.SPACE,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Newline
    if (isNewline(char)) {
      pos++;
      line++;
      col = 1;
      tokens.push({
        type: TokenType.NEWLINE,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Line comment (--)
    if (char === "-" && pos + 1 < len && source[pos + 1] === "-") {
      pos += 2;
      col += 2;
      while (pos < len && !isNewline(source[pos])) {
        pos++;
        col++;
      }
      tokens.push({
        type: TokenType.LINE_COMMENT,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Block comment ({-)
    if (char === "{" && pos + 1 < len && source[pos + 1] === "-") {
      pos += 2;
      col += 2;
      let depth = 1;

      while (pos < len && depth > 0) {
        const c = source[pos];
        if (c === "{" && pos + 1 < len && source[pos + 1] === "-") {
          depth++;
          pos += 2;
          col += 2;
        } else if (c === "-" && pos + 1 < len && source[pos + 1] === "}") {
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

      tokens.push({
        type: TokenType.BLOCK_COMMENT,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Numbers
    if (isDigit(char)) {
      pos++;
      col++;
      let isFloat = false;

      while (pos < len) {
        const c = source[pos];
        if (isDigit(c) || c === "_") {
          // Allow underscores (Guida feature)
          pos++;
          col++;
        } else if (
          c === "." &&
          !isFloat &&
          pos + 1 < len &&
          isDigit(source[pos + 1])
        ) {
          isFloat = true;
          pos++;
          col++;
        } else {
          break;
        }
      }

      tokens.push({
        type: isFloat ? TokenType.FLOAT : TokenType.INT,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Lowercase identifiers (and keywords)
    if (isLowerStart(char)) {
      pos++;
      col++;

      while (pos < len && isIdentChar(source[pos])) {
        pos++;
        col++;
      }

      const text = source.slice(start, pos);
      const type = KEYWORDS.has(text)
        ? TokenType.KEYWORD
        : TokenType.LOWER_IDENT;
      tokens.push({ type, start, end: pos, line: startLine, col: startCol });
      continue;
    }

    // Uppercase identifiers
    if (isUpperStart(char)) {
      pos++;
      col++;

      while (pos < len && isIdentChar(source[pos])) {
        pos++;
        col++;
      }

      tokens.push({
        type: TokenType.UPPER_IDENT,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // String literals
    if (char === '"') {
      pos++;
      col++;
      let escaped = false;

      while (pos < len) {
        const c = source[pos];
        if (escaped) {
          escaped = false;
        } else if (c === "\\") {
          escaped = true;
        } else if (c === '"') {
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

      tokens.push({
        type: TokenType.STRING,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Character literals
    if (char === "'") {
      pos++;
      col++;

      if (pos < len) {
        const c = source[pos];
        if (c === "\\" && pos + 1 < len) {
          pos += 2;
          col += 2;
        } else {
          pos++;
          col++;
        }
      }

      if (pos < len && source[pos] === "'") {
        pos++;
        col++;
      }

      tokens.push({
        type: TokenType.CHAR,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Special single-character tokens
    const singleCharTokens = {
      "(": TokenType.LEFT_PAREN,
      ")": TokenType.RIGHT_PAREN,
      "{": TokenType.LEFT_BRACE,
      "}": TokenType.RIGHT_BRACE,
      "[": TokenType.LEFT_BRACKET,
      "]": TokenType.RIGHT_BRACKET,
      ",": TokenType.COMMA,
      _: TokenType.UNDERSCORE,
      "\\": TokenType.BACKSLASH,
    };

    if (char in singleCharTokens) {
      pos++;
      col++;
      tokens.push({
        type: singleCharTokens[char],
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Multi-character operators
    if (char === "-" && pos + 1 < len && source[pos + 1] === ">") {
      pos += 2;
      col += 2;
      tokens.push({
        type: TokenType.ARROW,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Special single-char operators
    if (isOperatorChar(char)) {
      const specialOps = {
        "=": TokenType.EQUALS,
        "|": TokenType.PIPE,
        ":": TokenType.COLON,
        ".": TokenType.DOT,
      };

      if (char in specialOps) {
        pos++;
        col++;
        tokens.push({
          type: specialOps[char],
          start,
          end: pos,
          line: startLine,
          col: startCol,
        });
        continue;
      }

      // General operator
      pos++;
      col++;
      while (pos < len && isOperatorChar(source[pos])) {
        pos++;
        col++;
      }
      tokens.push({
        type: TokenType.OPERATOR,
        start,
        end: pos,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Unknown character - error token
    pos++;
    col++;
    tokens.push({
      type: TokenType.ERROR,
      start,
      end: pos,
      line: startLine,
      col: startCol,
    });
  }

  // Add EOF token
  tokens.push({ type: TokenType.EOF, start: pos, end: pos, line, col });

  return tokens;
}

/**
 * Get token text from source
 */
function getTokenText(source, token) {
  return source.slice(token.start, token.end);
}

module.exports = {
  TokenType,
  tokenizeSource,
  getTokenText,
  KEYWORDS,
};
