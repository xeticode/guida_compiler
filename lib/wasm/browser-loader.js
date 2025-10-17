/**
 * Browser WASM Loader
 * Progressive enhancement for browser environments
 */

let wasmModule = null;
let loadPromise = null;

export async function loadWasm() {
  if (wasmModule) {
    return wasmModule;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      const response = await fetch(new URL('./guida-core.wasm', import.meta.url));
      const buffer = await response.arrayBuffer();
      
      const imports = {
        env: {
          abort: (msg, file, line, column) => {
            console.error(`WASM abort: ${msg} at ${file}:${line}:${column}`);
          },
          trace: (msg) => {
            if (window.DEBUG_WASM) {
              console.log(`WASM: ${msg}`);
            }
          }
        }
      };

      const compiled = await WebAssembly.instantiate(buffer, imports);
      wasmModule = compiled.instance.exports;
      
      console.log('✓ WASM module loaded in browser');
      return wasmModule;
    } catch (error) {
      console.warn('WASM failed to load, using JS fallback:', error.message);
      return null;
    }
  })();

  return loadPromise;
}

export const isSupported = typeof WebAssembly !== 'undefined';
