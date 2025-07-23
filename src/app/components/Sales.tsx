"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Receipt, ShoppingCart, Users, Package, Plus, Search } from "lucide-react";

const customerOrdersData = [
  {
    order_id: "SO001",
    customer_name: "Fashion Boutique Delhi",
    customer_phone: "+91-9876543212",
    customer_email: "orders@fashionboutique.com",
    order_date: "2024-02-01",
    items: [
      {
        finished_good_id: "FG001",
        design_no: "DS001",
        size: "M",
        quantity: 3,
        unit_price: 78.00,
        total_amount: 234.00
      },
      {
        finished_good_id: "FG001",
        design_no: "DS001",
        size: "L",
        quantity: 5,
        unit_price: 82.00,
        total_amount: 410.00
      }
    ],
    total_order_amount: 644.00,
    payment_status: "paid",
    delivery_status: "delivered",
    delivery_date: "2024-02-05"
  },
  {
    order_id: "SO002",
    customer_name: "Style Studio Mumbai",
    customer_phone: "+91-9876543213",
    customer_email: "orders@stylestudio.com",
    order_date: "2024-02-03",
    items: [
      {
        finished_good_id: "FG002",
        design_no: "DS002",
        size: "S",
        quantity: 2,
        unit_price: 85.00,
        total_amount: 170.00
      }
    ],
    total_order_amount: 170.00,
    payment_status: "pending",
    delivery_status: "processing",
    delivery_date: null
  }
];

const fabricSalesData = [
  {
    sale_id: "FS001",
    customer_name: "Local Tailor Shop",
    fabric_sl_no: "F001",
    fabric_type: "Cotton Blend",
    color: "Navy Blue",
    sale_date: "2024-02-10",
    quantity_sold: 25,
    unit_price: 35.00,
    total_amount: 875.00,
    payment_status: "paid"
  },
  {
    sale_id: "FS002",
    customer_name: "Design House Kolkata",
    fabric_sl_no: "F002",
    fabric_type: "Silk",
    color: "Ivory",
    sale_date: "2024-02-12",
    quantity_sold: 30,
    unit_price: 42.00,
    total_amount: 1260.00,
    payment_status: "pending"
  }
];

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("orders");

  const getStatusBadge = (status: string, type: 'payment' | 'delivery') => {
    const config = {
      payment: {
        paid: { label: "Paid", variant: "secondary" as const },
        pending: { label: "Pending", variant: "outline" as const },
        overdue: { label: "Overdue", variant: "destructive" as const }
      },
      delivery: {
        delivered: { label: "Delivered", variant: "secondary" as const },
        processing: { label: "Processing", variant: "outline" as const },
        shipped: { label: "Shipped", variant: "outline" as const },
        pending: { label: "Pending", variant: "outline" as const }
      }
    };
    
    const statusConfig = config[type][status as keyof typeof config[typeof type]];
    return (
      <Badge variant={statusConfig?.variant || "secondary"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  // Filter customer orders based on search term
  const filteredCustomerOrders = customerOrdersData.filter(order => 
    Object.values(order).some(val => {
      if (Array.isArray(val)) {
        return val.some(item => 
          Object.values(item).some(itemVal => 
            String(itemVal).toLowerCase().includes(searchTerm.toLowerCase())
        ));
      }
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    })
  );
  
  // Filter fabric sales based on search term
  const filteredFabricSales = fabricSalesData.filter(sale => 
    Object.values(sale).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
  ));

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex gap-3 flex-row sm:items-center sm:justify-between">
        <div className="w-3/4 sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Sales</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Track customer orders and fabric sales</p>
        </div>
        <Button className="w-1/4 sm:w-auto text-xs sm:text-sm border border-border">
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 h-10 text-xs sm:text-sm gap-1">
          <TabsTrigger value="orders" className="flex items-center gap-1">
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="fabric-sales" className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Fabric
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by ID, customer, item, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-xs sm:text-sm"
              />
            </div>
            
            {filteredCustomerOrders.length > 0 ? (
              <div className="grid gap-3">
                {filteredCustomerOrders.map((order) => (
                  <Card key={order.order_id} className="p-3 hover:shadow-md transition-shadow">
                    <CardHeader className="p-0 mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <CardTitle className="text-sm sm:text-base">Order {order.order_id}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          {getStatusBadge(order.payment_status, 'payment')}
                          {getStatusBadge(order.delivery_status, 'delivery')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs sm:text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Customer</p>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-muted-foreground">{order.customer_email}</p>
                          <p className="text-muted-foreground">{order.customer_phone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Order Details</p>
                          <p>Date: {new Date(order.order_date).toLocaleDateString()}</p>
                          <p className="font-medium">Total: ৳{order.total_order_amount.toFixed(2)}</p>
                          {order.delivery_date && (
                            <p>Delivered: {new Date(order.delivery_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-medium text-xs sm:text-sm">Order Items:</p>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs sm:text-sm">
                            <div>
                              <span className="font-medium">{item.design_no}</span>
                              <span className="text-muted-foreground ml-2">Size: {item.size}</span>
                              <span className="text-muted-foreground ml-2">Qty: {item.quantity}</span>
                            </div>
                            <div className="font-medium">
                            ৳{item.total_amount.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center">
                <p className="text-muted-foreground text-sm">
                  No orders match your search "{searchTerm}"
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fabric-sales">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fabric sales by ID, customer, fabric type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-xs sm:text-sm"
              />
            </div>

            {/* Mobile Fabric Sales List */}
            <div className="md:hidden space-y-3">
              {filteredFabricSales.length > 0 ? (
                filteredFabricSales.map((sale) => (
                  <Card key={sale.sale_id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{sale.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{sale.sale_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">৳{sale.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm">{sale.fabric_type}</div>
                      <div className="text-xs text-muted-foreground">Color: {sale.color}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Qty: </span>
                        {sale.quantity_sold}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price: </span>
                        ৳{sale.unit_price.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      {getStatusBadge(sale.payment_status, 'payment')}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    No fabric sales match your search "{searchTerm}"
                  </p>
                </Card>
              )}
            </div>

            {/* Desktop Fabric Sales Table */}
            <Card className="hidden md:block">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Fabric Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredFabricSales.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-sm">
                        <TableHead>Sale ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Fabric</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFabricSales.map((sale) => (
                        <TableRow key={sale.sale_id} className="text-xs sm:text-sm">
                          <TableCell className="font-medium">{sale.sale_id}</TableCell>
                          <TableCell>{sale.customer_name}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.fabric_type}</div>
                              <div className="text-muted-foreground text-xs">{sale.color}</div>
                            </div>
                          </TableCell>
                          <TableCell>{sale.quantity_sold}</TableCell>
                          <TableCell>৳{sale.unit_price.toFixed(2)}</TableCell>
                          <TableCell>৳{sale.total_amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(sale.payment_status, 'payment')}</TableCell>
                          <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground">
                      No fabric sales match your search "{searchTerm}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}