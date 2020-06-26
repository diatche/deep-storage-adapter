import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
        },
        {
            file: pkg.module,
            format: 'es',
        },
        {
            name: 'deep-storage-adapter',
            file: pkg.browser,
            format: 'umd',
        },
    ],
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
        typescript({
            typescript: require('typescript'),
            tsconfigOverride: {
                compilerOptions: {
                    module: 'ESNext'
                }
            }
        }),
    ],
};
