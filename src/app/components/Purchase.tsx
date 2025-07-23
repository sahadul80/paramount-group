"use client"
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Plus, Search, ShoppingCart, Users } from "lucide-react";

const vendorsData = [
  {
    vendor_id: "V001",
    name: "Textile Solutions Ltd",
    address: "123 Industrial Area, Sector 15, Gurgaon, Haryana 122001",
    phone: "+91-124-4567890",
    mobile: "+91-9876543210",
    email: "contact@textilesolutions.com",
    website: "www.textilesolutions.com"
  },
  {
    vendor_id: "V002",
    name: "Fashion Accessories Co",
    address: "456 Market Street, Karol Bagh, New Delhi 110005",
    phone: "+91-11-2345678",
    mobile: "+91-9876543211",
    email: "sales@fashionaccessories.com",
    website: "www.fashionaccessories.com"
  }
];

const purchaseOrdersData = [
  {
    purchase_id: "P001",
    vendor_name: "Textile Solutions Ltd",
    item_type: "Fabric",
    item_description: "Cotton Blend - Navy Blue",
    purchase_date: "2024-01-15",
    quantity_purchased: 50,
    unit_cost: 25.50,
    total_amount: 1275.00,
    payment_status: "paid",
    delivery_status: "delivered",
    invoice_number: "INV-2024-001"
  },
  {
    purchase_id: "P002",
    vendor_name: "Textile Solutions Ltd",
    item_type: "Fabric",
    item_description: "Silk - Ivory",
    purchase_date: "2024-01-18",
    quantity_purchased: 75,
    unit_cost: 30.00,
    total_amount: 2250.00,
    payment_status: "pending",
    delivery_status: "in_transit",
    invoice_number: "INV-2024-002"
  },
  {
    purchase_id: "AP001",
    vendor_name: "Fashion Accessories Co",
    item_type: "Accessories",
    item_description: "Buttons - Metal",
    purchase_date: "2024-01-10",
    quantity_purchased: 500,
    unit_cost: 0.50,
    total_amount: 250.00,
    payment_status: "paid",
    delivery_status: "delivered",
    invoice_number: "ACC-INV-001"
  }
];

export default function Purchase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("orders")

  const getStatusBadge = (status: string, type: 'payment' | 'delivery') => {
    const config = {
      payment: {
        paid: { label: "Paid", variant: "secondary" as const },
        pending: { label: "Pending", variant: "outline" as const },
        overdue: { label: "Overdue", variant: "destructive" as const }
      },
      delivery: {
        delivered: { label: "Delivered", variant: "secondary" as const },
        in_transit: { label: "In Transit", variant: "outline" as const },
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
   // Filter orders based on search term (any attribute)
   const filteredOrders = purchaseOrdersData.filter(order => 
    Object.values(order).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  // Filter vendors based on search term (any attribute)
  const filteredVendors = vendorsData.filter(vendor => 
    Object.values(vendor).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex gap-3 flex-row sm:items-center sm:justify-between">
        <div className="w-3/4 sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Purchase</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage vendors and purchases</p>
        </div>
        <Button className="w-1/4 sm:w-auto text-xs sm:text-sm border border-border">
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="w-full grid grid-cols-2 h-10 text-xs sm:text-sm gap-1">
          <TabsTrigger value="orders" className="flex items-center gap-1">
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Vendors
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="space-y-2 sm:space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by ID, vendor, item, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-xs sm:text-sm"
              />
            </div>

            {/* Mobile Orders List */}
            <div className="md:hidden space-y-3">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <Card key={order.purchase_id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{order.vendor_name}</div>
                        <div className="text-xs text-muted-foreground">{order.purchase_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">৳{order.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.purchase_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm">{order.item_description}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.quantity_purchased} units • {order.item_type}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs">
                        {getStatusBadge(order.payment_status, "payment")}
                      </div>
                      <div className="text-xs">
                        {getStatusBadge(order.delivery_status, "delivery")}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    No orders match your search "{searchTerm}"
                  </p>
                </Card>
              )}
            </div>

            {/* Desktop Table */}
            <Card className="hidden md:block">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-sm">
                        <TableHead>Order ID</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.purchase_id} className="text-xs sm:text-sm">
                          <TableCell>{order.purchase_id}</TableCell>
                          <TableCell>{order.vendor_name}</TableCell>
                          <TableCell>
                            <div>
                              <div>{order.item_description}</div>
                              <div className="text-muted-foreground text-xs">{order.item_type}</div>
                            </div>
                          </TableCell>
                          <TableCell>{order.quantity_purchased}</TableCell>
                          <TableCell>৳{order.total_amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(order.payment_status, "payment")}</TableCell>
                          <TableCell>{getStatusBadge(order.delivery_status, "delivery")}</TableCell>
                          <TableCell>{new Date(order.purchase_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground">
                      No orders match your search "{searchTerm}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-row sm:items-center sm:justify-between gap-2">
              <div className="relative w-3/4 sm:w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors by name, ID, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full text-xs sm:text-sm"
                />
              </div>
              <Button className="w-1/4 text-xs sm:text-sm border border-border">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            <div className="grid gap-3">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <Card key={vendor.vendor_id} className="p-3 sm:p-4">
                    <CardHeader className="p-0 mb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm sm:text-base">{vendor.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{vendor.vendor_id}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="text-sm mb-2">
                        <div className="font-medium">Contact:</div>
                        <div className="text-muted-foreground">{vendor.mobile}</div>
                        <div className="text-muted-foreground">{vendor.email}</div>
                      </div>
                      
                      <div className="text-xs sm:text-sm">
                        <div className="font-medium mt-2">Address:</div>
                        <div className="text-muted-foreground">{vendor.address}</div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="text-xs flex-1">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs flex-1">
                          Orders
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    No vendors match your search "{searchTerm}"
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}