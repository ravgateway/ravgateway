import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, Wallet, Shield, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  status: string;
  due_date: string;
  description: string;
  merchant_id: string;
}

interface MerchantProfile {
  merchant_name: string;
  wallet_address: string;
  email: string;
}

// Network configuration
const NETWORKS = {
  celo: {
    name: "Celo Sepolia Testnet",
    chainId: "11142220",
    rpcUrl: "https://forno.celo-sepolia.celo-testnet.org",
    explorer: "https://celo-sepolia.blockscout.com",
    stablecoin: {
      address: "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80",
      symbol: "cUSD",
      decimals: 18,
    },
  },
  base: {
    name: "Base Sepolia Testnet",
    chainId: "0x14A34",
    rpcUrl: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    stablecoin: {
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      symbol: "USDC",
      decimals: 6,
    },
  },
};

const InvoicePayment = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState<any>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<"celo" | "base">("celo");
  const [showNetworkOptions, setShowNetworkOptions] = useState(false);

  useEffect(() => {
    fetchInvoiceData();
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    if (!invoiceId) return;

    try {
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      
      if (!invoiceData) {
        toast({
          title: "Invoice not found",
          description: "This invoice does not exist",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setInvoice(invoiceData);

      // Update status to viewed if it's sent
      if (invoiceData.status === "sent") {
        await supabase
          .from("invoices")
          .update({ status: "viewed" })
          .eq("id", invoiceId);
      }

      // Fetch merchant info
      const { data: merchantData, error: merchantError } = await supabase
        .from("profiles")
        .select("merchant_name, wallet_address, email")
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

  const connectWallet = async (useWalletConnect: boolean = false, network: "celo" | "base" = "celo") => {
    try {
      let provider;
      let accounts;
      const selectedNet = NETWORKS[network];
      
      if (useWalletConnect) {
        const wcProvider = await EthereumProvider.init({
          projectId: "6f033f2737797ddd7f1907ba4c264474",
          chains: [parseInt(selectedNet.chainId, 16)],
          showQrModal: true,
          qrModalOptions: { themeMode: "light" },
          rpcMap: { [parseInt(selectedNet.chainId, 16)]: selectedNet.rpcUrl },
        });

        await wcProvider.enable();
        provider = new ethers.BrowserProvider(wcProvider);
        accounts = await wcProvider.request({ method: "eth_accounts" });
        setWalletProvider(wcProvider);
      } else {
        if (typeof window.ethereum === "undefined") {
          toast({
            title: "No browser wallet found",
            description: "Try using WalletConnect",
            variant: "destructive",
          });
          return;
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        accounts = await provider.send("eth_requestAccounts", []);

        try {
          await provider.send("wallet_switchEthereumChain", [{ chainId: selectedNet.chainId }]);
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await provider.send("wallet_addEthereumChain", [{
              chainId: selectedNet.chainId,
              chainName: selectedNet.name,
              nativeCurrency: {
                name: selectedNet.stablecoin.symbol,
                symbol: selectedNet.stablecoin.symbol,
                decimals: selectedNet.stablecoin.decimals,
              },
              rpcUrls: [selectedNet.rpcUrl],
              blockExplorerUrls: [selectedNet.explorer],
            }]);
          }
        }

        setWalletProvider(window.ethereum);
      }

      setSelectedNetwork(network);
      setWalletAddress(accounts[0]);
      setShowNetworkOptions(false);
      
      toast({
        title: "Wallet connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!invoice || !merchant || !walletAddress) return;

    setPaying(true);

    try {
      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const network = NETWORKS[selectedNetwork];
      const tokenAmount = ethers.parseUnits(
        invoice.amount.toFixed(network.stablecoin.decimals),
        network.stablecoin.decimals
      );

      const tx = await signer.sendTransaction({
        to: merchant.wallet_address,
        value: tokenAmount,
      });

      toast({
        title: "Transaction sent",
        description: "Waiting for confirmation...",
      });

      const receipt = await tx.wait();

      if (!receipt) throw new Error("Transaction failed");

      // Update invoice status
      await supabase
        .from("invoices")
        .update({ 
          status: "paid",
          paid_at: new Date().toISOString(),
          tx_hash: receipt.hash,
          network: selectedNetwork
        })
        .eq("id", invoiceId);

      navigate("/success", {
        state: {
          amount: invoice.amount,
          reference: invoice.invoice_number,
          txHash: receipt.hash,
          network: selectedNetwork,
        },
      });

    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPaying(false);
    }
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
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground">This invoice does not exist or has been removed.</p>
        </Card>
      </div>
    );
  }

  if (invoice.status === "paid") {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Navbar />
        <main className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold mb-2">Invoice Already Paid</h2>
            <p className="text-muted-foreground mb-4">
              This invoice has already been paid.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
              <p className="font-mono text-lg">{invoice.invoice_number}</p>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
              <Shield className="w-3 h-3 mr-1" />
              Secure Payment
            </Badge>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Invoice from {merchant.merchant_name}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Invoice #{invoice.invoice_number}
            </p>
          </div>

          {/* Invoice Details Card */}
          <Card className="p-6 sm:p-8 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Invoice Details</h3>
                  {invoice.description && (
                    <p className="text-sm text-muted-foreground">{invoice.description}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bill To:</span>
                  <span className="font-medium">{invoice.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-3xl font-bold text-primary">
                      ${invoice.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Card */}
          <Card className="p-6 sm:p-8 space-y-6">
            {!walletAddress ? (
              <div className="space-y-3">
                <Label className="text-sm">Connect Wallet to Pay</Label>
                <div className="grid gap-3">
                  <Button
                    className="w-full h-12"
                    onClick={() => setShowNetworkOptions(!showNetworkOptions)}
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
                  </Button>

                  {showNetworkOptions && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium text-center">Select Network</p>
                      <Button 
                        onClick={() => connectWallet(false, "base")}
                        className="w-full"
                        variant="outline"
                      >
                        Base (MetaMask)
                      </Button>
                      <Button 
                        onClick={() => connectWallet(false, "celo")}
                        className="w-full"
                        variant="outline"
                      >
                        Celo (MetaMask)
                      </Button>
                    </div>
                  )}

                  <Button
                    className="w-full h-12"
                    onClick={() => connectWallet(true)}
                    variant="outline"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    WalletConnect (Mobile)
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="text-sm font-medium">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setWalletAddress(null)}
                  >
                    Disconnect
                  </Button>
                </div>

                <Button
                  className="w-full h-14 text-lg"
                  onClick={handlePayment}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    `Pay $${invoice.amount.toFixed(2)}`
                  )}
                </Button>
              </>
            )}
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Powered by blockchain • Secure payment • Instant settlement</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InvoicePayment;