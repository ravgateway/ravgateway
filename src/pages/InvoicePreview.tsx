import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  description: string;
  paid_at: string | null;
  tx_hash: string | null;
  network: string | null;
}

interface MerchantProfile {
  merchant_name: string;
  business_address: string | null;
  email: string;
}

const InvoicePreview = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchInvoiceData();
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    if (!invoiceId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      if (!invoiceData) {
        toast({
          title: "Invoice not found",
          variant: "destructive",
        });
        return;
      }

      setInvoice(invoiceData);
      setIsOwner(session?.user.id === invoiceData.merchant_id);

      const { data: merchantData, error: merchantError } = await supabase
        .from("profiles")
        .select("merchant_name, business_address, email")
        .eq("id", invoiceData.merchant_id)
        .single();

      if (merchantError) throw merchantError;
      setMerchant(merchantData);

    } catch (error: any) {
      toast({
        title: "Error loading invoice",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger browser print dialog with save as PDF option
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
          <Button onClick={() => navigate("/invoices")} className="mt-4">
            Back to Invoices
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      sent: "bg-blue-100 text-blue-700",
      viewed: "bg-yellow-100 text-yellow-700",
      paid: "bg-green-100 text-green-700",
      overdue: "bg-red-100 text-red-700",
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Action Bar - Hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(isOwner ? "/invoices" : -1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Content - Optimized for print */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 sm:p-12 print:shadow-none print:border-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 pb-8 border-b-2">
            <div>
              <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <img src="/rav-logo.png" alt="RAV" className="w-16 h-16" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {merchant.merchant_name}
              </h1>
              {merchant.business_address && (
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                  {merchant.business_address}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {merchant.email}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                INVOICE
              </h2>
              <p className="text-lg font-mono font-semibold">
                {invoice.invoice_number}
              </p>
              <Badge className={`mt-2 print:border print:border-current ${getStatusColor(invoice.status)}`}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Bill To & Dates */}
          <div className="grid sm:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                BILL TO
              </h3>
              <p className="font-semibold text-lg">{invoice.client_name}</p>
              <p className="text-sm text-muted-foreground">{invoice.client_email}</p>
            </div>

            <div className="sm:text-right">
              <div className="mb-3">
                <span className="text-sm text-muted-foreground">Issue Date: </span>
                <span className="font-semibold">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mb-3">
                <span className="text-sm text-muted-foreground">Due Date: </span>
                <span className="font-semibold">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </span>
              </div>
              {invoice.paid_at && (
                <div>
                  <span className="text-sm text-muted-foreground">Paid Date: </span>
                  <span className="font-semibold text-green-600">
                    {new Date(invoice.paid_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description/Items */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              DESCRIPTION
            </h3>
            <div className="bg-muted/30 rounded-lg p-6">
              <p className="text-foreground whitespace-pre-wrap">
                {invoice.description || "No description provided"}
              </p>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-80 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono">${invoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax:</span>
                <span className="font-mono">$0.00</span>
              </div>
              <div className="border-t-2 pt-3 flex justify-between">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-2xl font-bold text-primary font-mono">
                  ${invoice.amount.toFixed(2)}
                </span>
              </div>
              {invoice.status === "paid" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-semibold">PAID IN FULL</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info - Only if paid */}
          {invoice.status === "paid" && invoice.tx_hash && (
            <div className="border-t pt-6 print:border-gray-300">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                PAYMENT DETAILS
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm print:bg-gray-50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-mono font-semibold uppercase">
                    {invoice.network}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Transaction Hash:</span>
                  <span className="font-mono text-xs break-all">
                    {invoice.tx_hash}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-2 print:hidden">
                  Verified on blockchain • Payment is final and immutable
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t mt-8 pt-6 text-center print:border-gray-300">
            <p className="text-sm text-muted-foreground">
              Thank you for your business!
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Powered by RAV Gateway • Blockchain Payment System
            </p>
            {!invoice.paid_at && (
              <p className="text-xs text-muted-foreground mt-4 print:hidden">
                Payment link: {window.location.origin}/invoice/{invoice.id}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:border {
            border-width: 1px !important;
          }
          .print\\:border-current {
            border-color: currentColor !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:bg-gray-50 {
            background-color: #f9fafb !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePreview;