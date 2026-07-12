import * as esbuild from "esbuild";
import * as fs from "node:fs/promises";

const isDev = !!process.argv.includes("--dev");
const isWatch = !!process.argv.includes("--watch");

const codeBuildOptions = {
  entryPoints: ["src/code.ts"],
  outfile: "dist/code.js",
  bundle: true,
  format: "iife",
  target: "es2017",
  minify: !isDev,
  sourcemap: isDev,
  platform: "neutral",
};

const uiTemplatePath = "src/ui/template.html";
const uiOutPath = "dist/ui.html";

/** dist/ui.html を書き出す esbuild プラグイン。src/ui/main.ts のバンドル結果を template に埋め込む */
const writeUiHtmlPlugin = {
  name: "write-ui-html",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) return;

      const outputFile = result.outputFiles?.[0];
      if (!outputFile) return;

      const script = outputFile.text.replace(/<\/script>/g, "<\\/script>");
      const template = await fs.readFile(uiTemplatePath, "utf-8");
      const html = template.replace(
        "<!-- %UI_SCRIPT% -->",
        () => `<script>${script}</script>`,
      );

      await fs.mkdir("dist", { recursive: true });
      await fs.writeFile(uiOutPath, html);
    });
  },
};

const uiBuildOptions = {
  entryPoints: ["src/ui/main.ts"],
  bundle: true,
  format: "iife",
  target: "es2017",
  platform: "browser",
  minify: !isDev,
  sourcemap: isDev ? "inline" : false,
  write: false,
  plugins: [writeUiHtmlPlugin],
};

if (isWatch) {
  console.log("🔄 Watch mode");
  const codeContext = await esbuild.context(codeBuildOptions);
  const uiContext = await esbuild.context(uiBuildOptions);

  console.log("👀 Watching for changes...");
  await Promise.all([codeContext.watch(), uiContext.watch()]);
} else {
  console.log("🔨 Build mode");

  try {
    await Promise.all([
      esbuild.build(codeBuildOptions),
      esbuild.build(uiBuildOptions),
    ]);
    console.log("✅  Build completed!");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}
