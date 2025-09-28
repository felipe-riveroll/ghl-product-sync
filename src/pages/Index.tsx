import { ProductTable } from '@/components/ProductTable';
import { Sparkles, BarChart3, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product, PaginationInfo, ProductsSummary } from '@/types/product';
import { productService } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });
  const [summary, setSummary] = useState<ProductsSummary>({
    totalProducts: 0,
    totalValue: 0,
    totalStock: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    minQuantity: '',
    maxQuantity: '',
  });
  const { toast } = useToast();

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);

      const currentFilters = {
        ...filters,
        search: debouncedSearch,
      };

      const response = await productService.getProducts(pagination.page, pagination.limit, currentFilters);

      if (!isMounted) {
        return;
      }

      if (response.success) {
        const { products: fetchedProducts, pagination: paginationInfo, summary: summaryInfo } =
          response.data;

        setProducts(fetchedProducts);
        setPagination((prev) => ({
          ...prev,
          ...paginationInfo,
          // If total pages is 0, ensure it's 1
          totalPages: paginationInfo.totalPages > 0 ? paginationInfo.totalPages : 1,
        }));
        // The summary now comes from the backend and represents the total inventory
        setSummary(summaryInfo);
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }

      setLoading(false);
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [pagination.page, pagination.limit, debouncedSearch, toast, filters.minPrice, filters.maxPrice, filters.minQuantity, filters.maxQuantity]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch, filters.minPrice, filters.maxPrice, filters.minQuantity, filters.maxQuantity, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.min(Math.max(newPage, 1), Math.max(1, prev.totalPages)),
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Calculate dynamic statistics (based on current page)
  const totalProducts = summary.totalProducts;
  const currentPageValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const currentPageStock = products.reduce((sum, product) => sum + product.quantity, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                GoHighLevel Products
              </h1>
              <p className="text-muted-foreground">
                Gestión profesional de productos con edición en línea
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Productos</p>
                  <p className="text-2xl font-bold">{loading ? "-" : totalProducts}</p>
                  <p className="text-xs text-muted-foreground">
                    Mostrando {products.length} de {totalProducts}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-md">
                  <BarChart3 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">{loading ? "-" : formatCurrency(summary.totalValue)}</p>
                  <p className="text-xs text-muted-foreground">
                    Página actual: {formatCurrency(currentPageValue)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-md">
                  <BarChart3 className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Total</p>
                  <p className="text-2xl font-bold">
                    {loading ? "-" : `${summary.totalStock} unidades`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Página actual: {currentPageStock} unidades
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Pagination Controls */}
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-lg border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search by Name */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label htmlFor="search" className="text-sm font-medium text-muted-foreground">Buscar por nombre</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      id="search"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Ej: Collar de corazón"
                      className="pl-10 pr-4 py-2 w-full border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Filter by Price */}
                <div className="lg:col-span-1">
                  <label htmlFor="minPrice" className="text-sm font-medium text-muted-foreground">Precio</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" id="minPrice" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min" className="w-full border-input bg-background rounded-md text-sm p-2"/>
                    <input type="number" id="maxPrice" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max" className="w-full border-input bg-background rounded-md text-sm p-2"/>
                  </div>
                </div>

                {/* Filter by Quantity */}
                <div className="lg:col-span-1">
                   <label htmlFor="minQuantity" className="text-sm font-medium text-muted-foreground">Stock</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" id="minQuantity" name="minQuantity" value={filters.minQuantity} onChange={handleFilterChange} placeholder="Min" className="w-full border-input bg-background rounded-md text-sm p-2"/>
                    <input type="number" id="maxQuantity" name="maxQuantity" value={filters.maxQuantity} onChange={handleFilterChange} placeholder="Max" className="w-full border-input bg-background rounded-md text-sm p-2"/>
                  </div>
                </div>

                {/* Items per page */}
                <div className="lg:col-span-1">
                  <label htmlFor="limit" className="text-sm font-medium text-muted-foreground">Items por página</label>
                   <select
                    id="limit"
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="w-full px-3 py-2 mt-1 border border-input bg-background rounded-md text-sm"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 p-4 bg-card rounded-lg border">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevious}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
              >
                Anterior
              </button>
              
              <span className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
              >
                Siguiente
              </button>
            </div>
          </div>

          {/* Product Table */}
          <ProductTable
            products={products}
            isLoading={loading}
            onProductsChange={setProducts}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
