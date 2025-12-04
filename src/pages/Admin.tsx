// src/pages/Admin.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  DollarSign, 
  Users, 
  Receipt,
  TrendingUp,
  Loader2,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
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

const Admin = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchPlatformStats();
    }
  }, [isAdmin]);

  const fetchPlatformStats = async () => {
    try {
      // Fetch all transactions
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("amount, created_at")
        .eq("status", "completed");

      if (txError) throw txError;

      // Fetch all invoices
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("amount, created_at, status");

      if (invError) throw invError;

      // Fetch unique merchants
      const { data: merchants, error: merchError } = await supabase
        .from("profiles")
        .select("id");

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

      transactions?.forEach((tx) => {
        const amount = tx.amount;
        totalVolume += amount;

        const txDate = new Date(tx.created_at);
        if (txDate >= todayStart) todayVolume += amount;
        if (txDate >= weekStart) weekVolume += amount;
        if (txDate >= monthStart) monthVolume += amount;
      });

      // Platform fee (1.5%)
      const totalFees = totalVolume * 0.015;

      // Generate chart data (last 30 days)
      const last30Days: ChartData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayTransactions = transactions?.filter(tx => {
          const txDate = new Date(tx.created_at);
          return txDate >= dayStart && txDate < dayEnd;
        }) || [];

        const dayVolume = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

        last30Days.push({
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

      setChartData(last30Days);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform-wide analytics and statistics</p>
          </div>
          <Badge variant="destructive" className="text-sm">
            <Activity className="w-3 h-3 mr-1" />
            Admin Access
          </Badge>
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