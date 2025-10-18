/**
 * Guida Compiler - Core String & Array Operations (WASM)
 * 
 * High-performance implementations of frequently used string and array operations
 * that appear in the compiler runtime.
 */

// ============================================================
// STRING OPERATIONS
// ============================================================

/**
 * String map - applies a function code to each character
 * Returns the length of the result string written to outputPtr
 */
export function stringMap(inputPtr: i32, inputLen: i32, outputPtr: i32, transformCode: i32): i32 {
  let outputLen: i32 = 0;
  let i: i32 = 0;
  
  while (i < inputLen) {
    const word = load<u16>(inputPtr + i);
    
    // Handle surrogate pairs (0xD800-0xDBFF is high surrogate)
    if (word >= 0xD800 && word <= 0xDBFF && i + 2 < inputLen) {
      // Copy surrogate pair as-is (transform applies to whole char)
      store<u16>(outputPtr + outputLen, word);
      store<u16>(outputPtr + outputLen + 2, load<u16>(inputPtr + i + 2));
      i += 4;
      outputLen += 4;
    } else {
      // Transform single character based on code
      let transformed = word;
      
      // transformCode: 1=toUpper, 2=toLower, 0=identity
      if (transformCode == 1) { // toUpper
        if (word >= 97 && word <= 122) { // a-z
          transformed = word - 32;
        }
      } else if (transformCode == 2) { // toLower
        if (word >= 65 && word <= 90) { // A-Z
          transformed = word + 32;
        }
      }
      
      store<u16>(outputPtr + outputLen, transformed);
      i += 2;
      outputLen += 2;
    }
  }
  
  return outputLen / 2; // Return character count, not byte count
}

/**
 * String filter - keeps only characters that match condition
 */
export function stringFilter(inputPtr: i32, inputLen: i32, outputPtr: i32, filterCode: i32): i32 {
  let outputLen: i32 = 0;
  let i: i32 = 0;
  
  while (i < inputLen) {
    const word = load<u16>(inputPtr + i);
    let keep = false;
    
    // Handle surrogate pairs
    if (word >= 0xD800 && word <= 0xDBFF && i + 2 < inputLen) {
      const low = load<u16>(inputPtr + i + 2);
      // Keep surrogate pairs based on filter (simplified: keep all for now)
      keep = true;
      if (keep) {
        store<u16>(outputPtr + outputLen, word);
        store<u16>(outputPtr + outputLen + 2, low);
        outputLen += 4;
      }
      i += 4;
    } else {
      // filterCode: 1=isAlpha, 2=isDigit, 3=isAlphaNum, 0=all
      if (filterCode == 0) {
        keep = true;
      } else if (filterCode == 1) { // isAlpha
        keep = (word >= 65 && word <= 90) || (word >= 97 && word <= 122);
      } else if (filterCode == 2) { // isDigit
        keep = (word >= 48 && word <= 57);
      } else if (filterCode == 3) { // isAlphaNum
        keep = (word >= 48 && word <= 57) || (word >= 65 && word <= 90) || (word >= 97 && word <= 122);
      }
      
      if (keep) {
        store<u16>(outputPtr + outputLen, word);
        outputLen += 2;
      }
      i += 2;
    }
  }
  
  return outputLen / 2;
}

/**
 * String reverse - reverses character order handling surrogate pairs
 */
export function stringReverse(inputPtr: i32, inputLen: i32, outputPtr: i32): i32 {
  let writePos: i32 = 0;
  let i: i32 = inputLen - 2; // Start from last character (2 bytes per char)
  
  while (i >= 0) {
    const word = load<u16>(inputPtr + i);
    
    // Check if this is a low surrogate (we're reading backwards)
    if (word >= 0xDC00 && word <= 0xDFFF && i >= 2) {
      const high = load<u16>(inputPtr + i - 2);
      if (high >= 0xD800 && high <= 0xDBFF) {
        // Write surrogate pair in correct order
        store<u16>(outputPtr + writePos, high);
        store<u16>(outputPtr + writePos + 2, word);
        writePos += 4;
        i -= 4;
        continue;
      }
    }
    
    store<u16>(outputPtr + writePos, word);
    writePos += 2;
    i -= 2;
  }
  
  return writePos / 2;
}

/**
 * String indexOf - finds first occurrence of substring
 * Returns index or -1 if not found
 */
export function stringIndexOf(haystackPtr: i32, haystackLen: i32, needlePtr: i32, needleLen: i32, fromIndex: i32): i32 {
  if (needleLen == 0) return fromIndex;
  if (needleLen > haystackLen) return -1;
  if (fromIndex >= haystackLen) return -1;
  
  const maxStart = haystackLen - needleLen;
  const firstNeedleChar = load<u16>(needlePtr);
  
  for (let i: i32 = fromIndex; i <= maxStart; i++) {
    // Quick check first character
    if (load<u16>(haystackPtr + i * 2) != firstNeedleChar) {
      continue;
    }
    
    // Check full substring
    let match = true;
    for (let j: i32 = 1; j < needleLen; j++) {
      if (load<u16>(haystackPtr + (i + j) * 2) != load<u16>(needlePtr + j * 2)) {
        match = false;
        break;
      }
    }
    
    if (match) {
      return i;
    }
  }
  
  return -1;
}

/**
 * String toInt - parses integer from string
 * Returns the parsed integer, or sets error flag in result
 */
export function stringToInt(ptr: i32, len: i32): i64 {
  if (len == 0) {
    return i64(-1) << 32; // Error flag in high 32 bits
  }
  
  let result: i64 = 0;
  let negative = false;
  let start: i32 = 0;
  
  // Check for sign
  const firstChar = load<u16>(ptr);
  if (firstChar == 43) { // '+'
    start = 1;
  } else if (firstChar == 45) { // '-'
    negative = true;
    start = 1;
  }
  
  if (start >= len) {
    return i64(-1) << 32; // Error
  }
  
  // Parse digits
  for (let i = start; i < len; i++) {
    const char = load<u16>(ptr + i * 2);
    if (char < 48 || char > 57) { // Not 0-9
      return i64(-1) << 32; // Error
    }
    result = result * 10 + i64(char - 48);
  }
  
  if (negative) {
    result = -result;
  }
  
  // Success: low 32 bits = value, high 32 bits = 0
  return result & i64(0xFFFFFFFF);
}

// ============================================================
// ARRAY OPERATIONS
// ============================================================

/**
 * Array map - applies transformation to each element
 * Elements are i32 values (references in JS)
 * Returns new array length
 */
export function arrayMap(inputPtr: i32, len: i32, outputPtr: i32, transformType: i32): i32 {
  for (let i: i32 = 0; i < len; i++) {
    const value = load<i32>(inputPtr + i * 4);
    
    // transformType: 0=copy, 1=increment, 2=double
    let transformed = value;
    if (transformType == 1) {
      transformed = value + 1;
    } else if (transformType == 2) {
      transformed = value * 2;
    }
    
    store<i32>(outputPtr + i * 4, transformed);
  }
  
  return len;
}

/**
 * Array foldl - left fold operation
 * Returns accumulated value
 */
export function arrayFoldl(arrayPtr: i32, len: i32, initial: i32, foldOp: i32): i32 {
  let acc = initial;
  
  for (let i: i32 = 0; i < len; i++) {
    const value = load<i32>(arrayPtr + i * 4);
    
    // foldOp: 0=sum, 1=product, 2=max, 3=min, 4=count
    if (foldOp == 0) { // sum
      acc += value;
    } else if (foldOp == 1) { // product
      acc *= value;
    } else if (foldOp == 2) { // max
      if (value > acc) acc = value;
    } else if (foldOp == 3) { // min
      if (value < acc) acc = value;
    } else if (foldOp == 4) { // count
      acc++;
    }
  }
  
  return acc;
}

/**
 * Array copy with slice
 */
export function arraySlice(inputPtr: i32, start: i32, end: i32, outputPtr: i32): i32 {
  const len = end - start;
  if (len <= 0) return 0;
  
  // Copy i32 values
  for (let i: i32 = 0; i < len; i++) {
    store<i32>(outputPtr + i * 4, load<i32>(inputPtr + (start + i) * 4));
  }
  
  return len;
}

/**
 * Array append - concatenate two arrays
 */
export function arrayAppend(arr1Ptr: i32, len1: i32, arr2Ptr: i32, len2: i32, outputPtr: i32): i32 {
  // Copy first array
  for (let i: i32 = 0; i < len1; i++) {
    store<i32>(outputPtr + i * 4, load<i32>(arr1Ptr + i * 4));
  }
  
  // Copy second array
  for (let i: i32 = 0; i < len2; i++) {
    store<i32>(outputPtr + (len1 + i) * 4, load<i32>(arr2Ptr + i * 4));
  }
  
  return len1 + len2;
}

/**
 * Array initialize - creates array with function-generated values
 */
export function arrayInitialize(len: i32, offset: i32, outputPtr: i32, initType: i32): i32 {
  for (let i: i32 = 0; i < len; i++) {
    let value: i32;
    
    // initType: 0=index, 1=offset+index, 2=constant zero
    if (initType == 0) {
      value = i;
    } else if (initType == 1) {
      value = offset + i;
    } else {
      value = 0;
    }
    
    store<i32>(outputPtr + i * 4, value);
  }
  
  return len;
}

// ============================================================
// COMPARISON OPERATIONS
// ============================================================

/**
 * Deep equality check for arrays of i32
 */
export function arrayEquals(ptr1: i32, len1: i32, ptr2: i32, len2: i32): bool {
  if (len1 != len2) return false;
  
  for (let i: i32 = 0; i < len1; i++) {
    if (load<i32>(ptr1 + i * 4) != load<i32>(ptr2 + i * 4)) {
      return false;
    }
  }
  
  return true;
}

/**
 * String equality check
 */
export function stringEquals(ptr1: i32, len1: i32, ptr2: i32, len2: i32): bool {
  if (len1 != len2) return false;
  
  for (let i: i32 = 0; i < len1; i++) {
    if (load<u16>(ptr1 + i * 2) != load<u16>(ptr2 + i * 2)) {
      return false;
    }
  }
  
  return true;
}

/**
 * String comparison (for sorting)
 * Returns: -1 if str1 < str2, 0 if equal, 1 if str1 > str2
 */
export function stringCompare(ptr1: i32, len1: i32, ptr2: i32, len2: i32): i32 {
  const minLen = len1 < len2 ? len1 : len2;
  
  for (let i: i32 = 0; i < minLen; i++) {
    const char1 = load<u16>(ptr1 + i * 2);
    const char2 = load<u16>(ptr2 + i * 2);
    
    if (char1 < char2) return -1;
    if (char1 > char2) return 1;
  }
  
  if (len1 < len2) return -1;
  if (len1 > len2) return 1;
  return 0;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Memory copy - fast memcpy implementation
 */
export function memoryCopy(srcPtr: i32, dstPtr: i32, len: i32): void {
  // Use bulk memory operations if available, otherwise copy in chunks
  for (let i: i32 = 0; i < len; i += 16) {
    if (i + 16 <= len) {
      // Copy 16 bytes at once
      store<i64>(dstPtr + i, load<i64>(srcPtr + i));
      store<i64>(dstPtr + i + 8, load<i64>(srcPtr + i + 8));
    } else {
      // Copy remaining bytes
      for (let j: i32 = i; j < len; j++) {
        store<u8>(dstPtr + j, load<u8>(srcPtr + j));
      }
      break;
    }
  }
}

/**
 * Memory set - fast memset implementation
 */
export function memorySet(ptr: i32, value: u8, len: i32): void {
  // Create pattern for larger writes
  const pattern64 = 
    i64(value) |
    (i64(value) << 8) |
    (i64(value) << 16) |
    (i64(value) << 24) |
    (i64(value) << 32) |
    (i64(value) << 40) |
    (i64(value) << 48) |
    (i64(value) << 56);
  
  let i: i32 = 0;
  
  // Write 8 bytes at a time
  while (i + 8 <= len) {
    store<i64>(ptr + i, pattern64);
    i += 8;
  }
  
  // Write remaining bytes
  while (i < len) {
    store<u8>(ptr + i, value);
    i++;
  }
}
