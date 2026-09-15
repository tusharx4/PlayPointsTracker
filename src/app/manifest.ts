import type { MetadataRoute } from "next";

/**
 * Served at /manifest.webmanifest with Content-Type application/manifest+json.
 * Keep this to Chrome's installability minimum — extra fields have caused
 * Android Chrome to show "This app cannot be installed."
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Play Points Tracker",
    short_name: "Play Points",
    description:
      "Track Google Play Points across multiple Gmail accounts — weekly claims, quest rewards, purchase bonuses and redemptions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a73e8",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
