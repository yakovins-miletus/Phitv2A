import {
  ChartLineUp,
  Cpu,
  Flask,
  Graph,
  ShareNetwork,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import Box from "@mui/material/Box";

const ICONS: Record<string, PhosphorIcon> = {
  query_stats: ChartLineUp,
  model_training: Cpu,
  hub: ShareNetwork,
  science: Flask,
};

export function ServiceIcon({ icon }: { icon: string }) {
  const Icon = ICONS[icon] ?? Graph;
  return (
    <Box sx={{ display: "inline-flex", color: "primary.main" }}>
      <Icon weight="duotone" size={32} />
    </Box>
  );
}
