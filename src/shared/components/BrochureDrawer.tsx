import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
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
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "none",
          },
        },
        paper: {
          sx: {
            height: "100vh",
            maxHeight: "100vh",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
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
          px: { xs: 2, sm: 4 },
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
          zIndex: 10,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <PictureAsPdfIcon sx={{ color: NOIR.goldDark, fontSize: "1.6rem" }} />
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.2rem" } }}>
                {title}
              </Typography>
              <Chip
                label="PDF"
                size="small"
                sx={{
                  fontFamily: MONO,
                  fontSize: "0.7rem",
                  bgcolor: "primary.main",
                  color: "white",
                  height: 20,
                }}
              />
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
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
              px: 2,
            }}
          >
            Open in New Tab
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="small"
            component="a"
            href={pdfUrl}
            download="2026-Technical-Graduate-Program.pdf"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{
              borderRadius: "100px",
              px: 2.5,
            }}
          >
            Download
          </Button>

          <IconButton onClick={onClose} aria-label="Close Brochure Drawer" sx={{ color: "text.primary", ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* PDF Viewport Body */}
      <Box
        data-lenis-prevent
        sx={{
          flexGrow: 1,
          width: "100%",
          height: "calc(100vh - 60px)",
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          bgcolor: "#1E1E1E",
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
