// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/**/*.ts',        // <-- compile the library
        'examples/server/server.ts' // <-- compile the demo server
    ],
    outDir: 'dist',
    format: ['cjs'],
    target: 'node18',
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: false // no need for .d.ts files for example code
});
