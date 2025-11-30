import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Plus, 
  FileText, 
  Send, 
  Eye, 
  CheckCircle2, 
  Clock,
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
}

const Invoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    checkAuthAndFetchInvoices();
  }, []);

  const checkAuthAndFetchInvoices = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    fetchInvoices();
  };

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading invoices",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Generate invoice number
      const { data: invoiceNumber } = await supabase.rpc(
        "generate_invoice_number"
      );

      // Create invoice
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          merchant_id: session.user.id,
          client_name: clientName,
          client_email: clientEmail,
          amount: parseFloat(amount),
          description: description,
          invoice_number: invoiceNumber,
          due_date: new Date(dueDate).toISOString(),
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Invoice created!",
        description: `Invoice ${invoiceNumber} has been created.`,
      });

      // Reset form
      setClientName("");
      setClientEmail("");
      setAmount("");
      setDescription("");
      setDueDate("");
      setIsDialogOpen(false);

      // Refresh invoices
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Error creating invoice",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const sendInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      // Update status to sent
      const { error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Invoice sent!",
        description: `Invoice ${invoiceNumber} has been marked as sent.`,
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Error sending invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyPaymentLink = (invoiceId: string) => {
    const link = `${window.location.origin}/invoice/${invoiceId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Payment link copied to clipboard",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-100 text-gray-700",
      sent: "bg-blue-100 text-blue-700",
      viewed: "bg-yellow-100 text-yellow-700",
      paid: "bg-green-100 text-green-700",
      overdue: "bg-red-100 text-red-700",
    };

    const icons = {
      draft: FileText,
      sent: Send,
      viewed: Eye,
      paid: CheckCircle2,
      overdue: Clock,
    };

    const Icon = icons[status as keyof typeof icons] || FileText;

    return (
      <Badge className={`${styles[status as keyof typeof styles] || styles.draft} text-xs`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Invoices</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create and manage invoices for your clients
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Create New Invoice</DialogTitle>
                <DialogDescription className="text-sm">
                  Fill in the details to create an invoice for your client
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-sm">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-sm">Client Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm">Amount (USD) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Services rendered, products delivered, etc."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-11" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Invoice"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No invoices yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Create your first invoice to get started
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left side - Invoice details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold truncate">
                        {invoice.invoice_number}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Client:</strong> {invoice.client_name}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {invoice.client_email}
                      </p>
                      {invoice.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-2">
                          {invoice.description}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        <strong className="text-foreground">Due:</strong>{" "}
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Right side - Amount and actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-4">
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      ${invoice.amount.toFixed(2)}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPaymentLink(invoice.id)}
                        className="h-9 text-xs sm:text-sm"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Copy Link</span>
                      </Button>
                      {invoice.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => sendInvoice(invoice.id, invoice.invoice_number)}
                          className="h-9 text-xs sm:text-sm"
                        >
                          <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Send</span>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-9 text-xs sm:text-sm"
                        onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Invoices;