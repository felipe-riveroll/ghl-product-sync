import { ProductTable } from '@/components/ProductTable';
import { Sparkles, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product, PaginationInfo, ProductsSummary } from '@/types/product';
import { productService } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      const response = await productService.getProducts(pagination.page, pagination.limit);

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
        }));
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
  }, [pagination.page, pagination.limit, toast]);

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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Elementos por página:</span>
              <select 
                value={pagination.limit} 
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={300}>300</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
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
