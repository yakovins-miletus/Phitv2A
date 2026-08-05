import { createFileRoute } from "@tanstack/react-router";
import { InnovationLabComingSoon } from "@/features/innovation/components/InnovationLabComingSoon";
import { pageHead } from "@/shared/seo";

export const Route = createFileRoute("/innovation-hub/")({
  head: () =>
    pageHead(
      "Innovation Lab (Coming Soon) · Phitopolis R&D",
      "A public repository for internal developer tools, microsecond C++ kernels, ML signal prototypes, and open-source utilities built by Phitopolis internal teams.",
    ),
  component: InnovationPage,
});

function InnovationPage() {
  return <InnovationLabComingSoon />;
}
