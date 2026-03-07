import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options?: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    /** If provided, enables async search mode. Called with the search term, must return options. */
    onSearch?: (term: string) => Promise<Option[]>;
    /** Minimum characters to type before triggering onSearch (default: 2) */
    minSearchLength?: number;
}

export function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = "Seleccione...",
    label,
    disabled = false,
    className = "",
    onSearch,
    minSearchLength = 2,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [asyncOptions, setAsyncOptions] = useState<Option[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState<string>("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isAsync = !!onSearch;

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // In async mode: debounce search calls
    const handleSearchChange = useCallback((term: string) => {
        setSearchTerm(term);
        if (!isAsync) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (term.trim().length < minSearchLength) {
            setAsyncOptions([]);
            return;
        }

        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const results = await onSearch!(term.trim());
                setAsyncOptions(results);
            } catch {
                setAsyncOptions([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, [isAsync, onSearch, minSearchLength]);

    // Find selected label from either sync options or remembered label
    const syncSelected = options.find((opt) => String(opt.value) === String(value));
    const displayLabel = syncSelected?.label || selectedLabel || "";

    // Filtered / displayed options
    const displayedOptions = isAsync
        ? asyncOptions
        : options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSelect = (val: string | number, lbl: string) => {
        onChange(val);
        setSelectedLabel(lbl);
        setIsOpen(false);
        setSearchTerm("");
        setAsyncOptions([]);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-sm font-semibold mb-1">{label}</label>}

            <div
                className={`input-sleek w-full flex items-center justify-between cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={`block truncate ${!displayLabel && !value ? "text-slate-400" : ""}`}>
                    {displayLabel || (value ? `ID: ${value}` : placeholder)}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="sticky top-0 bg-white p-2 border-b">
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={isAsync ? `Escribir al menos ${minSearchLength} letras...` : "Buscar..."}
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {isSearching ? (
                        <div className="flex items-center gap-2 py-3 px-4 text-slate-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Buscando...
                        </div>
                    ) : displayedOptions.length === 0 ? (
                        <div className="cursor-default select-none relative py-2 px-4 text-slate-500">
                            {isAsync && searchTerm.length < minSearchLength
                                ? `Escriba al menos ${minSearchLength} caracteres para buscar`
                                : "No se encontraron resultados"}
                        </div>
                    ) : (
                        displayedOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 transition-colors ${String(option.value) === String(value) ? "bg-blue-50 text-blue-700" : "text-slate-900"}`}
                                onClick={() => handleSelect(option.value, option.label)}
                            >
                                <span className={`block truncate ${String(option.value) === String(value) ? "font-semibold" : "font-normal"}`}>
                                    {option.label}
                                </span>
                                {String(option.value) === String(value) && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                        <Check className="w-4 h-4" />
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
