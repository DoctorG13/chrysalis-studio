import { useMemo } from "react";
import { getDashboardInsights } from "../utils/dashboard";

export default function useDashboard(clients = []) {
  return useMemo(
    () => getDashboardInsights(clients),
    [clients]
  );
}