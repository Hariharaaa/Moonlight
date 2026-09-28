/**
 * Utility to strictly convert inputs into exactly 32-byte Uint8Array objects.
 * This resolves edge cases where Polyfilled Buffers or ArrayBuffers
 * cause Compact Runtime serialization errors in the Midnight JS SDK.
 */
export const toPureBytes = (input: any): Uint8Array => {
  const arr = new Uint8Array(32);
  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    const bytes = new Uint8Array(input);
    arr.set(bytes.slice(0, 32));
  }
  return arr;
};
