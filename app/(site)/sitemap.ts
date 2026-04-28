// src/app/(site)/sitemap.ts
import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://bodyvisualizerai.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const pagesDirectory = path.join(process.cwd(), '/app/(site)');
  let paths: string[] = [];

  function readPagesDirectory(directory: string) {
    fs.readdirSync(directory).forEach((file) => {
      const absolutePath = path.join(directory, file);
      const stat = fs.statSync(absolutePath);
      if (stat.isDirectory()) {
        readPagesDirectory(absolutePath);
      } else {
        // Only include .tsx files (or .js if you're not using TypeScript)
        // and exclude API routes and any other files you don't want in the sitemap
        if (absolutePath.endsWith('page.tsx') && !absolutePath.includes('/api/') && !absolutePath.includes('/layout/') && !absolutePath.includes('[...not-found]')) {
          const route = absolutePath
            .replace(pagesDirectory, '')
            .replace(/\\/g, '/')
            .replace(/\/index\.tsx$/, '') // Remove /index.tsx
            .replace(/\/page.tsx$/, ''); // Remove .tsx extension
          paths.push(`${BASE_URL}${route}`);
        }
      }
    });
  }

  readPagesDirectory(pagesDirectory);

  return paths.map((url) => ({
    url,
    lastModified: new Date(), // You could make this more dynamic if needed
    changeFrequency: 'daily', // Or your preferred default value
    priority: 0.7, // Or your preferred default value
  }));
}
