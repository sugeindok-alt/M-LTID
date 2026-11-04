// Match Next's server-only alias for standalone Node maintenance scripts.
import { registerHooks } from 'node:module';
const empty = import.meta.resolve('next/dist/compiled/server-only/empty.js');
registerHooks({
  resolve(specifier, context, next) {
    return specifier === 'server-only'
      ? { url: empty, shortCircuit: true }
      : next(specifier, context);
  },
});
