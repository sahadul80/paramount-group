'use client'
import { Loader, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import TopBar from "../components/Demand/TopBar";
import ConcernSection from "../components/Demand/ConcernSection";
import ProductSection from "../components/Demand/ProductSection";
import SelectedProductsList from "../components/Demand/SelectedProductsList";
import SuccessModal from "../components/Demand/SuccessModal";
import { 
    Products,
    OrderEntry,
    DemandSummary,
    formatDateTime 
  } from "./types";

export default function Demand() {
  const router = useRouter();
  const { toast } = useToast();
  const [concerns, setConcerns] = useState<string[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [orderItems, setOrderItems] = useState<{ product: string; quantity: number; uom: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchConcern, setSearchConcern] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedDemand, setSubmittedDemand] = useState<DemandSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {

      if (typeof window === 'undefined') return;

      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      
      if (!token || !user || !role) {
        router.push("/login");
        return;
      }

      if (role != "demand") {
        router.push("/login");
        return;
      }
  
      try {
        const response = await fetch("/api/validate-token", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ user })
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Validation failed", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
  
    validateToken();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/demand');
        setConcerns(res.data.concerns);
        setProducts(res.data.products);
      } catch (error) {
        toast({
          title: "Loading Error",
          description: "Failed to load concerns and products",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const filteredProducts = products.filter(p=>
    p.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConcerns = concerns.filter(c =>
    c.toLowerCase().includes(searchConcern.toLowerCase())
  );

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = Math.max(0, quantity);
    setOrderItems(updatedItems);
  };

  const handleProductSelect = (product: Products) => {
    const existingIndex = orderItems.findIndex(item => item.product === product.product);
    
    if (existingIndex !== -1) {
      const updatedItems = [...orderItems];
      updatedItems.splice(existingIndex, 1);
      setOrderItems(updatedItems);
    } else {
      setOrderItems([...orderItems, { 
        product: product.product, 
        quantity: 1,
        uom: product.uom
      }]);
    }
  };

  const handleConcernSelect = (concern: string) => {
    if (searchConcern === concern) {
      setSearchConcern('');
      setOrderItems([]);
    } else {
      setSearchConcern(concern);
    }
  };

  const handleRemoveProduct = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  const handleSubmit = async () => {
    if (!searchConcern) {
      toast({
        title: "Missing Concern",
        description: "Please select a concern",
        variant: "destructive"
      });
      return;
    }

    const data: OrderEntry[] = orderItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        concern: searchConcern,
        product: item.product,
        quantity: item.quantity,
      }));

    if (data.length === 0) {
      toast({
        title: "No Products",
        description: "Please add at least one product with quantity",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/demand', data);
      
      setSubmittedDemand({
        concern: searchConcern,
        products: [...orderItems.filter(item => item.quantity > 0)],
        timestamp: new Date()
      });
      
      setShowSuccessModal(true);
      setOrderItems([]);
      setSearchTerm('');
      setSearchConcern('');
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit demand",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getBase64ImageFromURL = async (imageUrl: string): Promise<string> => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  function addFooter(doc: jsPDF, url: string = "https://paramount-group-five.vercel.app/demand") {
    const pageCount = (doc as any).getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const sideMargin = 20;
  
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 10;
  
      doc.setLineWidth(0.2);
      doc.line(sideMargin, footerY - 5, pageWidth - sideMargin, footerY - 5);
  
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
  
      doc.text(`${url}`, sideMargin, footerY);
      doc.text(`Page ${i} / ${pageCount}`, pageWidth - sideMargin, footerY, {
        align: "right",
      });
    }
  }      
  
  const handleDownloadPDF = async () => {
    if (!submittedDemand) return;
  
    const concern = submittedDemand.concern || "Unknown";
  
    const now = new Date();
    const formattedDate = now
      .toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const sanitizedConcern = concern.replace(/[^a-z0-9]/gi, "_");
    const filename = `${sanitizedConcern}_demand_${formattedDate}.pdf`;
  
    const doc = new jsPDF();
  
    const logoBase64 = await getBase64ImageFromURL("/logo.png");
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoSize = 20;
    const sideMargin = 20;
    const topMargin = 15;
  
    doc.addImage(logoBase64, "PNG", sideMargin, topMargin, logoSize, logoSize);
  
    const addressLines = [
      "Paramount Agro Ltd.",
      "House 22, Road 113A, Gulshan 2",
      "Dhaka 1212",
      "Bangladesh",
    ];
  
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(addressLines, pageWidth - sideMargin, topMargin + 2, {
      align: "right",
    });
  
    const headerBottomY = topMargin + logoSize + 5;
    doc.setLineWidth(0.3);
    doc.line(sideMargin, headerBottomY, pageWidth - sideMargin, headerBottomY);
  
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Demand Submission Report", pageWidth / 2, headerBottomY + 10, {
      align: "center",
    });
  
    let currentY = headerBottomY + 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Concern:", sideMargin, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(concern, sideMargin + 35, currentY);
  
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Submitted At:", sideMargin, currentY);
    doc.setFont("helvetica", "bold");
    doc.text("Date:" + formatDateTime(submittedDemand.timestamp).date || "-", sideMargin + 35, currentY);
    doc.text("Time: " + formatDateTime(submittedDemand.timestamp).time || "-", sideMargin + 35, currentY+8);
  
    autoTable(doc, {
      startY: currentY + 12,
      head: [["#", "Product", "Quantity", "UoM"]],
      body: submittedDemand.products.map((item, index) => [
        index + 1,
        item.product,
        item.quantity,
        item.uom,
      ]),
      styles: {
        fontSize: 11,
        cellPadding: 2.5,
      },
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: sideMargin, right: sideMargin },
    });
  
    addFooter(doc);
  
    doc.save(filename);
  };      

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSubmittedDemand(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-sm rounded-lg border-0 bg-white dark:bg-gray-800">
        <CardHeader className="flex items-center p-2 sm:p-4">
          <CardTitle className="text-lg font-bold">
            Production Demand
          </CardTitle>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin text-indigo-600 h-6 w-6" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConcernSection 
                  searchConcern={searchConcern}
                  setSearchConcern={setSearchConcern}
                  filteredConcerns={filteredConcerns}
                  handleConcernSelect={handleConcernSelect}
                />

                <ProductSection 
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filteredProducts={filteredProducts}
                  orderItems={orderItems}
                  handleProductSelect={handleProductSelect}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <h3 className="font-medium text-sm sm:text-base mb-3 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Selected Products
                </h3>

                {orderItems.length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed rounded text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="mt-2 text-gray-500">No products selected</p>
                    <p className="text-xs text-gray-400 mt-1">Search and add products above</p>
                  </div>
                ) : (
                  <SelectedProductsList 
                    orderItems={orderItems}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveProduct={handleRemoveProduct}
                  />
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || orderItems.length === 0 || !searchConcern}
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 text-sm sm:text-base rounded-md"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin h-4 w-4" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Submit Demand</span>
                  </div>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {showSuccessModal && submittedDemand && (
        <SuccessModal 
          submittedDemand={submittedDemand}
          handleDownloadPDF={handleDownloadPDF}
          closeSuccessModal={closeSuccessModal}
        />
      )}
    </div>
  );
}