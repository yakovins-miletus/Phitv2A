import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { TeamMember } from "../api";

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <Card sx={{ 
      height: 1,
      transition: "all 0.3s ease",
      "&:hover": { borderColor: "primary.main" }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Avatar sx={{ bgcolor: "primary.light", width: 56, height: 56 }}>
            {member.avatar_seed}
          </Avatar>
          <Stack spacing={0.25}>
            <Typography variant="h4" component="h3">
              {member.name}
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              {member.role}
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {member.bio}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {member.focus_areas.map((area) => (
              <Chip key={area} label={area} size="small" />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <Grid container spacing={3}>
      {members.map((member) => (
        <Grid key={member.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <TeamMemberCard member={member} />
        </Grid>
      ))}
    </Grid>
  );
}
