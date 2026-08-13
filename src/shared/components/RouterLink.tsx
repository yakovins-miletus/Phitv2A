import { forwardRef } from "react";
import { SpecularButton as Button } from "@/shared/components/ui/specular";
import MuiLink from "@mui/material/Link";
import type { LinkProps as MuiLinkProps } from "@mui/material/Link";
import { createLink } from "@tanstack/react-router";
import { useTransitionCurtain } from "./TransitionCurtain";

const InterceptedMuiLink = forwardRef<HTMLAnchorElement, MuiLinkProps & { href?: string }>((props, ref) => {
  const curtain = useTransitionCurtain();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let standard modified clicks through (open in new tab)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || props.target === "_blank") {
      if (props.onClick) props.onClick(e);
      return;
    }

    // Prevent TanStack from instantly navigating
    e.preventDefault();
    if (props.onClick) props.onClick(e);
    
    if (props.href) {
      curtain.navigateWithCurtain(props.href);
    }
  };

  return <MuiLink {...props} ref={ref} onClick={handleClick} />;
});

const InterceptedButton = forwardRef<any, any>((props, ref) => {
  const curtain = useTransitionCurtain();
  
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || props.target === "_blank") {
      if (props.onClick) props.onClick(e);
      return;
    }

    e.preventDefault();
    if (props.onClick) props.onClick(e);
    
    if (props.href) {
      curtain.navigateWithCurtain(props.href);
    }
  };

  return <Button {...props} ref={ref} onClick={handleClick} />;
});

/** MUI Link/Button wired into the typed router (preloading, active states). */
export const RouterLink = createLink(InterceptedMuiLink);
export const RouterButton = createLink(InterceptedButton);
