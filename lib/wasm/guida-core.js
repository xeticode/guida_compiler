async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    hashString(ptr, len) {
      // assembly/index/hashString(i32, i32) => u32
      return exports.hashString(ptr, len) >>> 0;
    },
    TokenType: (values => (
      // assembly/index/TokenType
      values[values.EOF = exports["TokenType.EOF"].valueOf()] = "EOF",
      values[values.SPACE = exports["TokenType.SPACE"].valueOf()] = "SPACE",
      values[values.NEWLINE = exports["TokenType.NEWLINE"].valueOf()] = "NEWLINE",
      values[values.LINE_COMMENT = exports["TokenType.LINE_COMMENT"].valueOf()] = "LINE_COMMENT",
      values[values.BLOCK_COMMENT = exports["TokenType.BLOCK_COMMENT"].valueOf()] = "BLOCK_COMMENT",
      values[values.KEYWORD = exports["TokenType.KEYWORD"].valueOf()] = "KEYWORD",
      values[values.LOWER_IDENT = exports["TokenType.LOWER_IDENT"].valueOf()] = "LOWER_IDENT",
      values[values.UPPER_IDENT = exports["TokenType.UPPER_IDENT"].valueOf()] = "UPPER_IDENT",
      values[values.INT = exports["TokenType.INT"].valueOf()] = "INT",
      values[values.FLOAT = exports["TokenType.FLOAT"].valueOf()] = "FLOAT",
      values[values.STRING = exports["TokenType.STRING"].valueOf()] = "STRING",
      values[values.CHAR = exports["TokenType.CHAR"].valueOf()] = "CHAR",
      values[values.OPERATOR = exports["TokenType.OPERATOR"].valueOf()] = "OPERATOR",
      values[values.LEFT_PAREN = exports["TokenType.LEFT_PAREN"].valueOf()] = "LEFT_PAREN",
      values[values.RIGHT_PAREN = exports["TokenType.RIGHT_PAREN"].valueOf()] = "RIGHT_PAREN",
      values[values.LEFT_BRACE = exports["TokenType.LEFT_BRACE"].valueOf()] = "LEFT_BRACE",
      values[values.RIGHT_BRACE = exports["TokenType.RIGHT_BRACE"].valueOf()] = "RIGHT_BRACE",
      values[values.LEFT_BRACKET = exports["TokenType.LEFT_BRACKET"].valueOf()] = "LEFT_BRACKET",
      values[values.RIGHT_BRACKET = exports["TokenType.RIGHT_BRACKET"].valueOf()] = "RIGHT_BRACKET",
      values[values.COMMA = exports["TokenType.COMMA"].valueOf()] = "COMMA",
      values[values.DOT = exports["TokenType.DOT"].valueOf()] = "DOT",
      values[values.EQUALS = exports["TokenType.EQUALS"].valueOf()] = "EQUALS",
      values[values.PIPE = exports["TokenType.PIPE"].valueOf()] = "PIPE",
      values[values.ARROW = exports["TokenType.ARROW"].valueOf()] = "ARROW",
      values[values.COLON = exports["TokenType.COLON"].valueOf()] = "COLON",
      values[values.BACKSLASH = exports["TokenType.BACKSLASH"].valueOf()] = "BACKSLASH",
      values[values.UNDERSCORE = exports["TokenType.UNDERSCORE"].valueOf()] = "UNDERSCORE",
      values[values.ERROR = exports["TokenType.ERROR"].valueOf()] = "ERROR",
      values
    ))({}),
  }, exports);
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  return adaptedExports;
}
export const {
  memory,
  allocate,
  deallocate,
  hashString,
  patternComplexity,
  countChar,
  parseInt32,
  getResultLength,
  setResultLength,
  TokenType,
  tokenizeSource,
  getToken,
  getTokenText,
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("guida-core.wasm", import.meta.url));
