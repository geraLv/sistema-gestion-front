import { X } from "lucide-react";
import { useState, useEffect } from "react";

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
        <div className="flex flex-col md:flex-row justify-center items-center w-full mb-6 gap-4">
            <div className="flex flex-col md:flex-row w-full md:w-10/12 gap-4">
                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        className="w-full h-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all pl-4"
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
                    <div className="w-full md:w-1/4 h-10">
                        <div className="relative h-full ">
                            <select
                                className="w-full h-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white px-3"
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
