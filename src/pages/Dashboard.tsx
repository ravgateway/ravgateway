import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TransactionList, { Transaction } from "@/components/TransactionList";
import { QrCode, Wallet, TrendingUp, FileText, Users, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  status: string;
  amount: number;
  client_name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalInflow, setTotalInflow] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [weeklyGrowth, setWeeklyGrowth] = useState(0);
  const [chartData, setChartData] = useState<{ day: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Animation states
  const [animatedInflow, setAnimatedInflow] = useState(0);
  const [animatedMonthly, setAnimatedMonthly] = useState(0);
  const [animatedWeekly, setAnimatedWeekly] = useState(0);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Animate numbers
  useEffect(() => {
    if (!loading) {
      setCardsVisible(true);
      animateValue(0, totalInflow, 1500, setAnimatedInflow);
      animateValue(0, monthlyRevenue, 1500, setAnimatedMonthly);
      animateValue(0, weeklyTotal, 1500, setAnimatedWeekly);
    }
  }, [loading, totalInflow, monthlyRevenue, weeklyTotal]);

  const animateValue = (start: number, end: number, duration: number, setter: (v: number) => void) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setter(start + (end - start) * easeOut);
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to access the dashboard.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const { data: {user} } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("merchant_name")
        .eq("id", user.id)
        .single();

      if (!profile?.merchant_name ||
          profile.merchant_name === '' ||
          profile.merchant_name === 'Merchant' ||
          profile.merchant_name.trim() === ''){
        navigate("/setup-profile");
        return;
      }
    }

    fetchData();
  };

  const fetchData = async () => {
    // Fetch transactions
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select(`
        *,
        products (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (txError) {
      toast({
        title: "Error loading transactions",
        description: txError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch invoices
    const { data: invData, error: invError } = await supabase
      .from("invoices")
      .select("id, status, amount, client_name")
      .order("created_at", { ascending: false });

    if (invError) {
      toast({
        title: "Error loading invoices",
        description: invError.message,
        variant: "destructive",
      });
    }

    setInvoices(invData || []);

    const formattedTx: Transaction[] = (txData || []).map((tx) => ({
      id: tx.id,
      type: tx.transaction_type as "credit" | "debit",
      name: tx.customer_name,
      amount: Number(tx.amount),
      date: new Date(tx.created_at).toLocaleString(),
      status: tx.status as "completed" | "pending",
      txHash: tx.tx_hash || undefined,
      network: undefined,
      productName: tx.products?.name || "Product",
      quantity: tx.quantity || 1,
    }));

    setTransactions(formattedTx);

    // Calculate metrics
    const creditTx = formattedTx.filter((tx) => tx.type === "credit");
    const paidInvoices = (invData || []).filter(inv => inv.status === "paid");
    
    const inflow = creditTx.reduce((sum, tx) => sum + tx.amount, 0) +
                   paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    setTotalInflow(inflow);

    // Monthly revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTx = (txData || []).filter((tx) => {
      const txDate = new Date(tx.created_at);
      return txDate >= monthStart && tx.transaction_type === "credit";
    });
    const thisMonthInv = (invData || []).filter((inv) => {
      const invDate = new Date(inv.created_at);
      return invDate >= monthStart && inv.status === "paid";
    });
    const monthly = thisMonthTx.reduce((sum, tx) => sum + Number(tx.amount), 0) +
                    thisMonthInv.reduce((sum, inv) => sum + inv.amount, 0);
    setMonthlyRevenue(monthly);

    // Weekly analytics
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekTx = (txData || []).filter((tx) => {
      const txDate = new Date(tx.created_at);
      return txDate >= sevenDaysAgo && tx.transaction_type === "credit";
    });
    const lastWeekTx = (txData || []).filter((tx) => {
      const txDate = new Date(tx.created_at);
      return txDate >= fourteenDaysAgo && txDate < sevenDaysAgo && tx.transaction_type === "credit";
    });

    const thisWeekTotal = thisWeekTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const lastWeekTotal = lastWeekTx.reduce((sum, tx) => sum + Number(tx.amount), 0);

    setWeeklyTotal(thisWeekTotal);

    if (lastWeekTotal > 0) {
      const growth = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
      setWeeklyGrowth(Math.round(growth));
    } else if (thisWeekTotal > 0) {
      setWeeklyGrowth(100);
    } else {
      setWeeklyGrowth(0);
    }

    // Chart data
    const dailyData: { day: string; amount: number }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = dayNames[date.getDay()];
      
      const dayTotal = (txData || [])
        .filter((tx) => {
          const txDate = new Date(tx.created_at);
          return (
            txDate.toDateString() === date.toDateString() &&
            tx.transaction_type === "credit"
          );
        })
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      dailyData.push({ day: dayName, amount: dayTotal });
    }

    setChartData(dailyData);
    setLoading(false);
  };

  const pendingInvoices = invoices.filter(inv => inv.status === "draft" || inv.status === "sent");
  const paidInvoices = invoices.filter(inv => inv.status === "paid");
  const uniqueClients = new Set(invoices.map(inv => inv.client_name)).size;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here's your overview</p>
        </div>

        {/* Metrics Grid - Animated */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Inflow */}
          <Card className={`p-6 transition-all duration-700 hover:shadow-lg hover:-translate-y-1 ${
            cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Inflow</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  ${animatedInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">All-time revenue</p>
          </Card>

          {/* Monthly Revenue */}
          <Card className={`p-6 transition-all duration-700 delay-100 hover:shadow-lg hover:-translate-y-1 ${
            cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">This Month</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  ${animatedMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Monthly earnings</p>
          </Card>

          {/* Pending Invoices */}
          <Card className={`p-6 transition-all duration-700 delay-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
            cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          onClick={() => navigate("/invoices")}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pending</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {pendingInvoices.length}
                </h3>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 font-medium">
              ${pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)} awaiting
            </p>
          </Card>

          {/* Total Clients */}
          <Card className={`p-6 transition-all duration-700 delay-300 hover:shadow-lg hover:-translate-y-1 ${
            cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Clients</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {uniqueClients}
                </h3>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </Card>
        </div>

        {/* Weekly Stats + Invoice Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Weekly Performance */}
          <Card className={`p-6 lg:col-span-2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transition-all duration-700 delay-400 ${
            cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-primary-foreground/80 text-xs sm:text-sm mb-1">This Week</p>
                <h2 className="text-3xl sm:text-4xl font-bold">
                  ${animatedWeekly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            {weeklyTotal > 0 ? (
              <p className={`text-sm font-medium ${
                weeklyGrowth >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {weeklyGrowth >= 0 ? '↗' : '↘'} {Math.abs(weeklyGrowth)}% from last week
              </p>
            ) : (
              <p className="text-sm text-primary-foreground/70">No sales yet this week</p>
            )}
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="w-full h-11 sm:h-12" asChild>
                <Link to="/payment">
                  <QrCode className="w-4 h-4 mr-2" />
                  <span className="text-sm sm:text-base">Generate QR</span>
                </Link>
              </Button>
            </div>
          </Card>

          {/* Invoice Status Breakdown */}
          <Card className={`p-6 transition-all duration-700 delay-500 ${
            cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoices
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Draft</span>
                <span className="font-semibold">{invoices.filter(i => i.status === "draft").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sent</span>
                <span className="font-semibold">{invoices.filter(i => i.status === "sent").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paid</span>
                <span className="font-semibold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {paidInvoices.length}
                </span>
              </div>
              {invoices.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Paid Rate</span>
                    <span className="font-semibold">
                      {Math.round((paidInvoices.length / invoices.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(paidInvoices.length / invoices.length) * 100}%`,
                        transitionDelay: '600ms'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Chart + Top Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Daily Revenue Chart */}
          <Card className={`p-6 lg:col-span-2 transition-all duration-700 delay-600 ${
            cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-xl font-semibold mb-6 text-foreground">Daily Revenue</h2>
            <div className="space-y-4">
              {chartData.map((item, index) => {
                const maxAmount = Math.max(...chartData.map(d => d.amount));
                const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-1 group">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item.day}</span>
                      <span className="font-medium text-foreground">${item.amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-1000 ease-out hover:bg-primary/80"
                        style={{ 
                          width: `${percentage}%`,
                          transitionDelay: `${700 + index * 100}ms`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Clients */}
          <Card className={`p-6 transition-all duration-700 delay-700 ${
            cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Top Clients</h3>
            <div className="space-y-4">
              {Object.entries(
                invoices
                  .filter(inv => inv.status === "paid")
                  .reduce((acc: { [key: string]: number }, inv) => {
                    acc[inv.client_name] = (acc[inv.client_name] || 0) + inv.amount;
                    return acc;
                  }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, total], idx) => (
                  <div 
                    key={name} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 hover:scale-105"
                    style={{ transitionDelay: `${800 + idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">#{idx + 1}</span>
                      </div>
                      <span className="font-medium text-sm truncate max-w-[120px]">{name}</span>
                    </div>
                    <span className="font-bold text-primary">${total.toFixed(2)}</span>
                  </div>
                ))
              }
              {paidInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No paid invoices yet
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Transactions */}
        <div className={`transition-all duration-700 delay-800 ${
          cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <TransactionList transactions={transactions} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;