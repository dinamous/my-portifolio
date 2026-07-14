import { createClient } from "@sanity/client";

// ponytail: unused until a section actually needs CMS-managed content; projects.json covers today's data.
export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID ?? "",
  dataset: import.meta.env.VITE_SANITY_DATASET ?? "production",
  apiVersion: "2026-01-01",
  useCdn: true,
});
