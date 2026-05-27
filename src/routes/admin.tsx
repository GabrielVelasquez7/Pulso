import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "./atelier-privado";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin · PULSO" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
