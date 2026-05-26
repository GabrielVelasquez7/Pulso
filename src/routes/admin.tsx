import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "./atelier-privado";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin · Noir & Or" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
