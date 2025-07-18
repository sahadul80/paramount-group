import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Products } from "@/app/demand/page";
import { X, Plus } from "lucide-react";

interface ProductSectionProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredProducts: Products[];
  orderItems: { product: string; quantity: number; uom: string; }[];
  handleProductSelect: (product: Products) => void;
}

export default function ProductSection({
  searchTerm,
  setSearchTerm,
  filteredProducts,
  orderItems,
  handleProductSelect,
}: ProductSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-md p-2" htmlFor="product-search">Add Products</Label>
      <div className="relative">
        <Input
          id="product-search"
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="pl-8 text-sm h-8 sm:h-9"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="max-h-30 overflow-y-auto">
          {filteredProducts.map(p => {
            const isSelected = orderItems.some(item => item.product === p.product);
            return (
              <button
                key={p.product}
                className={`flex justify-between text-sm items-center block w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isSelected
                  ? 'bg-indigo-400/50 border-l-2 border-indigo-500'
                  : ''
                  } border-b`}
                onClick={() => handleProductSelect(p)}
              >
                <span>{p.product}</span>
                {isSelected ? (
                  <X className="h-3 w-3 text-gray-400" />
                ) : (
                  <Plus className="h-3 w-3 text-gray-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}