import { CheckCircle, Download } from "lucide-react";
import { Button } from "../ui/button";
import { DemandSummary } from "@/app/demand/page";
import { formatDateTime } from "@/app/demand/page";

export default function SuccessModal({
    submittedDemand,
    handleDownloadPDF,
    closeSuccessModal,
  }: {
    submittedDemand: DemandSummary;
    handleDownloadPDF: () => void;
    closeSuccessModal: () => void;
  }) {
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl relative flex flex-col max-h-[90vh]">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm p-2 border border-border text-indigo-600 hover:text-indigo-900 hover:cursor-pointer dark:invert"
            onClick={handleDownloadPDF}
          >
            <Download />
            <span className="hidden sm:inline">.pdf</span>
          </Button>
        </div>

        <div className="p-6 pt-12 flex flex-col flex-grow overflow-hidden">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-center mb-4">
            Demand Submitted Successfully!
          </h2>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Concern:</span>
              <span className="font-semibold text-sm">{submittedDemand.concern}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Submitted At:</span>
              <div className="text-xs font-semibold text-right">
                <div>Date: {formatDateTime(submittedDemand.timestamp).date}</div>
                <div>Time: {formatDateTime(submittedDemand.timestamp).time}</div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex-grow flex flex-col overflow-hidden">
            <div className="text-sm mb-1">
              <div className="flex justify-between pb-1 border-b">
                <div className="flex">
                  <h3 className="font-semibold w-8">Sl.</h3>
                  <h3 className="font-semibold">Products</h3>
                </div>
                <div className="flex flex-row gap-2">
                  <h3 className="font-semibold">Quantity</h3>
                  <h3 className="font-semibold">UoM</h3>
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-grow">
              {submittedDemand.products.map((item, index) => (
                <div 
                  key={index} 
                  className="flex justify-between pb-1 border-b text-sm"
                >
                  <div className="flex">
                    <span className="w-8">{index + 1}.</span>
                    <span>{item.product}</span>
                  </div>
                  <div className="flex flex-row gap-2">
                    <span className="w-12 text-right">{item.quantity}</span>
                    <span className="w-8">{item.uom}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button
            onClick={closeSuccessModal}
            className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}