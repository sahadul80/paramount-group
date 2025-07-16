import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Package, ShoppingCart, Receipt, Truck, Users, Box, Layers } from "lucide-react";
import { Badge } from "./ui/badge"

const statsData = [
  {
    title: "Total Inventory Items",
    value: "1,247",
    change: "+12.5%",
    icon: Package,
    color: "text-primary"
  },
  {
    title: "Purchase Orders",
    value: "89",
    change: "+8.2%",
    icon: ShoppingCart,
    color: "text-info"
  },
  {
    title: "Sales Orders",
    value: "156",
    change: "+15.3%",
    icon: Receipt,
    color: "text-success"
  },
  {
    title: "Manufacturing Orders",
    value: "23",
    change: "+5.1%",
    icon: Truck,
    color: "text-warning"
  },
  {
    title: "Active Customers",
    value: "42",
    change: "+9.7%",
    icon: Users,
    color: "text-purple-500"
  },
  {
    title: "Vendors",
    value: "28",
    change: "+3.4%",
    icon: Box,
    color: "text-orange-500"
  }
];

const inventoryByLocation = [
  { location: "Anita's", fabric: 150, finished: 120, accessories: 800 },
  { location: "Warehouse", fabric: 300, finished: 90, accessories: 2000 },
  { location: "Nine2Five", fabric: 180, finished: 76, accessories: 800 }
];

const inventoryByType = [
  { type: "Fabric", value: 630, color: "bg-blue-500" },
  { type: "Finished Goods", value: 286, color: "bg-green-500" },
  { type: "Accessories", value: 3600, color: "bg-purple-500" }
];

const recentSales = [
  { id: "SO-001", customer: "Fashion Boutique", amount: "৳644.00", status: "Delivered" },
  { id: "SO-002", customer: "Style Studio", amount: "৳1,250.00", status: "Processing" },
  { id: "SO-003", customer: "Design House", amount: "৳875.00", status: "Shipped" },
  { id: "SO-004", customer: "Urban Trends", amount: "৳2,340.00", status: "Delivered" }
];

export default function Dashboard() {
  const totalInventory = inventoryByType.reduce((sum, item) => sum + item.value, 0);

  const getBadgeVariant = (status: string) => {
    if (status === "Delivered") return "secondary";
    if (status === "Processing") return "outline";
    return "default"; // Use "default" for other statuses
  };

  return (
    <div className="space-y-6 px-2 sm:px-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Welcome to your textile ERP system</p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statsData.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventory Overview - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Inventory by Location - Card */}
        <Card className="flex flex-col h-full">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Inventory by Location</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 sm:p-4 pt-0">
            <div className="space-y-3">
              {inventoryByLocation.map((location) => (
                <div key={location.location} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-xs sm:text-sm">{location.location}</div>
                  <div className="flex gap-2 sm:gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{location.fabric}</div>
                      <div className="text-muted-foreground">Fabric</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{location.finished}</div>
                      <div className="text-muted-foreground">Finished Goods</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{location.accessories}</div>
                      <div className="text-muted-foreground">Accessories</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Distribution by Type - Card */}
        <Card className="flex flex-col h-full">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Inventory Distribution by Type</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Pie Chart Visualization */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                <div className="absolute inset-0 rounded-full border-8 border-blue-500" 
                     style={{ clipPath: `inset(0 0 0 50%)` }}></div>
                <div className="absolute inset-0 rounded-full border-8 border-green-500" 
                     style={{ clipPath: `inset(0 0 ${100 - (inventoryByType[1].value / totalInventory * 100)}% 50%)` }}></div>
                <div className="absolute inset-0 rounded-full border-8 border-purple-500" 
                     style={{ clipPath: `inset(${inventoryByType[0].value / totalInventory * 100}% 50% 0 0)` }}></div>
                <div className="absolute inset-4 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-bold">{totalInventory}</span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="space-y-2 flex-1">
                {inventoryByType.map((item, index) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-sm ${item.color}`}></div>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-muted-foreground ml-2">
                        ({Math.round(item.value / totalInventory * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Sales - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activities - Card */}
        <Card className="flex flex-col h-full">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 sm:p-4 pt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1 text-xs sm:text-sm">
                  <div className="font-medium">New purchase order PO-2024-001</div>
                  <div className="text-muted-foreground">2 hours ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1 text-xs sm:text-sm">
                  <div className="font-medium">Manufacturing order completed</div>
                  <div className="text-muted-foreground">4 hours ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <div className="flex-1 text-xs sm:text-sm">
                  <div className="font-medium">Low stock alert: Cotton Blend</div>
                  <div className="text-muted-foreground">6 hours ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <div className="w-2 h-2 bg-info rounded-full"></div>
                <div className="flex-1 text-xs sm:text-sm">
                  <div className="font-medium">New customer registered: Urban Trends</div>
                  <div className="text-muted-foreground">1 day ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales Orders - Card */}
        <Card className="flex flex-col h-full">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Recent Sales Orders</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 sm:p-4 pt-0">
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div>
                    <div className="font-medium text-xs sm:text-sm">{sale.id}</div>
                    <div className="text-muted-foreground text-xs">{sale.customer}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-xs sm:text-sm">{sale.amount}</div>
                    <Badge 
                      variant={getBadgeVariant(sale.status)}
                      className="text-xs"
                    >
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics - Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Production Efficiency - Card */}
        <Card className="flex flex-col h-full">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Production Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 sm:p-4 pt-0">
            <div className="space-y-4">
              {["Cutting", "Sewing", "Finishing", "Packaging"].map((stage) => (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>{stage}</span>
                    <span className="font-medium">{
                      Math.floor(Math.random() * 30) + 70
                    }%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.floor(Math.random() * 30) + 70}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Turnover - Card */}
        <Card className="flex flex-col h-full">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Inventory Turnover</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-3 sm:p-4 pt-0">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-success">5.2x</div>
                <p className="text-muted-foreground text-xs sm:text-sm">Annual Inventory Turnover</p>
                <p className="text-success text-xs sm:text-sm mt-1">+1.2x vs last year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}