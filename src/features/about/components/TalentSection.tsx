import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { CONTENT } from "@/shared/content";
import { Section } from "@/shared/components/Section";
import { Reveal, StaggerGroup, StaggerItem } from "@/shared/components/Reveal";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

import { MetaLabel } from "./MetaLabel";

/**
 * "Where our talent comes from" — moved out of routes/about.tsx and
 * restructured per WS-16 #2.
 *
 * (a) The schools are the hero of the section (they are named, verifiable
 *     institutions), the discipline split is demoted to quiet supporting
 *     detail below them — the reverse of the old layout, which led with two
 *     oversized stat tiles and buried the school logos in a cramped grid.
 * (b) Brunel and Sophia (content.ts `intl: true`) get their own labelled
 *     sub-group instead of sitting mixed in with the nine Philippine schools.
 * (c) The 37%/15% figures render as the original prose sentence, not as
 *     stat tiles — see the note on `content.ts`'s `talent.highlights` for
 *     why no denominator or as-of date is invented here.
 * (d) The disciplines list keeps its 95%-named / 5%-"Other" honesty signal
 *     legible rather than rounding it away — see the comment on
 *     `content.ts`'s `talent.disciplines`.
 */
export function TalentSection() {
  const { highlights, disciplines, schools } = CONTENT.talent;
  const phSchools = schools.filter((school) => !school.intl);
  const intlSchools = schools.filter((school) => school.intl);

  const [qsHighlight, degreeHighlight] = highlights;
  const namedDisciplinesPct = disciplines
    .filter((d) => d.label !== "Other")
    .reduce((sum, d) => sum + d.pct, 0);

  return (
    <Section>
      <Stack spacing={{ xs: 6, md: 8 }}>
        <Reveal>
          <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
            <MetaLabel>Where Our Talent Comes From</MetaLabel>
            <Typography variant="h2" component="h2">
              Recruited from the top programs in the Philippines and Asia
            </Typography>
            {qsHighlight && degreeHighlight ? (
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, fontSize: "1.05rem", lineHeight: 1.7 }}>
                {qsHighlight.value}
                {qsHighlight.suffix} educated at QS Top 1000 universities. {degreeHighlight.value}
                {degreeHighlight.suffix} hold an advanced or international degree.
              </Typography>
            ) : null}
          </Stack>
        </Reveal>

        {/* The hero: the logo wall, grouped Philippine / international. */}
        <Stack spacing={{ xs: 4, md: 5 }}>
          <Reveal delay={0.1}>
            <Stack spacing={2}>
              <MetaLabel>Alma Maters — Philippines</MetaLabel>
              <StaggerGroup>
                <Stack direction="row" spacing={{ xs: 2, md: 3 }} useFlexGap flexWrap="wrap">
                  {phSchools.map((school) => (
                    <StaggerItem key={school.name}>
                      <Stack
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                        title={school.name}
                        sx={{
                          px: 2,
                          py: 1.25,
                          borderRadius: 2,
                          transition: "background-color 0.2s ease-in-out",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        {school.logo ? (
                          <Box
                            component="img"
                            decoding="async"
                            loading="lazy"
                            src={school.logo}
                            alt={school.name}
                            sx={{ width: 32, height: 32, objectFit: "contain", borderRadius: "50%", bgcolor: "white" }}
                          />
                        ) : (
                          <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "divider" }} />
                        )}
                        <Typography variant="body1" sx={{ fontFamily: MONO, fontSize: "0.95rem", fontWeight: 600, color: "text.primary" }}>
                          {school.abbr}
                        </Typography>
                      </Stack>
                    </StaggerItem>
                  ))}
                </Stack>
              </StaggerGroup>
            </Stack>
          </Reveal>

          {intlSchools.length > 0 ? (
            <Reveal delay={0.15}>
              <Stack spacing={2}>
                <MetaLabel>Alma Maters — International</MetaLabel>
                <StaggerGroup>
                  <Stack direction="row" spacing={{ xs: 2, md: 3 }} useFlexGap flexWrap="wrap">
                    {intlSchools.map((school) => (
                      <StaggerItem key={school.name}>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                          title={school.name}
                          sx={{
                            px: 2,
                            py: 1.25,
                            borderRadius: 2,
                            transition: "background-color 0.2s ease-in-out",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          {school.logo ? (
                            <Box
                              component="img"
                              decoding="async"
                              loading="lazy"
                              src={school.logo}
                              alt={school.name}
                              sx={{ width: 32, height: 32, objectFit: "contain", borderRadius: "50%", bgcolor: "white" }}
                            />
                          ) : (
                            <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "divider" }} />
                          )}
                          <Typography variant="body1" sx={{ fontFamily: MONO, fontSize: "0.95rem", fontWeight: 600, color: "text.primary" }}>
                            {school.name}
                          </Typography>
                        </Stack>
                      </StaggerItem>
                    ))}
                  </Stack>
                </StaggerGroup>
              </Stack>
            </Reveal>
          ) : null}
        </Stack>

        {/* Demoted supporting detail: the discipline split. Quiet, compact,
            legible about its own honesty (95% named + "Other"). */}
        <Reveal delay={0.2}>
          <Stack spacing={1.5} sx={{ maxWidth: 640 }}>
            <MetaLabel>Disciplines</MetaLabel>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
              The named disciplines below account for {namedDisciplinesPct}% of the team; the
              remainder is grouped as "Other" rather than rounded away.
            </Typography>
            <Stack spacing={1.25} sx={{ pt: 1 }}>
              {disciplines.map((discipline) => (
                <Stack key={discipline.label} direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontSize: "0.85rem" }}>
                    {discipline.label}
                  </Typography>
                  <Box sx={{ flex: 2, height: 3, borderRadius: 2, bgcolor: "divider", overflow: "hidden" }}>
                    <Box sx={{ width: `${String(discipline.pct)}%`, height: "100%", bgcolor: NOIR.gold }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: MONO, color: "text.secondary", fontSize: "0.78rem", width: 34, textAlign: "right" }}>
                    {discipline.pct}%
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Reveal>
      </Stack>
    </Section>
  );
}
