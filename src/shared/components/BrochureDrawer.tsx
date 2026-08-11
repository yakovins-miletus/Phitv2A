import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { SpecularIconButton as IconButton } from "@/shared/components/ui/specular";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { NOIR } from "@/shared/theme/palette";
import { MONO } from "@/shared/theme/theme";

interface BrochureDrawerProps {
  open: boolean;
  onClose: () => void;
  pdfUrl?: string;
  title?: string;
}

export function BrochureDrawer({
  open,
  onClose,
  pdfUrl = "/pdfs/2026-Technical-Graduate-Program.pdf",
  title = "2026 Technical Graduate Program Brochure",
}: BrochureDrawerProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      transitionDuration={650}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(3, 10, 22, 0.45)",
            backdropFilter: "blur(4px)",
          },
        },
        paper: {
          sx: {
            height: "100vh",
            maxHeight: "100vh",
            bgcolor: "rgba(6, 18, 38, 0.80)",
            backdropFilter: "blur(32px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            color: "common.white",
          },
        },
      }}
    >
      {/* Fixed Header Bar */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          flexShrink: 0,
          px: { xs: 2.5, sm: 4 },
          py: 2,
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          bgcolor: "rgba(6, 24, 59, 0.9)",
          backdropFilter: "blur(16px)",
          zIndex: 10,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <PictureAsPdfIcon sx={{ color: NOIR.gold, fontSize: "1.7rem" }} />
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: "1rem", sm: "1.2rem" }, color: NOIR.frost }}>
                {title}
              </Typography>
              <Chip
                label="PDF"
                size="small"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  bgcolor: "rgba(var(--accent-rgb), 0.18)",
                  color: NOIR.gold,
                  border: "1px solid rgba(var(--accent-rgb), 0.3)",
                  height: 22,
                }}
              />
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            component="a"
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<OpenInNewIcon fontSize="small" />}
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              borderRadius: "100px",
              px: 2.5,
              py: 0.8,
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: "0.75rem",
              borderColor: "rgba(255, 255, 255, 0.25)",
              color: "rgba(244, 247, 252, 0.9)",
              "&:hover": {
                borderColor: NOIR.gold,
                color: NOIR.gold,
                bgcolor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            Open in New Tab
          </Button>

          <Button
            variant="contained"
            size="small"
            component="a"
            href={pdfUrl}
            download="2026-Technical-Graduate-Program.pdf"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{
              borderRadius: "100px",
              px: 3,
              py: 0.8,
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: "0.75rem",
              bgcolor: NOIR.gold,
              color: NOIR.navyInk,
              boxShadow: "0 4px 14px rgba(var(--accent-rgb), 0.25)",
              "&:hover": {
                bgcolor: NOIR.goldLight,
                boxShadow: "0 6px 18px rgba(var(--accent-rgb), 0.4)",
              },
            }}
          >
            Download
          </Button>

          <IconButton
            onClick={onClose}
            aria-label="Close Brochure Drawer"
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              bgcolor: "rgba(255, 255, 255, 0.06)",
              ml: 1,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)", color: "white" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {/* PDF Viewport Body */}
      <Box
        data-lenis-prevent
        sx={{
          flexGrow: 1,
          width: "100%",
          height: "calc(100vh - 65px)",
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          bgcolor: "#050D1B",
        }}
      >
        <object
          data={pdfUrl}
          type="application/pdf"
          style={{ width: "100%", height: "100%", border: "none" }}
        >
          <iframe
            src={pdfUrl}
            title={title}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </object>
      </Box>
    </Drawer>
  );
}
