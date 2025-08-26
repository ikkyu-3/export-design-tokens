import * as esbuild from "esbuild";

const isDev = !!process.argv.includes('--dev');
const isWatch = !!process.argv.includes('--watch');

const buildOptions = {
    entryPoints: ['src/code.ts'],
    outfile: 'dist/code.js',
    bundle: true,
    format: 'iife',
    target: 'es2017',
    minify: !isDev,
    sourcemap: isDev,
    platform: "neutral",
}

if (isWatch) {
    console.log('🔄 Watch mode')
    const context = await esbuild.context(buildOptions)

    console.log('👀 Watching for changes...')
    await context.watch()
} else {
    console.log('🔨 Build mode')

    try {
        await esbuild.build(buildOptions)
        console.log('✅  Build completed!')
    } catch (error) {
        console.error('❌ Build failed:', error)
        process.exit(1)
    }
}
