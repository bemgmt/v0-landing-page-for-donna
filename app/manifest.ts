import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DONNA",
    short_name: "DONNA",
    description: "Your AI Office Receptionist That Never Stops",
    icons: [
      {
        src: "/brand/icon/donna-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icon/donna-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
