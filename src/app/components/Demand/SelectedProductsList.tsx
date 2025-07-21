import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface SelectedProductsListProps {
  orderItems: { product: string; quantity: number; uom: string }[];
  handleQuantityChange: (index: number, quantity: number) => void;
  handleRemoveProduct: (index: number) => void;
}

export default function SelectedProductsList({
  orderItems,
  handleQuantityChange,
  handleRemoveProduct,
}: SelectedProductsListProps) {
  const [inputValues, setInputValues] = useState<string[]>([]);

  useEffect(() => {
    setInputValues(orderItems.map((item) => item.quantity.toString()));
  }, [orderItems]);

  const updateInputValue = (index: number, raw: string) => {
    // Remove all characters except digits and one decimal point
    let filtered = raw.replace(/[^0-9.]/g, '');
  
    // Keep only the first decimal point
    const parts = filtered.split('.');
    if (parts.length > 2) {
      filtered = parts[0] + '.' + parts.slice(1).join('');
    }
  
    // Handle leading decimals like ".5" => "0.5"
    if (filtered.startsWith('.')) {
      filtered = '0' + filtered;
    }
  
    // Remove unnecessary leading zeros before the decimal or number
    if (filtered.includes('.')) {
      const [intPart, decPart] = filtered.split('.');
      const cleanedInt = intPart.replace(/^0+(?=\d)/, ''); // remove leading zeros but keep one zero if followed by dot
      filtered = `${cleanedInt || '0'}.${decPart}`;
    } else {
      // No decimal: remove leading zeros, fallback to '0' if all zeros
      filtered = filtered.replace(/^0+(?=\d)/, '') || '0';
    }
  
    // Limit to 3 decimal places
    const [int, dec] = filtered.split('.');
    if (dec?.length > 3) {
      filtered = `${int}.${dec.substring(0, 3)}`;
    }
  
    setInputValues((prev) => {
      const updated = [...prev];
      updated[index] = filtered;
      return updated;
    });
  
    const parsed = parseFloat(filtered);
    if (!isNaN(parsed) && filtered !== '0.') {
      handleQuantityChange(index, parsed);
    }
  };  

  const handleInputBlur = (index: number) => {
    const value = inputValues[index];
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      handleQuantityChange(index, parseFloat(parsed.toFixed(3))); // rounded to 3 decimal places
      setInputValues((prev) => {
        const updated = [...prev];
        updated[index] = parsed.toString();
        return updated;
      });
    } else {
      handleQuantityChange(index, 0);
      setInputValues((prev) => {
        const updated = [...prev];
        updated[index] = '0';
        return updated;
      });
    }
  };

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
                onClick={() => handleQuantityChange(index, Math.max(0, parseFloat((item.quantity - 0.5).toFixed(3))))}
              >
                -
              </button>
              <Input
                type="text"
                inputMode="decimal"
                value={inputValues[index] ?? ""}
                onChange={(e) => updateInputValue(index, e.target.value)}
                onBlur={() => handleInputBlur(index)}
                onFocus={(e) => {
                  if (item.quantity === 0) e.target.select();
                }}
                className="w-14 text-center border-0 shadow-none text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                className="px-2 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                onClick={() => handleQuantityChange(index, parseFloat((item.quantity + 0.5).toFixed(3)))}
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
