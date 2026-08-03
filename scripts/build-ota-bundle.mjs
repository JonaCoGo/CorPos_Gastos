// Genera el paquete de actualización en caliente (OTA) que consume la app
// Android (Capacitor + @capgo/capacitor-updater, ver src/hooks/useOtaUpdate.ts).
// Corre automáticamente después de "npm run build" (script "postbuild").
//
// Zippea el dist/ recién construido y escribe dist/updates/version.json con
// {version, url}. Como dist/ se despliega tal cual a Vercel, este manifest
// queda accesible en producción sin pasos manuales adicionales.
import { createWriteStream, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ZipArchive } from "archiver";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const UPDATES_DIR = path.join(DIST_DIR, "updates");
const BASE_URL = "https://corpos-gastos.vercel.app";
const KEEP_LAST_N_BUNDLES = 5;

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error('dist/ no existe todavía — corre "vite build" antes de este script.');
    process.exit(1);
  }

  mkdirSync(UPDATES_DIR, { recursive: true });

  const version = new Date().toISOString();
  const zipName = `bundle-${version.replace(/[:.]/g, "-")}.zip`;
  const zipPath = path.join(UPDATES_DIR, zipName);

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    // Todo dist/ excepto la carpeta updates/ que estamos generando ahora mismo
    archive.glob("**/*", { cwd: DIST_DIR, ignore: ["updates/**"] });
    archive.finalize();
  });

  writeFileSync(
    path.join(UPDATES_DIR, "version.json"),
    JSON.stringify({ version, url: `${BASE_URL}/updates/${zipName}` }, null, 2)
  );

  // Limpieza: no acumular bundles viejos en cada deploy
  const zips = readdirSync(UPDATES_DIR).filter((f) => f.endsWith(".zip")).sort();
  const toDelete = zips.slice(0, Math.max(0, zips.length - KEEP_LAST_N_BUNDLES));
  toDelete.forEach((f) => unlinkSync(path.join(UPDATES_DIR, f)));

  console.log(`OTA bundle generado: ${zipName}`);
}

main().catch((err) => {
  console.error("Error generando el bundle OTA:", err);
  process.exit(1);
});
