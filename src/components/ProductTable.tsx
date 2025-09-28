import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/product';
import { productService } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Package, DollarSign } from 'lucide-react';

interface EditingCell {
  productId: string;
  field: 'price' | 'quantity';
  value: string;
}

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onProductsChange: (products: Product[]) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ products, isLoading, onProductsChange }) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleDoubleClick = (productId: string, field: 'price' | 'quantity', currentValue: number) => {
    setEditingCell({
      productId,
      field,
      value: currentValue.toString()
    });
  };

  const handleInputChange = (value: string) => {
    if (editingCell) {
      setEditingCell({
        ...editingCell,
        value
      });
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingCell) {
      await saveChanges();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const saveChanges = async () => {
    if (!editingCell) return;

    const { productId, field, value } = editingCell;
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Error",
        description: "Por favor ingrese un valor válido",
        variant: "destructive",
      });
      return;
    }

    setUpdating(productId);
    let response;

    try {
      if (field === 'price') {
        const product = products.find((p) => p.id === productId);
        if (!product) {
          throw new Error('Producto no encontrado');
        }
        
        response = await productService.updateProductPrice({
          productId,
          priceId: product.priceId,
          price: numericValue
        });
      } else {
        response = await productService.updateInventory({
          productId,
          quantity: Math.floor(numericValue)
        });
      }

      if (response.success) {
        const updatedProduct = products.map((p) => {
          if (p.id !== productId) return p;

          const updatedPrice =
            typeof response.data.price === 'number'
              ? response.data.price
              : numericValue;

          const updatedQuantity =
            typeof response.data.quantity === 'number'
              ? response.data.quantity
              : Math.floor(numericValue);

          return {
            ...p,
            ...response.data,
            price: field === 'price' ? updatedPrice : p.price,
            quantity: field === 'quantity' ? updatedQuantity : p.quantity,
          };
        });

        onProductsChange(updatedProduct);
        toast({
          title: "Actualizado",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el producto",
        variant: "destructive",
      });
    }

    setEditingCell(null);
    setUpdating(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Sin stock', variant: 'destructive' as const, icon: XCircle };
    if (quantity < 10) return { label: 'Stock bajo', variant: 'warning' as const, icon: Package };
    return { label: 'En stock', variant: 'success' as const, icon: CheckCircle2 };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestión de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-[200px] mb-2" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestión de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se encontraron productos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Gestión de Productos
          <span className="text-sm font-normal text-muted-foreground">
            ({products.length} productos en esta página)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-table-header">
                <th className="text-left p-4 font-medium">Producto</th>
                <th className="text-left p-4 font-medium">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Precio
                  </div>
                </th>
                <th className="text-left p-4 font-medium">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Stock
                  </div>
                </th>
                <th className="text-left p-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                const StatusIcon = stockStatus.icon;
                
                return (
                  <tr 
                    key={product.id} 
                    className="border-b hover:bg-table-row-hover transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md border"
                          loading="lazy"
                        />
                        <div>
                          <h3 className="font-medium text-foreground">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {editingCell?.productId === product.id && editingCell?.field === 'price' ? (
                        <input
                          ref={inputRef}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingCell.value}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={saveChanges}
                          className="w-24 px-2 py-1 text-sm border border-edit-border rounded bg-edit-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <span
                          className="font-mono cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors"
                          onDoubleClick={() => handleDoubleClick(product.id, 'price', product.price)}
                          title="Doble clic para editar"
                        >
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingCell?.productId === product.id && editingCell?.field === 'quantity' ? (
                        <input
                          ref={inputRef}
                          type="number"
                          min="0"
                          value={editingCell.value}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={saveChanges}
                          className="w-20 px-2 py-1 text-sm border border-edit-border rounded bg-edit-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <span
                          className="font-mono cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors"
                          onDoubleClick={() => handleDoubleClick(product.id, 'quantity', product.quantity)}
                          title="Doble clic para editar"
                        >
                          {product.quantity} unidades
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={stockStatus.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {stockStatus.label}
                      </Badge>
                      {updating === product.id && (
                        <div className="mt-1 text-xs text-muted-foreground">Actualizando...</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Cómo usar:</strong> Haz doble clic en cualquier precio o cantidad para editar. 
            Presiona <kbd className="px-1 py-0.5 text-xs bg-background border rounded">Enter</kbd> para guardar 
            o <kbd className="px-1 py-0.5 text-xs bg-background border rounded">Escape</kbd> para cancelar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};