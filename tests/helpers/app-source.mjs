import { readdir, readFile } from "node:fs/promises";

// The learning shell lives in app/page.tsx, its shared home-model/home-widgets
// helpers, and one component per screen in app/screens. Source-level checks
// read them together as one UI surface.
export const readAppShellSource = async () => {
  const screensDirectory = new URL("../../app/screens/", import.meta.url);
  const screenFiles = (await readdir(screensDirectory))
    .filter((fileName) => fileName.endsWith(".tsx"))
    .sort();
  const sources = await Promise.all([
    readFile(new URL("../../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/home-model.ts", import.meta.url), "utf8"),
    readFile(new URL("../../app/home-widgets.tsx", import.meta.url), "utf8"),
    ...screenFiles.map((fileName) =>
      readFile(new URL(fileName, screensDirectory), "utf8"),
    ),
  ]);
  return sources.join("\n");
};
