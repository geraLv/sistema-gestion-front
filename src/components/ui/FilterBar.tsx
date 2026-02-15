import { Search, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

interface FilterOption {
    value: string;
    label: string;
}

interface FilterBarProps {
    onSearch: (value: string) => void;
    onFilterChange?: (value: string) => void;
    filters?: FilterOption[];
    placeholder?: string;
    initialSearch?: string;
    initialFilter?: string;
}

export function FilterBar({
    onSearch,
    onFilterChange,
    filters = [],
    placeholder = "Buscar...",
    initialSearch = "",
    initialFilter = "",
}: FilterBarProps) {
    const [searchValue, setSearchValue] = useState(initialSearch);
    const [filterValue, setFilterValue] = useState(initialFilter);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            onSearch(searchValue);
        }, 350);
        return () => clearTimeout(handler);
    }, [searchValue, onSearch]);

    const handleClear = () => {
        setSearchValue("");
    };

    return (
        <div className="flex justify-center items-center h-20 w-full sm:flex-row mb-6">
            <div className="flex flex-row w-8/12">
                <div className="relative flex-1 ">
                    <input
                        type="text"
                        className="w-11/12 h-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                        placeholder={placeholder}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}

                    />
                    {searchValue && (
                        <button
                            onClick={handleClear}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {filters.length > 0 && onFilterChange && (
                    <div className="sm:w-1/5 h-10">
                        <div className="relative h-full ">
                            <select
                                className="w-full h-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                value={filterValue}
                                onChange={(e) => {
                                    setFilterValue(e.target.value);
                                    onFilterChange(e.target.value);
                                }}
                            >
                                <option value="">Todos</option>
                                {filters.map((f) => (
                                    <option key={f.value} value={f.value}>
                                        {f.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
