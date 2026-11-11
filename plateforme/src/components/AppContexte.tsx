"use client";

import { createContext, useContext } from "react";
import type { App } from "@/lib/app";

const Ctx = createContext<App>("forme");
export function AppProvider({ app, children }: { app: App; children: React.ReactNode }) {
  return <Ctx.Provider value={app}>{children}</Ctx.Provider>;
}
export const useApp = () => useContext(Ctx);
