import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Save, Upload, X, Sun, Moon, Monitor, Wallet, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorHandler";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Profile state
  const [userId, setUserId] = useState<string>("");
  const [merchantName, setMerchantName] = useState("");
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  
  // Preferences state
  const [defaultChain, setDefaultChain] = useState("base");
  const [defaultStablecoin, setDefaultStablecoin] = useState("usdc");
  const [theme, setTheme] = useState("system");
  
  // Logo state
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to access settings",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || "");

      // Load profile data
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setMerchantName(profile.merchant_name || "");
        setWalletAddress(profile.wallet_address || "");
        setDefaultChain(profile.default_chain || "base");
        setDefaultStablecoin(profile.default_stablecoin || "usdc");
        setTheme(profile.theme || "system");
        setLogoUrl(profile.logo_url || "");
        setLogoPreview(profile.logo_url || "");
      }
    } catch (error: any) {
      toast({
        title: "Failed to load settings",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    try {
      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("merchant-logos")
            .remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("merchant-logos")
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("merchant-logos")
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ logo_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      setLogoFile(null);

      toast({
        title: "Logo uploaded!",
        description: "Your brand logo has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(logoUrl);
  };

  const handleSaveSettings = async () => {
    // Validate wallet address
    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      toast({
        title: "Invalid wallet address",
        description: "Please enter a valid Ethereum address (0x...)",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          merchant_name: merchantName,
          wallet_address: walletAddress,
          default_chain: defaultChain,
          default_stablecoin: defaultStablecoin,
          theme: theme,
        })
        .eq("id", userId);

      if (error) throw error;

      // Apply theme
      applyTheme(theme);

      toast({
        title: "Settings saved!",
        description: "Your preferences have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Failed to save settings",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (selectedTheme: string) => {
    const root = window.document.documentElement;
    
    if (selectedTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", selectedTheme === "dark");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 sm:py-12 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your account preferences and payment settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Profile</h2>
              
              <div className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <Label className="text-sm mb-2">Brand Logo</Label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Max 2MB. JPG, PNG, or WebP. Shows on payment pages.
                      </p>
                      <div className="flex gap-2">
                        {logoFile && (
                          <>
                            <Button
                              size="sm"
                              onClick={handleUploadLogo}
                              disabled={uploadingLogo}
                            >
                              {uploadingLogo ? "Uploading..." : "Upload"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleRemoveLogo}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Merchant Name */}
                <div>
                  <Label htmlFor="merchantName" className="text-sm">Merchant Name</Label>
                  <Input
                    id="merchantName"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Your business name"
                    className="h-11 mt-1.5"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="h-11 mt-1.5 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Contact support to change your email
                  </p>
                </div>

                {/* Wallet Address */}
                <div>
                  <Label htmlFor="walletAddress" className="text-sm">
                    <Wallet className="w-4 h-4 inline mr-1" />
                    Wallet Address
                  </Label>
                  <Input
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="h-11 mt-1.5 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Customers send payments to this address
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment Preferences */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Preferences</h2>
              
              <div className="space-y-4">
                {/* Default Chain */}
                <div>
                  <Label htmlFor="defaultChain" className="text-sm">Default Blockchain</Label>
                  <Select value={defaultChain} onValueChange={setDefaultChain}>
                    <SelectTrigger className="h-11 mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celo">Celo</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="lisk">Lisk</SelectItem>
                      <SelectItem value="somnia">Somnia</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pre-selected chain for customers
                  </p>
                </div>

                {/* Default Stablecoin */}
                <div>
                  <Label htmlFor="defaultStablecoin" className="text-sm">Default Stablecoin</Label>
                  <Select value={defaultStablecoin} onValueChange={setDefaultStablecoin}>
                    <SelectTrigger className="h-11 mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usdc">USDC</SelectItem>
                      <SelectItem value="usdt">USDT</SelectItem>
                      <SelectItem value="cusd">cUSD (Celo only)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pre-selected stablecoin for payments
                  </p>
                </div>
              </div>
            </Card>

            {/* Appearance */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              
              <div>
                <Label className="text-sm mb-3 block">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    className="h-20 flex-col"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="w-5 h-5 mb-2" />
                    <span className="text-xs">Light</span>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    className="h-20 flex-col"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="w-5 h-5 mb-2" />
                    <span className="text-xs">Dark</span>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    className="h-20 flex-col"
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="w-5 h-5 mb-2" />
                    <span className="text-xs">System</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full h-12 text-base"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Settings
                </>
              )}
            </Button>

            {/* Account Actions */}
            <Card className="p-6 border-destructive/20">
              <h2 className="text-lg font-semibold mb-4">Account</h2>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full h-11"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;