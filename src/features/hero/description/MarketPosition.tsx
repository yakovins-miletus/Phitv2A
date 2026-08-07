import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { motion, AnimatePresence } from "framer-motion";

import { CONTENT } from "@/shared/content";
import { StageSection } from "@/shared/components/StageSection";
import { homeSection } from "@/shared/sections";
import { GROUNDS } from "@/shared/theme/grounds";
import { MONO } from "@/shared/theme/theme";
import { NOIR } from "@/shared/theme/palette";

const GROUND = GROUNDS[homeSection("hero-position").ground ?? "panel"];

export function MarketPosition() {
  const { positioning, differentiators } = CONTENT.hero.salesPitch;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <StageSection section={homeSection("hero-position")}>
      <Box sx={{ width: "100%", position: "relative" }}>
        
        {/* Title Area */}
        <Box sx={{ mb: { xs: 6, md: 10 }, textAlign: "center" }}>
          <Typography
            component="p"
            variant="overline"
            sx={{ fontFamily: MONO, color: NOIR.gold, display: "block", mb: 2 }}
          >
            Market position
          </Typography>
        </Box>

        {/* Spatial Matrix Layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr" },
            gap: { xs: 8, md: 8 },
            alignItems: "center",
          }}
        >
          {/* Central Anchor (Target) */}
          <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: "100%", perspective: "1000px" }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: 20, rotateY: -10 }}
              whileInView={{ scale: 1, opacity: 1, rotateX: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                width: "100%",
                aspectRatio: "1",
                maxWidth: "450px",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                transformStyle: "preserve-3d"
              }}
            >
              {/* Orbital Ring 1 - Dashed */}
              <motion.div
                animate={{ rotateZ: 360, rotateX: [60, 65, 60], rotateY: [20, 30, 20] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: "-10%",
                  borderRadius: "50%",
                  border: `1px dashed rgba(10, 42, 102, 0.3)`,
                  boxShadow: "0 0 20px rgba(10, 42, 102, 0.1)",
                }}
              />
              
              {/* Orbital Ring 2 - Solid */}
              <motion.div
                animate={{ rotateZ: -360, rotateX: [70, 60, 70], rotateY: [-20, -10, -20] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: "5%",
                  borderRadius: "50%",
                  border: `1px solid rgba(10, 42, 102, 0.15)`,
                  boxShadow: "inset 0 0 15px rgba(212, 175, 55, 0.05)",
                }}
              />
              
              {/* Orbital Ring 3 - Gold Accent */}
              <motion.div
                animate={{ rotateZ: 180, rotateX: [40, 50, 40], rotateY: [40, 20, 40] }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: "15%",
                  borderRadius: "50%",
                  border: `1px solid rgba(212, 175, 55, 0.2)`,
                  borderBottomColor: "transparent",
                  borderLeftColor: "transparent",
                }}
              />

              <Box sx={{ textAlign: "center", p: 4, zIndex: 1, transform: "translateZ(30px)" }}>
                <Typography variant="h3" component="h2" sx={{ lineHeight: 1.15, fontWeight: 700, color: NOIR.navyField }}>
                  Professional
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, color: NOIR.gold, fontWeight: 600, letterSpacing: "-0.02em" }}>
                  Leadership
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, color: GROUND.muted, maxWidth: "200px", mx: "auto", fontWeight: 500 }}>
                  Decades of Wall St. & Tier-1 Banking tenure
                </Typography>
              </Box>
            </motion.div>
          </Box>

          {/* Differentiator Nodes */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {differentiators.map((diff, i) => {
              const isActive = activeIndex === i;
              return (
                <motion.div
                  key={diff.heading}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  onHoverStart={() => setActiveIndex(i)}
                  style={{ cursor: "pointer" }}
                >
                  <Box
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: "20px",
                      bgcolor: isActive ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.3)",
                      backdropFilter: "blur(24px)",
                      border: "1px solid",
                      borderColor: isActive ? "rgba(10, 42, 102, 0.15)" : "rgba(10, 42, 102, 0.05)",
                      boxShadow: isActive ? "0 12px 40px rgba(0, 0, 0, 0.08)" : "none",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      flexDirection: "column",
                      transform: isActive ? { md: "translateX(-16px)" } : "none",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: isActive ? 1 : 0, transition: "margin 0.3s ease" }}>
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontVariantNumeric: "tabular-nums",
                          fontSize: "0.85rem",
                          color: isActive ? NOIR.gold : GROUND.muted,
                          transition: "color 0.3s ease",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </Typography>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{ 
                          fontWeight: isActive ? 600 : 500,
                          color: NOIR.navyField,
                          fontSize: isActive ? "1.25rem" : "1.1rem",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {diff.heading}
                      </Typography>
                    </Box>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ overflow: "hidden" }}
                        >
                          <Typography
                            sx={{
                              pt: 2,
                              color: GROUND.muted,
                              lineHeight: 1.6,
                              fontSize: "1rem",
                            }}
                          >
                            {diff.body}
                          </Typography>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </motion.div>
              );
            })}
          </Box>
        </Box>
      </Box>
    </StageSection>
  );
}
