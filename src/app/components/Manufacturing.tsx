"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Truck, Package, ShoppingBag, Plus, Search } from "lucide-react";

const productionRecordsData = [
  {
    production_id: "PR001",
    finished_good_id: "FG001",
    design_no: "DS001",
    production_date: "2024-01-25",
    fabric_requirements: [
      {
        fabric_sl_no: "F001",
        fabric_type: "Cotton Blend",
        color: "Navy Blue",
        total_fabric_used: 30,
        quantity_per_unit: {
          s: 0.8, m: 0.9, l: 1.0, xl: 1.1, xxl: 1.2, xxxl: 1.3
        }
      }
    ],
    accessory_requirements: [
      {
        accessory_sl_no: "A001",
        accessory_type: "Buttons",
        total_accessories_used: 200,
        quantity_per_unit: { s: 5, m: 5, l: 5, xl: 5, xxl: 5, xxxl: 5 }
      },
      {
        accessory_sl_no: "A002",
        accessory_type: "Zippers",
        total_accessories_used: 50,
        quantity_per_unit: { s: 2, m: 2, l: 2, xl: 2, xxl: 2, xxxl: 2 }
      }
    ],
    total_manufactured_quantity: {
      s: 20, m: 25, l: 30, xl: 20, xxl: 15, xxxl: 10
    },
    per_manufacture_cost: {
      s: 35.00, m: 37.00, l: 39.00, xl: 41.00, xxl: 43.00, xxxl: 45.00
    },
    total_manufacturing_cost: {
      s: 700.00, m: 925.00, l: 1170.00, xl: 820.00, xxl: 645.00, xxxl: 450.00
    },
    labor_cost: 2000.00,
    overhead_cost: 500.00,
    total_production_cost: 6210.00,
    status: "completed"
  },
  {
    production_id: "PR002",
    finished_good_id: "FG002",
    design_no: "DS002",
    production_date: "2024-01-28",
    fabric_requirements: [
      {
        fabric_sl_no: "F002",
        fabric_type: "Silk",
        color: "Ivory",
        total_fabric_used: 20,
        quantity_per_unit: {
          s: 1.0, m: 1.1, l: 1.2, xl: 1.3, xxl: 1.4, xxxl: 1.5
        }
      }
    ],
    accessory_requirements: [
      {
        accessory_sl_no: "A003",
        accessory_type: "Threads",
        total_accessories_used: 200,
        quantity_per_unit: { s: 3, m: 3, l: 3, xl: 3, xxl: 3, xxxl: 3 }
      }
    ],
    total_manufactured_quantity: {
      s: 15, m: 20, l: 25, xl: 15, xxl: 10, xxxl: 5
    },
    per_manufacture_cost: {
      s: 45.00, m: 48.00, l: 52.00, xl: 55.00, xxl: 58.00, xxxl: 62.00
    },
    total_manufacturing_cost: {
      s: 675.00, m: 960.00, l: 1300.00, xl: 825.00, xxl: 580.00, xxxl: 310.00
    },
    labor_cost: 1800.00,
    overhead_cost: 400.00,
    total_production_cost: 6850.00,
    status: "in_progress"
  }
];

export default function Manufacturing() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completed", variant: "secondary" as const },
      in_progress: { label: "In Progress", variant: "outline" as const },
      pending: { label: "Pending", variant: "outline" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config?.variant || "secondary"}>
        {config?.label || status}
      </Badge>
    );
  };

  const getTotalQuantity = (quantities: Record<string, number>) => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  // Deep search function for nested objects
  const searchInObject = (obj: any, term: string): boolean => {
    if (typeof obj === 'string') {
      return obj.toLowerCase().includes(term.toLowerCase());
    }
    if (typeof obj === 'number') {
      return obj.toString().includes(term);
    }
    if (Array.isArray(obj)) {
      return obj.some(item => searchInObject(item, term));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => searchInObject(value, term));
    }
    return false;
  };

  // Filter production records based on search term
  const filteredRecords = productionRecordsData.filter(record => 
    searchInObject(record, searchTerm)
  );

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Manufacturing</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Track production records and material usage</p>
      </div>

      <div className="flex flex-row sm:items-center sm:justify-start gap-3">
        <Button className="w-1/4 sm:w-auto text-xs sm:text-sm border border-border">
          <Plus className="h-4 w-4" /> New
        </Button>
        <div className="relative flex w-3/4 sm:w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, design, fabric, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex w-full pl-10 text-xs sm:text-sm"
          />
        </div>
      </div>
      {filteredRecords.length > 0 ? (
        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.production_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <CardTitle className="text-sm sm:text-base">
                    Production {record.production_id}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(record.status)}
                    <Badge variant="outline">Design {record.design_no}</Badge>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Production Date: {new Date(record.production_date).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Cost Summary - Mobile */}
                <div className="md:hidden grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="font-bold text-sm text-primary">৳{record.total_production_cost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm">৳{record.labor_cost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Labor</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm">৳{record.overhead_cost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Overhead</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm">{getTotalQuantity(record.total_manufactured_quantity)}</div>
                    <div className="text-xs text-muted-foreground">Units</div>
                  </div>
                </div>

                {/* Cost Summary - Desktop */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="font-bold text-lg text-primary">৳{record.total_production_cost.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">৳{record.labor_cost.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Labor Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">৳{record.overhead_cost.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Overhead</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">৳{getTotalQuantity(record.total_manufactured_quantity)}</div>
                    <div className="text-sm text-muted-foreground">Total Units</div>
                  </div>
                </div>

                {/* Fabric Requirements */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1 text-sm sm:text-base">
                    <Package className="h-4 w-4" />
                    Fabric Requirements
                  </h4>
                  <div className="space-y-2">
                    {record.fabric_requirements.map((fabric, index) => (
                      <div key={index} className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                          <div className="font-medium text-sm sm:text-base">
                            {fabric.fabric_type} - {fabric.color}
                            <span className="text-muted-foreground text-xs ml-2">({fabric.fabric_sl_no})</span>
                          </div>
                          <div className="font-medium text-xs sm:text-sm">
                            Total: {fabric.total_fabric_used} units
                          </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2 text-xs">
                          {Object.entries(fabric.quantity_per_unit).map(([size, qty]) => (
                            <div key={size} className="text-center p-1 bg-background rounded">
                              <div className="font-medium uppercase text-xs">{size}</div>
                              <div className="text-muted-foreground text-xs">{qty} units</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accessory Requirements */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1 text-sm sm:text-base">
                    <ShoppingBag className="h-4 w-4" />
                    Accessory Requirements
                  </h4>
                  <div className="space-y-2">
                    {record.accessory_requirements.map((accessory, index) => (
                      <div key={index} className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                          <div className="font-medium text-sm sm:text-base">
                            {accessory.accessory_type}
                            <span className="text-muted-foreground text-xs ml-2">({accessory.accessory_sl_no})</span>
                          </div>
                          <div className="font-medium text-xs sm:text-sm">
                            Total: {accessory.total_accessories_used} units
                          </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2 text-xs">
                          {Object.entries(accessory.quantity_per_unit).map(([size, qty]) => (
                            <div key={size} className="text-center p-1 bg-background rounded">
                              <div className="font-medium uppercase text-xs">{size}</div>
                              <div className="text-muted-foreground text-xs">{qty} units</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Production Quantities */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1 text-sm sm:text-base">
                    <Truck className="h-4 w-4" />
                    Production Summary
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
                    {Object.entries(record.total_manufactured_quantity).map(([size, qty]) => (
                      <div key={size} className="p-2 bg-muted/50 rounded-lg text-center">
                        <div className="font-bold text-sm sm:text-base uppercase">{size}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Qty: {qty}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Cost: ৳{record.per_manufacture_cost[size as keyof typeof record.per_manufacture_cost]?.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground text-sm">
            {searchTerm 
              ? `No production records match your search "${searchTerm}"`
              : "No production records found"}
          </p>
        </Card>
      )}
    </div>
  );
}