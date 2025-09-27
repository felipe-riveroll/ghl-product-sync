import { ProductTable } from '@/components/ProductTable';
import { Sparkles, BarChart3 } from 'lucide-react';

const Index = () => {
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
                  <p className="text-2xl font-bold">4</p>
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
                  <p className="text-2xl font-bold">€979.96</p>
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
                  <p className="text-2xl font-bold">60 unidades</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Table */}
          <ProductTable />
        </div>
      </main>
    </div>
  );
};

export default Index;
