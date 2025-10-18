/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/index/allocate
 * @param size `i32`
 * @returns `i32`
 */
export declare function allocate(size: number): number;
/**
 * assembly/index/deallocate
 * @param ptr `i32`
 */
export declare function deallocate(ptr: number): void;
/**
 * assembly/index/hashString
 * @param ptr `i32`
 * @param len `i32`
 * @returns `u32`
 */
export declare function hashString(ptr: number, len: number): number;
/**
 * assembly/index/patternComplexity
 * @param ptr `i32`
 * @param len `i32`
 * @returns `i32`
 */
export declare function patternComplexity(ptr: number, len: number): number;
/**
 * assembly/index/countChar
 * @param ptr `i32`
 * @param len `i32`
 * @param target `u8`
 * @returns `i32`
 */
export declare function countChar(ptr: number, len: number, target: number): number;
/**
 * assembly/index/parseInt32
 * @param ptr `i32`
 * @param len `i32`
 * @returns `i32`
 */
export declare function parseInt32(ptr: number, len: number): number;
/**
 * assembly/index/getResultLength
 * @returns `i32`
 */
export declare function getResultLength(): number;
/**
 * assembly/index/setResultLength
 * @param len `i32`
 */
export declare function setResultLength(len: number): void;
/** assembly/index/TokenType */
export declare enum TokenType {
  /** @type `i32` */
  EOF,
  /** @type `i32` */
  SPACE,
  /** @type `i32` */
  NEWLINE,
  /** @type `i32` */
  LINE_COMMENT,
  /** @type `i32` */
  BLOCK_COMMENT,
  /** @type `i32` */
  KEYWORD,
  /** @type `i32` */
  LOWER_IDENT,
  /** @type `i32` */
  UPPER_IDENT,
  /** @type `i32` */
  INT,
  /** @type `i32` */
  FLOAT,
  /** @type `i32` */
  STRING,
  /** @type `i32` */
  CHAR,
  /** @type `i32` */
  OPERATOR,
  /** @type `i32` */
  LEFT_PAREN,
  /** @type `i32` */
  RIGHT_PAREN,
  /** @type `i32` */
  LEFT_BRACE,
  /** @type `i32` */
  RIGHT_BRACE,
  /** @type `i32` */
  LEFT_BRACKET,
  /** @type `i32` */
  RIGHT_BRACKET,
  /** @type `i32` */
  COMMA,
  /** @type `i32` */
  DOT,
  /** @type `i32` */
  EQUALS,
  /** @type `i32` */
  PIPE,
  /** @type `i32` */
  ARROW,
  /** @type `i32` */
  COLON,
  /** @type `i32` */
  BACKSLASH,
  /** @type `i32` */
  UNDERSCORE,
  /** @type `i32` */
  ERROR,
}
/**
 * assembly/index/tokenizeSource
 * @param ptr `i32`
 * @param len `i32`
 * @returns `i32`
 */
export declare function tokenizeSource(ptr: number, len: number): number;
/**
 * assembly/index/getToken
 * @param index `i32`
 * @returns `i64`
 */
export declare function getToken(index: number): bigint;
/**
 * assembly/index/getTokenText
 * @param sourcePtr `i32`
 * @param tokenIndex `i32`
 * @param outputPtr `i32`
 * @returns `i32`
 */
export declare function getTokenText(sourcePtr: number, tokenIndex: number, outputPtr: number): number;
