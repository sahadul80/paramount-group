"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Package, Archive, ShoppingBag, Plus, Search } from "lucide-react";

type SizeData = {
  initial: number;
  available: number;
  sold: number;
};

// Sample data based on your JSON structure
const fabricData = [
  {
    sl_no: "F001",
    swatch_code: "SW001",
    fabric_type: "Cotton Blend",
    color: "Navy Blue",
    initial_quantity: 150,
    available_quantity: 120,
    unit_cost_price: 25.50,
    total_cost: 3825.00,
    location: "Anita's"
  },
  {
    sl_no: "F002",
    swatch_code: "SW002",
    fabric_type: "Silk",
    color: "Ivory",
    initial_quantity: 200,
    available_quantity: 180,
    unit_cost_price: 30.00,
    total_cost: 6000.00,
    location: "Anita's"
  },
  {
    sl_no: "F003",
    swatch_code: "SW003",
    fabric_type: "Polyester",
    color: "Black",
    initial_quantity: 300,
    available_quantity: 280,
    unit_cost_price: 22.00,
    total_cost: 6600.00,
    location: "Warehouse"
  }
];

const finishedGoodsData = [
  {
    sl_no: "FG001",
    design_no: "DS001",
    dispo_no: "D001",
    sizes: {
      s: { initial: 20, available: 18, sold: 2 },
      m: { initial: 25, available: 22, sold: 3 },
      l: { initial: 30, available: 25, sold: 5 },
      xl: { initial: 20, available: 18, sold: 2 }
    },
    location: "Anita's"
  },
  {
    sl_no: "FG002",
    design_no: "DS002",
    dispo_no: "D002",
    sizes: {
      s: { initial: 15, available: 13, sold: 2 },
      m: { initial: 20, available: 18, sold: 2 },
      l: { initial: 25, available: 22, sold: 3 },
      xl: { initial: 15, available: 13, sold: 2 }
    },
    location: "Warehouse"
  }
];

const accessoriesData = [
  {
    sl_no: "A001",
    type: "Buttons",
    initial_quantity: 1000,
    available_quantity: 800,
    cost_per_unit: 0.50,
    total_cost: 500.00,
    location: "Anita's"
  },
  {
    sl_no: "A002",
    type: "Zippers",
    initial_quantity: 500,
    available_quantity: 450,
    cost_per_unit: 2.00,
    total_cost: 1000.00,
    location: "Anita's"
  }
];

export default function Inventory() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getStockStatus = (available: number, initial: number) => {
    const percentage = (available / initial) * 100;
    if (percentage <= 10) return { label: "Critical", color: "destructive" };
    if (percentage <= 30) return { label: "Low", color: "warning" };
    return { label: "Good", color: "success" };
  };

  // Fixed: Properly typed search function
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

  // Filter data based on location and search term
  const filterItems = (items: any[]) => {
    return items.filter(item => {
      const locationMatch = selectedLocation === "all" || 
                           item.location.toLowerCase().includes(selectedLocation);
      const searchMatch = searchTerm === "" || searchInObject(item, searchTerm);
      return locationMatch && searchMatch;
    });
  };

  const filteredFabric = filterItems(fabricData);
  const filteredFinishedGoods = filterItems(finishedGoodsData);
  const filteredAccessories = filterItems(accessoriesData);

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage fabric, finished goods, and accessories</p>
        </div>
        <div className="flex flex-row items-center tracking-tight">
          <Button className="hover:bg-black/20 dark:hover:bg-white/20">
            Operations
          </Button>
          <Button className="hover:bg-black/20 dark:hover:bg-white/20">
            Reporting
          </Button>
        </div>
        <Button className="text-xs sm:text-sm border border-border">
          <Plus className="h-4 w-4 mr-1" /> New Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-row gap-2 sm:gap-3">
        <div className="relative w-3/5 sm:w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by type, color, design, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full text-xs sm:text-sm"
          />
        </div>
        <div className="flex w-2/5 sm:w-1/3">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="text-xs sm:text-sm border border-border">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-md bg-black/10">
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="anita's">Anita's</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="nine2five">Nine2Five</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="fabric" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-10 text-xs sm:text-xs sm:gap-1">
          <TabsTrigger value="fabric" className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Fabric
          </TabsTrigger>
          <TabsTrigger value="finished" className="flex items-center gap-1">
            <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Finished
          </TabsTrigger>
          <TabsTrigger value="accessories" className="flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Accessory
          </TabsTrigger>
          <TabsTrigger value="raw_material" className="flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Raw Material
          </TabsTrigger>
        </TabsList>

        {/* Fabric Tab */}
        <TabsContent value="fabric">
          {filteredFabric.length > 0 ? (
            <div className="grid gap-3">
              {filteredFabric.map((item) => (
                <Card key={item.sl_no} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base">
                        {item.fabric_type} - {item.color}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">{item.location}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Swatch</p>
                        <p className="font-medium">{item.swatch_code}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Stock</p>
                        <p className="font-medium">{item.available_quantity}/{item.initial_quantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Unit Cost</p>
                        <p className="font-medium">৳{item.unit_cost_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Status</p>
                        <Badge 
                          variant={getStockStatus(item.available_quantity, item.initial_quantity).color as any}
                          className="text-xs"
                        >
                          {getStockStatus(item.available_quantity, item.initial_quantity).label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {searchTerm || selectedLocation !== "all"
                  ? `No fabric matches your search`
                  : "No fabric inventory found"}
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Finished Goods Tab */}
        <TabsContent value="finished">
          {filteredFinishedGoods.length > 0 ? (
            <div className="grid gap-3">
              {filteredFinishedGoods.map((item) => (
                <Card key={item.sl_no} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base">
                        Design {item.design_no}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">{item.location}</Badge>
                        <Badge variant="outline" className="text-xs">Dispo: {item.dispo_no}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="mb-3">
                      <p className="text-muted-foreground text-xs mb-1">SL No: {item.sl_no}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(item.sizes).map(([size, data]) => {
                        const sizeInfo = data as SizeData;
                        return (
                          <div key={size} className="p-2 bg-muted/50 rounded-lg text-center">
                            <div className="font-medium text-xs sm:text-sm uppercase">{size}</div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div className="text-muted-foreground">Avail:</div>
                              <div>{sizeInfo.available}</div>
                              <div className="text-muted-foreground">Sold:</div>
                              <div>{sizeInfo.sold}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {searchTerm || selectedLocation !== "all"
                  ? `No finished goods match your search`
                  : "No finished goods inventory found"}
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Accessories Tab */}
        <TabsContent value="accessories">
          {filteredAccessories.length > 0 ? (
            <div className="grid gap-3">
              {filteredAccessories.map((item) => (
                <Card key={item.sl_no} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base">{item.type}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{item.location}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">SL No</p>
                        <p className="font-medium">{item.sl_no}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Stock</p>
                        <p className="font-medium">{item.available_quantity}/{item.initial_quantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Unit Cost</p>
                        <p className="font-medium">৳{item.cost_per_unit.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Status</p>
                        <Badge 
                          variant={getStockStatus(item.available_quantity, item.initial_quantity).color as any}
                          className="text-xs"
                        >
                          {getStockStatus(item.available_quantity, item.initial_quantity).label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {searchTerm || selectedLocation !== "all"
                  ? `No accessories match your search`
                  : "No accessories inventory found"}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}