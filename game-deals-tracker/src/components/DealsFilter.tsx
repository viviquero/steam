import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { Filter, X, ChevronDown, ChevronUp, Store, DollarSign, SortAsc } from 'lucide-react';
import { getStores } from '@/services/cheapshark';
import type { Store as StoreType, DealsFilter as DealsFilterType } from '@/types';

interface DealsFilterProps {
  onFilterChange: (filters: DealsFilterType) => void;
  initialFilters?: DealsFilterType;
}

export function DealsFilter({ onFilterChange, initialFilters = {} }: DealsFilterProps) {
  const { language } = useSettings();
  const [isExpanded, setIsExpanded] = useState(false);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  
  // Filter state
  const [selectedStores, setSelectedStores] = useState<string[]>(
    initialFilters.storeID ? initialFilters.storeID.split(',') : []
  );
  const [minPrice, setMinPrice] = useState(initialFilters.lowerPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.upperPrice?.toString() || '');
  const [minDiscount, setMinDiscount] = useState('');
  const [sortBy, setSortBy] = useState<DealsFilterType['sortBy']>(initialFilters.sortBy || 'Deal Rating');
  const [sortDesc, setSortDesc] = useState(initialFilters.desc ?? true);

  const texts = {
    es: {
      filters: 'Filtros',
      stores: 'Tiendas',
      allStores: 'Todas las tiendas',
      priceRange: 'Rango de precio',
      minPrice: 'Mín',
      maxPrice: 'Máx',
      minDiscount: 'Descuento mínimo',
      sortBy: 'Ordenar por',
      sortOptions: {
        'Deal Rating': 'Mejor oferta',
        'Title': 'Título',
        'Savings': 'Descuento',
        'Price': 'Precio',
        'Metacritic': 'Metacritic',
        'Reviews': 'Reseñas',
        'Release': 'Lanzamiento',
        'Store': 'Tienda',
        'Recent': 'Más reciente',
      },
      ascending: 'Ascendente',
      descending: 'Descendente',
      apply: 'Aplicar',
      clear: 'Limpiar',
      showFilters: 'Mostrar filtros',
      hideFilters: 'Ocultar filtros',
      selectedStores: 'tiendas seleccionadas',
    },
    en: {
      filters: 'Filters',
      stores: 'Stores',
      allStores: 'All stores',
      priceRange: 'Price range',
      minPrice: 'Min',
      maxPrice: 'Max',
      minDiscount: 'Minimum discount',
      sortBy: 'Sort by',
      sortOptions: {
        'Deal Rating': 'Best deal',
        'Title': 'Title',
        'Savings': 'Discount',
        'Price': 'Price',
        'Metacritic': 'Metacritic',
        'Reviews': 'Reviews',
        'Release': 'Release date',
        'Store': 'Store',
        'Recent': 'Most recent',
      },
      ascending: 'Ascending',
      descending: 'Descending',
      apply: 'Apply',
      clear: 'Clear',
      showFilters: 'Show filters',
      hideFilters: 'Hide filters',
      selectedStores: 'stores selected',
    },
  };

  const t = texts[language];

  useEffect(() => {
    const loadStores = async () => {
      try {
        const storeList = await getStores();
        setStores(storeList);
      } catch (error) {
        console.error('Error loading stores:', error);
      } finally {
        setLoadingStores(false);
      }
    };
    loadStores();
  }, []);

  const handleStoreToggle = (storeID: string) => {
    setSelectedStores(prev => 
      prev.includes(storeID)
        ? prev.filter(id => id !== storeID)
        : [...prev, storeID]
    );
  };

  const handleApplyFilters = () => {
    const filters: DealsFilterType = {
      onSale: true,
    };

    if (selectedStores.length > 0) {
      filters.storeID = selectedStores.join(',');
    }
    if (minPrice) {
      filters.lowerPrice = parseFloat(minPrice);
    }
    if (maxPrice) {
      filters.upperPrice = parseFloat(maxPrice);
    }
    if (sortBy) {
      filters.sortBy = sortBy;
    }
    filters.desc = sortDesc;

    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    setSelectedStores([]);
    setMinPrice('');
    setMaxPrice('');
    setMinDiscount('');
    setSortBy('Deal Rating');
    setSortDesc(true);
    onFilterChange({ onSale: true });
  };

  const hasActiveFilters = selectedStores.length > 0 || minPrice || maxPrice || minDiscount;

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full sm:w-auto gap-2"
      >
        <Filter className="h-4 w-4" />
        {isExpanded ? t.hideFilters : t.showFilters}
        {hasActiveFilters && (
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
            {selectedStores.length > 0 ? `${selectedStores.length} ${t.selectedStores}` : '•'}
          </span>
        )}
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Expanded Filters */}
      {isExpanded && (
        <Card>
          <CardContent className="p-4 space-y-6">
            {/* Stores */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                {t.stores}
              </label>
              <div className="flex flex-wrap gap-2">
                {loadingStores ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">...</p>
                ) : (
                  stores.map(store => (
                    <button
                      key={store.storeID}
                      onClick={() => handleStoreToggle(store.storeID)}
                      className={`
                        px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2
                        ${selectedStores.includes(store.storeID)
                          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                          : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))]'
                        }
                      `}
                    >
                      <img 
                        src={`https://www.cheapshark.com${store.images.icon}`} 
                        alt={store.storeName}
                        className="w-4 h-4"
                      />
                      {store.storeName}
                    </button>
                  ))
                )}
              </div>
              {selectedStores.length > 0 && (
                <button
                  onClick={() => setSelectedStores([])}
                  className="text-xs text-[hsl(var(--primary))] hover:underline"
                >
                  {t.allStores}
                </button>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t.priceRange}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={t.minPrice}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-24"
                  min="0"
                  step="1"
                />
                <span className="text-[hsl(var(--muted-foreground))]">-</span>
                <Input
                  type="number"
                  placeholder={t.maxPrice}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                {t.sortBy}
              </label>
              <div className="flex flex-wrap gap-2">
                {(['Deal Rating', 'Price', 'Savings', 'Title', 'Metacritic', 'Recent'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg transition-colors
                      ${sortBy === option
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))]'
                      }
                    `}
                  >
                    {t.sortOptions[option]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortDesc(false)}
                  className={`
                    px-3 py-1.5 text-sm rounded-lg transition-colors
                    ${!sortDesc
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  ↑ {t.ascending}
                </button>
                <button
                  onClick={() => setSortDesc(true)}
                  className={`
                    px-3 py-1.5 text-sm rounded-lg transition-colors
                    ${sortDesc
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  ↓ {t.descending}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[hsl(var(--border))]">
              <Button onClick={handleApplyFilters} className="flex-1">
                {t.apply}
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                {t.clear}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
