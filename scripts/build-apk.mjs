import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const androidDirectory = resolve(projectRoot, "android");
const gradleCommand = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const syncOnly = process.argv.includes("--sync-only");

function run(command, args, cwd = projectRoot) {
  const result = spawnSync(command, args, {
    cwd,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

process.env.CAPACITOR_BUILD = "true";
run("npm", ["run", "build"]);
run("npx", ["cap", "sync", "android"]);

if (syncOnly) {
  console.log("Arquivos web sincronizados com o projeto Android.");
  process.exit(0);
}

run(gradleCommand, ["assembleDebug"], androidDirectory);

const generatedApk = resolve(androidDirectory, "app/build/outputs/apk/debug/app-debug.apk");
if (!existsSync(generatedApk)) {
  throw new Error(`O Gradle terminou sem gerar o APK esperado: ${generatedApk}`);
}

const outputApk = resolve(projectRoot, "PontoCerto.apk");
copyFileSync(generatedApk, outputApk);
console.log(`APK gerado em: ${outputApk}`);
