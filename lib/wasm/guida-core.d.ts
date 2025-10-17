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
