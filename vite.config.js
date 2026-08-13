import { fileURLToPath, URL } from 'url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const backendUrl = env.BACKEND_URL ? new URL(env.BACKEND_URL) : null
    const backendUri = mode === 'development' && backendUrl
        ? backendUrl.pathname
        : env.BACKEND_URL

    return {
    define: {
        'import.meta.env.BACKEND_URL': JSON.stringify(backendUri),
    },
    plugins: [
        vue(),
        tailwindcss(),
        Pages(),
        AutoImport({
            // targets to transform
            include: [
                /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
                /\.vue$/,
                /\.vue\?vue/, // .vue
                /\.md$/, // .md
            ],

            // global imports to register
            imports: [
                // presets
                'vue',
                'vue-router',
                // custom
                {
                    // named imports
                    // import { onClickOutside } from '@vueuse/core',
                    '@vueuse/core': [
                        'onClickOutside',
                        'useToggle',
                        'useDark',
                        'useElementSize',
                        'useWindowFocus',
                        // alias
                        // import { useFetch as useMyFetch } from '@vueuse/core',
                        ['useFetch', 'useMyFetch'],
                    ],
                    // default imports
                    // import { default as axios } from 'axios',
                    '[package-name]': [
                        '[import-names]',
                        // alias
                        ['[from]', '[alias]'],
                    ],
                    axios: [['default', 'axios']],
                    // vueAdvanceCropper: ['Cropper'],
                },
            ],
            // Enable auto import by filename for default module exports under directories
            defaultExportByFilename: false,

            // Auto import for module exports under directories
            // by default it only scan one level of modules under the directory
            dirs: [
                './src/utils',
                // './hooks',
                // './composables/**', // all nested modules
                // ...
            ],

            // Filepath to generate corresponding .d.ts file.
            // Defaults to './auto-imports.d.ts' when `typescript` is installed locally.
            // Set `false` to disable.
            // dts: './auto-imports.d.ts',
            dts: false,

            // Auto import inside Vue template
            // see https://github.com/unjs/unimport/pull/15 and https://github.com/unjs/unimport/pull/72
            vueTemplate: true,

            // Custom resolvers, compatible with `unplugin-vue-components`
            // see https://github.com/antfu/unplugin-auto-import/pull/23/
            resolvers: [
                /* ... */
            ],

            // Generate corresponding .eslintrc-auto-import.json file.
            // eslint globals Docs - https://eslint.org/docs/user-guide/configuring/language-options#specifying-globals
            eslintrc: {
                enabled: false, // Default `false`
                filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
                globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
            },
        }),
        Components({
            dirs: ['src/components', 'src/pages', 'node_modules'], // src/assets exluded
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 3000,
        ...(backendUrl ? {
            proxy: {
                '/api': {
                    target: backendUrl.origin,
                    changeOrigin: true,
                },
            },
        } : {}),
    },
    }
})
