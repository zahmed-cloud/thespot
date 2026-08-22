import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "thespot.lol",
    short_name: "thespot",
    description:
      "a public leaderboard where rank is decided by one thing: how much you paid.",
    start_url: "/",
    display: "browser",
    background_color: "#F7F8FA",
    theme_color: "#F7F8FA",
    icons: [
      { src: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
