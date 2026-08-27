import { createContext, useContext } from "react";

export interface TransitionCurtainContextType {
  navigateWithCurtain: (to: string) => void;
}

export const TransitionCurtainContext = createContext<TransitionCurtainContextType | null>(null);

export function useTransitionCurtain() {
  const context = useContext(TransitionCurtainContext);
  if (!context) {
    throw new Error("useTransitionCurtain must be used within a TransitionCurtainProvider");
  }
  return context;
}
