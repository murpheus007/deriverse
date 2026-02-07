import { useMemo, useState } from "react";
import type { FilterState } from "../../types/filters";

const defaultState: FilterState = {
  startDate: undefined,
  endDate: undefined,
  symbol: "all",
  marketType: "all",
  side: "all",
  search: ""
};

export function useFilterState(initial?: Partial<FilterState>) {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultState,
    ...initial
  });

  const updateFilters = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => setFilters({ ...defaultState, ...initial });

  const filterSummary = useMemo(() => {
    return `${filters.symbol}-${filters.marketType}-${filters.side}`;
  }, [filters]);

  return { filters, updateFilters, resetFilters, filterSummary };
}
