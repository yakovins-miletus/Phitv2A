import type { SvgIconComponent } from "@mui/icons-material";
import HubIcon from "@mui/icons-material/Hub";
import InsightsIcon from "@mui/icons-material/Insights";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ScienceIcon from "@mui/icons-material/Science";

const ICONS: Record<string, SvgIconComponent> = {
  query_stats: QueryStatsIcon,
  model_training: ModelTrainingIcon,
  hub: HubIcon,
  science: ScienceIcon,
};

export function ServiceIcon({ icon }: { icon: string }) {
  const Icon = ICONS[icon] ?? InsightsIcon;
  return <Icon color="primary" fontSize="large" />;
}
