"use client";

import { Search, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

interface TagFiltersProps {
  batches: { id: string; name: string; prefix: string }[];
  currentStatus?: string;
  currentBatch?: string;
  currentSearch?: string;
}

export default function TagFilters({ batches, currentStatus, currentBatch, currentSearch }: TagFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch || "");

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filtering
      params.delete("page");
      router.push(`/dashboard/admin/tags?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("q", searchValue);
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/dashboard/admin/tags");
  };

  const hasActiveFilters = currentStatus || currentBatch || currentSearch;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar por código, mascota o notas..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm"
            />
          </div>
        </form>

        {/* Status Filter */}
        <select
          value={currentStatus || "ALL"}
          onChange={(e) => updateFilters("status", e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm font-medium min-w-[160px]"
        >
          <option value="ALL">Todos los estados</option>
          <option value="UNREGISTERED">🔵 Libres</option>
          <option value="ACTIVE">🟢 Activos</option>
          <option value="LOST">🟠 Perdidos</option>
          <option value="BLOCKED">🔴 Bloqueados</option>
        </select>

        {/* Batch Filter */}
        <select
          value={currentBatch || "ALL"}
          onChange={(e) => updateFilters("batch", e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none bg-gray-50 text-sm font-medium min-w-[160px]"
        >
          <option value="ALL">Todos los lotes</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors whitespace-nowrap"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
