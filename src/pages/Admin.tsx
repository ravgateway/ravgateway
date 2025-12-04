// src/pages/Admin.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  DollarSign, 
  Users, 
  Receipt,
  TrendingUp,
  Loader2,
  Activity,
  Download,
  RefreshCw,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface PlatformStats {
  totalVolume: number;
  totalTransactions: number;
  totalFees: number;
  activeMerchants: number;
  todayVolume: number;
  weekVolume: number;
  monthVolume: number;
}

interface ChartData {
  date: string;
  volume: number;
  transactions: number;
}

interface TopMerchant {
  id: string;
  merchant_name: string;
  email: string;
  total_volume: number;
  transaction_count: number;
}

const Admin = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<PlatformStats>({
    totalVolume: 0,
    totalTransactions: 0,
    totalFees: 0,
    activeMerchants: 0,
    todayVolume: 0,
    weekVolume: 0,
    monthVolume: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topMerchants, setTopMerchants] = useState<TopMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchPlatformStats();
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    fetchPlatformStats();
    toast({
      title: "Refreshed!",
      description: "Platform stats updated",
    });
  };

  const handleExportCSV = () => {
    const csvData = [
      ["RAV Gateway Platform Report"],
      ["Generated:", new Date().toLocaleString()],
      [""],
      ["Summary Statistics"],
      ["Total Volume", `$${stats.totalVolume.toFixed(2)}`],
      ["Total Transactions", stats.totalTransactions],
      ["Platform Fees (1.5%)", `$${stats.totalFees.toFixed(2)}`],
      ["Active Merchants", stats.activeMerchants],
      [""],
      ["Time Period Breakdown"],
      ["Today", `$${stats.todayVolume.toFixed(2)}`],
      ["This Week", `$${stats.weekVolume.toFixed(2)}`],
      ["This Month", `$${stats.monthVolume.toFixed(2)}`],
      [""],
      ["Top 10 Merchants"],
      ["Rank", "Merchant Name", "Email", "Volume", "Transactions"],
      ...topMerchants.map((m, i) => [
        i + 1,
        m.merchant_name,
        m.email,
        `$${m.total_volume.toFixed(2)}`,
        m.transaction_count
      ]),
      [""],
      ["Daily Breakdown (Last 30 Days)"],
      ["Date", "Volume", "Transactions"],
      ...chartData.map(d => [d.date, `$${d.volume.toFixed(2)}`, d.transactions])
    ];

    const csv = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rav-gateway-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Export complete!",
      description: "CSV report downloaded",
    });
  };

  const handleApplyFilters = () => {
    fetchPlatformStats();
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    fetchPlatformStats();
  };

  const fetchPlatformStats = async () => {
    try {
      setRefreshing(true);
      
      // Build date filter
      let query = supabase
        .from("transactions")
        .select("amount, created_at, merchant_id")
        .eq("status", "completed");
      
      if (startDate) {
        query = query.gte("created_at", new Date(startDate).toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      const { data: transactions, error: txError } = await query;
      if (txError) throw txError;

      // Fetch invoices
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("amount, created_at, status");
      if (invError) throw invError;

      // Fetch merchants with names
      const { data: merchants, error: merchError } = await supabase
        .from("profiles")
        .select("id, merchant_name, email");
      if (merchError) throw merchError;

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let totalVolume = 0;
      let todayVolume = 0;
      let weekVolume = 0;
      let monthVolume = 0;

      // Merchant stats tracking
      const merchantStats: { [key: string]: { volume: number; count: number } } = {};

      transactions?.forEach((tx) => {
        const amount = tx.amount;
        totalVolume += amount;

        const txDate = new Date(tx.created_at);
        if (txDate >= todayStart) todayVolume += amount;
        if (txDate >= weekStart) weekVolume += amount;
        if (txDate >= monthStart) monthVolume += amount;

        // Track per merchant
        if (!merchantStats[tx.merchant_id]) {
          merchantStats[tx.merchant_id] = { volume: 0, count: 0 };
        }
        merchantStats[tx.merchant_id].volume += amount;
        merchantStats[tx.merchant_id].count += 1;
      });

      const totalFees = totalVolume * 0.015;

      // Build top merchants list
      const topMerchantsList: TopMerchant[] = Object.entries(merchantStats)
        .map(([merchantId, stats]) => {
          const merchant = merchants?.find(m => m.id === merchantId);
          return {
            id: merchantId,
            merchant_name: merchant?.merchant_name || "Unknown",
            email: merchant?.email || "",
            total_volume: stats.volume,
            transaction_count: stats.count,
          };
        })
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, 10);

      setTopMerchants(topMerchantsList);

      // Generate chart data
      const daysToShow = 30;
      const chartDays: ChartData[] = [];
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayTransactions = transactions?.filter(tx => {
          const txDate = new Date(tx.created_at);
          return txDate >= dayStart && txDate < dayEnd;
        }) || [];

        const dayVolume = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

        chartDays.push({
          date: dateStr,
          volume: dayVolume,
          transactions: dayTransactions.length,
        });
      }

      setStats({
        totalVolume,
        totalTransactions: transactions?.length || 0,
        totalFees,
        activeMerchants: merchants?.length || 0,
        todayVolume,
        weekVolume,
        monthVolume,
      });

      setChartData(chartDays);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error loading stats",
        description: "Failed to fetch platform statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (authLoading || loading) {
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
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Platform-wide analytics and statistics</p>
            </div>
            <Badge variant="destructive" className="text-sm">
              <Activity className="w-3 h-3 mr-1" />
              Admin Access
            </Badge>
          </div>

          {/* Date Filters & Actions */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs mb-1">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs mb-1">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleApplyFilters} size="sm" className="flex-1">
                  Apply Filters
                </Button>
                {(startDate || endDate) && (
                  <Button onClick={handleClearFilters} size="sm" variant="outline">
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleRefresh} size="sm" variant="outline" disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={handleExportCSV} size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Volume */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              ${stats.totalVolume.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              All-time processed
            </p>
          </Card>

          {/* Total Transactions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <Receipt className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.totalTransactions}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Completed payments
            </p>
          </Card>

          {/* Platform Fees */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Platform Fees</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              ${stats.totalFees.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              1.5% of volume
            </p>
          </Card>

          {/* Active Merchants */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Merchants</p>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.activeMerchants}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Registered users
            </p>
          </Card>
        </div>

        {/* Time Period Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Today</p>
            <p className="text-2xl font-bold text-primary">
              ${stats.todayVolume.toFixed(2)}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">This Week</p>
            <p className="text-2xl font-bold text-primary">
              ${stats.weekVolume.toFixed(2)}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">This Month</p>
            <p className="text-2xl font-bold text-primary">
              ${stats.monthVolume.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Top Merchants Table */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Top 10 Merchants</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">#</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Merchant</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Volume</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {topMerchants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No merchant data available
                    </td>
                  </tr>
                ) : (
                  topMerchants.map((merchant, index) => (
                    <tr key={merchant.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 text-sm">{index + 1}</td>
                      <td className="py-3 px-2 text-sm font-medium">{merchant.merchant_name}</td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">{merchant.email}</td>
                      <td className="py-3 px-2 text-sm font-semibold text-right text-primary">
                        ${merchant.total_volume.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right">{merchant.transaction_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Volume Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Volume Trend (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  name="Volume ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Transaction Count Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Transactions (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="transactions" 
                  fill="#10b981"
                  name="Transactions"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;