import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface SelectedProductsListProps {
  orderItems: { product: string; quantity: number; uom: string; }[];
  handleQuantityChange: (index: number, quantity: number) => void;
  handleRemoveProduct: (index: number) => void;
}

export default function SelectedProductsList({
  orderItems,
  handleQuantityChange,
  handleRemoveProduct,
}: SelectedProductsListProps) {
  return (
    <div className="space-y-1">
      {orderItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between bg-white dark:bg-gray-700/50 p-2 rounded-md border text-sm h-10"
        >
          <div className="overflow-auto">
            <span className="mr-2">{index + 1}.</span>
            <span className="font-medium truncate max-w-[50%]">{item.product}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded overflow-hidden max-h-10">
              <button
                className="px-2 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                onClick={() => handleQuantityChange(index, Math.max(0, item.quantity - 0.5))}
              >
                -
              </button>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={item.quantity}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '') {
                    handleQuantityChange(index, 0);
                  } else {
                    if (value.startsWith('0') && value.length > 1 && !value.includes('.')) {
                      handleQuantityChange(index, parseFloat(value.substring(1)));
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        handleQuantityChange(index, numValue);
                      }
                    }
                  }
                }}
                onFocus={(e) => {
                  if (item.quantity === 0) {
                    e.target.select();
                  }
                }}
                onKeyDown={(e) => {
                  if (item.quantity === 0 && /^\d$/.test(e.key)) {
                    e.currentTarget.value = '';
                  }
                }}
                className="w-12 text-center border-0 shadow-none text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                className="px-2 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                onClick={() => handleQuantityChange(index, item.quantity + 0.5)}
              >
                +
              </button>
            </div>
            <p className="w-4">{item.uom}</p>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:bg-red-500/10 h-4 w-4"
              onClick={() => handleRemoveProduct(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}