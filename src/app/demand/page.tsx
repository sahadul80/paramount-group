'use client'
import { LogOut, Loader, X, Plus, CheckCircle, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface OrderEntry {
    concern: string;
    product: string;
    quantity: number;
}

interface DemandSummary {
    concern: string;
    products: { product: string; quantity: number }[];
    timestamp: string;
}

export default function Demand() {
    const router = useRouter();
    const { toast } = useToast();
    const [concerns, setConcerns] = useState<string[]>([]);
    const [products, setProducts] = useState<string[]>([]);
    const [selectedConcern, setSelectedConcern] = useState('');
    const [orderItems, setOrderItems] = useState<{ product: string; quantity: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchConcern, setSearchConcern] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [submittedDemand, setSubmittedDemand] = useState<DemandSummary | null>(null);

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

    const filteredProducts = products.filter(p =>
        p.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredConcerns = concerns.filter(c =>
        c.toLowerCase().includes(searchConcern.toLowerCase())
    );

    const handleQuantityChange = (index: number, quantity: number) => {
        const updatedItems = [...orderItems];
        if (quantity >= 0) {
            updatedItems[index].quantity = quantity;
            setOrderItems(updatedItems);
        }
    };

    const handleProductSelect = (product: string) => {
        if (!orderItems.find(item => item.product === product)) {
            setOrderItems([...orderItems, { product, quantity: 1 }]);
            setSearchTerm('');
        }
    };

    const handleRemoveProduct = (index: number) => {
        const updatedItems = [...orderItems];
        updatedItems.splice(index, 1);
        setOrderItems(updatedItems);
    };

    const handleSubmit = async () => {
        if (!selectedConcern) {
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
                concern: selectedConcern,
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
            
            // Store submitted demand for summary
            setSubmittedDemand({
                concern: selectedConcern,
                products: [...orderItems.filter(item => item.quantity > 0)],
                timestamp: new Date().toLocaleString()
            });
            
            // Show success modal
            setShowSuccessModal(true);
            
            // Reset form
            setOrderItems([]);
            setSelectedConcern('');
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

    const handleDownloadPDF = () => {
        if (!submittedDemand) return;
      
        const doc = new jsPDF();
      
        doc.setFontSize(14);
        doc.text("Demand Summary:", 20, 20);
      
        doc.setFontSize(12);
        doc.text(`Concern: ${submittedDemand.concern}`, 20, 30);
        doc.text(`Submitted At: ${submittedDemand.timestamp}`, 20, 40);
      
        autoTable(doc, {
          head: [["Product", "Quantity"]],
          body: submittedDemand.products.map((item) => [item.product, item.quantity]),
          startY: 50,
        });
      
        doc.save("demand-submission.pdf");
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        setSubmittedDemand(null);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        router.push("/login");
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4">
            {/* Fixed Top Bar */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-3 px-2 sm:px-4 flex justify-between items-center mb-2 sm:mb-4 border-b">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                    Demand Form
                </h1>
                <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-500/10 flex items-center gap-1 py-1 px-2"
                >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>

            <Card className="w-full max-w-2xl mx-auto shadow-sm rounded-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader className="p-2 sm:p-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg font-bold">
                            Production Demand
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader className="animate-spin text-indigo-600 h-6 w-6" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {/* Concern Section */}
                                <div className="space-y-2">
                                    <Label className="text-md" htmlFor="concern-search">Select Concern</Label>
                                    <div className="relative">
                                        <Input
                                            id="concern-search"
                                            type="text"
                                            value={searchConcern}
                                            onChange={e => setSearchConcern(e.target.value)}
                                            placeholder="Search concern..."
                                            className="pl-8 text-sm h-8 sm:h-9"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    <div className="border rounded-md overflow-hidden">
                                        <div className="max-h-30 overflow-y-auto">
                                            {filteredConcerns.map(c => (
                                                <button
                                                    key={c}
                                                    className={`block w-full text-left p-1 text-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedConcern === c
                                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-indigo-500'
                                                            : ''
                                                        }`}
                                                    onClick={() => setSelectedConcern(c)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{c}</span>
                                                        {selectedConcern === c && (
                                                            <div className="bg-indigo-500 rounded-full p-1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedConcern && (
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded p-3 flex items-center text-sm">
                                            <div className="bg-indigo-100 dark:bg-indigo-800/30 rounded-full p-1 mr-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium">Selected Concern</p>
                                                <p className="text-indigo-600 dark:text-indigo-300">{selectedConcern}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Product Section */}
                                <div className="space-y-2">
                                    <Label className="text-md" htmlFor="product-search">Add Products</Label>
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
                                            {filteredProducts.map(p => (
                                                <button
                                                    key={p}
                                                    className="block w-full text-left p-1 text-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                                    onClick={() => handleProductSelect(p)}
                                                >
                                                    <span>{p}</span>
                                                    <Plus className="h-3 w-3 text-gray-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
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
                                    <div className="space-y-2">
                                        {orderItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between bg-white dark:bg-gray-700/50 p-2 rounded-md border text-xs sm:text-sm"
                                            >
                                                <span className="font-medium truncate max-w-[50%]">{item.product}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center border rounded overflow-hidden">
                                                        <button
                                                            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                                            onClick={() => handleQuantityChange(index, Math.max(0, item.quantity - 0.5))}
                                                        >
                                                            -
                                                        </button>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step={0.5}
                                                            value={item.quantity}
                                                            onChange={e => handleQuantityChange(index, parseFloat(e.target.value))}
                                                            className="w-12 sm:w-14 text-center border-0 shadow-none text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <button
                                                            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                                            onClick={() => handleQuantityChange(index, item.quantity + 0.5)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:bg-red-500/10 h-6 w-6"
                                                        onClick={() => handleRemoveProduct(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || orderItems.length === 0 || !selectedConcern}
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

            {/* Success Modal */}
            {showSuccessModal && submittedDemand && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl relative">
                    {/* Download PDF Button */}
                    <div className="absolute top-4 right-4">
                        <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm text-indigo-600 hover:text-indigo-900 hover:cursor-pointer dark:invert"
                        onClick={handleDownloadPDF}
                        >
                        <Download className="w-6 h-6" />
                        <span className="hidden sm:inline">Download PDF</span>
                        </Button>
                    </div>

                    <div className="p-6 pt-12">
                        <div className="flex justify-center mb-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>

                        <h2 className="text-xl font-bold text-center mb-4">Demand Submitted Successfully!</h2>

                        <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Concern:</span>
                            <span className="font-semibold">{submittedDemand.concern}</span>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Submitted At:</span>
                            <span>{submittedDemand.timestamp}</span>
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between">
                            <h3 className="font-semibold border-b pb-2">Products:</h3>
                            <h3 className="font-semibold border-b pb-2">Quantity:</h3>
                            </div>
                            <div className="max-h-60 overflow-y-auto mt-2">
                            {submittedDemand.products.map((item, index) => (
                                <div key={index} className="flex justify-between py-2 border-b">
                                <span className="truncate max-w-[60%]">{item.product}</span>
                                <span className="font-medium">{item.quantity}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                        </div>

                        <Button
                        onClick={closeSuccessModal}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                        Close
                        </Button>
                    </div>
                    </div>
                </div>
                )}
        </div>
    );
}