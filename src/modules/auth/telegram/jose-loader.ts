// Keep native import in this CommonJS TypeScript project (jose v6 is ESM).
// The module specifier is a constant, never request/configuration input.
export const loadJose = new Function('return import("jose")') as () => Promise<
  typeof import('jose')
>;
