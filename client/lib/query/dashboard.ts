import { useQuery } from "@tanstack/react-query";
import { dashboardEndpoints } from "@/lib/api/endpoints";
import { queryKeys, type DashboardQuery } from "./keys";

export const useDashboard = (params: DashboardQuery) =>
  useQuery({
    queryKey: queryKeys.dashboard(params),
    queryFn: () => dashboardEndpoints.get(params),
    enabled: Boolean(params.from && params.to),
  });
