/** Public-folder URL that respects Vite's `base` (e.g. /BB-Bakery/ on GitHub Pages). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
