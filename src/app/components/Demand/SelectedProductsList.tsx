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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    setInputValues(
      orderItems.map((item, idx) => {
        if (idx === focusedIndex) {
          return inputValues[idx] ?? item.quantity.toString();
        }
        return formatQuantity(item.quantity);
      })
    );
  }, [orderItems]);

  const formatQuantity = (quantity: number): string => {
    return quantity % 1 === 0
      ? quantity.toString()
      : quantity.toFixed(2).replace(/\.?0+$/, "");
  };

  const updateInputValue = (index: number, raw: string) => {
    let filtered = raw.replace(/[^0-9.]/g, "");

    const parts = filtered.split(".");
    if (parts.length > 2) {
      filtered = parts[0] + "." + parts.slice(1).join("");
    }

    if (filtered.startsWith(".")) {
      filtered = "0" + filtered;
    }

    if (/^0[0-9]/.test(filtered)) {
      filtered = filtered.replace(/^0+/, "") || "0";
    }

    const updatedParts = filtered.split(".");
    if (updatedParts.length === 2) {
      updatedParts[1] = updatedParts[1].slice(0, 2);
      filtered = updatedParts[0] + "." + updatedParts[1];
    }

    setInputValues((prev) => {
      const updated = [...prev];
      updated[index] = filtered;
      return updated;
    });

    if (filtered.endsWith(".") || filtered === "") return;

    const parsed = parseFloat(filtered);
    if (!isNaN(parsed)) {
      handleQuantityChange(index, parsed);
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
                onClick={() =>
                  handleQuantityChange(index, Math.max(0, item.quantity - 0.5))
                }
              >
                -
              </button>
              <Input
                type="text"
                inputMode="decimal"
                value={inputValues[index] ?? ""}
                onChange={(e) => updateInputValue(index, e.target.value)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => {
                  setFocusedIndex(null);
                  const value = inputValues[index];

                  if (!value || value === ".") {
                    handleQuantityChange(index, 0);
                    setInputValues((prev) => {
                      const updated = [...prev];
                      updated[index] = "0";
                      return updated;
                    });
                    return;
                  }

                  const parsed = parseFloat(value);
                  if (!isNaN(parsed)) {
                    handleQuantityChange(index, parsed);
                    setInputValues((prev) => {
                      const updated = [...prev];
                      updated[index] = formatQuantity(parsed);
                      return updated;
                    });
                  }
                }}
                className="w-14 md:w-16 text-center border-0 shadow-none text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
