import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { canonicalUrl } from "../seo";

const EXCLUDED_ROUTES = new Set(["/upload"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const pagesDirectory = path.join(process.cwd(), "/app/(site)");
  let paths: string[] = [];

  function readPagesDirectory(directory: string) {
    fs.readdirSync(directory).forEach((file) => {
      const absolutePath = path.join(directory, file);
      const stat = fs.statSync(absolutePath);
      if (stat.isDirectory()) {
        readPagesDirectory(absolutePath);
      } else {
        if (absolutePath.endsWith("page.tsx") && !absolutePath.includes("/api/") && !absolutePath.includes("/layout/") && !absolutePath.includes("[...not-found]")) {
          const route = absolutePath
            .replace(pagesDirectory, "")
            .replace(/\\/g, "/")
            .replace(/\/index\.tsx$/, "")
            .replace(/\/page.tsx$/, "") || "/";

          if (!EXCLUDED_ROUTES.has(route)) {
            paths.push(canonicalUrl(route));
          }
        }
      }
    });
  }

  readPagesDirectory(pagesDirectory);

  return paths.map((url) => ({
    url,
    lastModified: new Date(), // You could make this more dynamic if needed
    changeFrequency: "daily", // Or your preferred default value
    priority: 0.7, // Or your preferred default value
  }));
}
