import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scan, CheckCircle, Zap, Shield, Globe, TrendingUp, ArrowRight, BarChart } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/20">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white pb-32 pt-16 sm:pt-24">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-emerald-500/10 rounded-full blur-[140px]" />

        {/* --- Scattered Blurred Background Decorative Cards --- */}
        <div className="absolute inset-0 z-0 pointer-events-none hidden lg:block perspective-1000 overflow-hidden">
             {/* Top Left Blurred Card */}
             <div className="absolute left-[2%] top-[15%] w-64 bg-slate-800 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.3)] transform -rotate-12 opacity-30 blur-[5px] scale-90">
                <div className="flex justify-between flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10"></div>
                  <div className="w-[80%] h-4 bg-white/10 rounded"></div>
                  <div className="w-[60%] h-4 bg-white/10 rounded"></div>
                  <div className="w-full h-16 bg-white/5 rounded mt-4"></div>
                </div>
             </div>

             {/* Top Right Blurred Card */}
             <div className="absolute right-[5%] top-[10%] w-52 bg-white rounded-3xl p-5 shadow-2xl transform rotate-[15deg] opacity-25 blur-[5px] scale-75">
                <div className="flex space-x-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="flex-1 h-10 rounded-lg bg-slate-100"></div>
                </div>
                <div className="w-full h-20 rounded-xl bg-slate-50"></div>
             </div>

             {/* Mid Right Blurred Card */}
             <div className="absolute right-[-2%] top-[45%] w-72 bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl transform rotate-6 opacity-40 blur-[4px] scale-90">
                 <div className="h-4 w-1/3 bg-slate-800 rounded mb-4"></div>
                 <div className="h-12 w-full bg-slate-800 rounded mb-4"></div>
                 <div className="h-20 w-full bg-slate-800/50 rounded"></div>
             </div>

             {/* Bottom Left Blurred Card */}
             <div className="absolute left-[5%] top-[60%] w-60 bg-white rounded-3xl p-6 shadow-2xl transform -rotate-6 opacity-35 blur-[4px] scale-90">
                <div className="w-12 h-12 bg-emerald-100/50 rounded-xl mb-4"></div>
                <div className="w-[70%] h-4 bg-slate-200 rounded mb-3"></div>
                <div className="w-[50%] h-4 bg-slate-100 rounded mb-6"></div>
                <div className="w-full h-12 bg-slate-50 rounded"></div>
             </div>
        </div>
        {/* --- End Scattered Cards --- */}

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto mt-2 sm:mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-8 text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              New: Seamless Web3 Invoicing
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Reliable Access via <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Blockchain
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Pay, receive, and settle in stablecoins instantly with simple, clear flows and zero hidden steps. All powered by RAV GATEWAY, a cross-chain gateway that connects users and merchants worldwide.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform" asChild>
                <Link to="/dashboard">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-slate-700 hover:bg-slate-800 text-slate-200 hover:text-white transition-all bg-transparent" asChild>
                <Link to="#how-it-works" className="flex items-center gap-2">
                  See How It Works <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Floating UI Mockups Area */}
          <div className="relative mt-24 max-w-5xl mx-auto h-[400px] hidden md:block perspective-1000">
             {/* Center Main Card */}
             <div className="absolute left-1/2 top-4 transform -translate-x-1/2 w-[420px] bg-white rounded-2xl p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-slate-900 z-20 hover:-translate-y-2 transition-all duration-500 ring-1 ring-slate-200/50">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                       <Zap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold leading-none mb-1">Invoice #RAV-01</div>
                      <div className="text-xs text-slate-500">Billed to: Global Technologies</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Paid</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">Monthly Retainer</span>
                    <span className="font-semibold">$4,500.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">Server Costs</span>
                    <span className="font-semibold">$450.00</span>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 my-5" />
                
                <div className="flex justify-between items-end">
                   <div>
                     <div className="text-xs text-slate-500 mb-1">Total Amount</div>
                     <div className="font-bold text-3xl text-emerald-500">$4,950.00</div>
                   </div>
                   <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-100/50 px-2 py-1 rounded-md">
                     <CheckCircle className="w-3.5 h-3.5 text-emerald-500"/> Verified on Chain
                   </div>
                </div>
             </div>

             {/* Left Rotated Card */}
             <div className="absolute left-[8%] top-20 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-white transform -rotate-6 z-10 hover:rotate-0 hover:-translate-y-3 hover:shadow-primary/10 transition-all duration-500 ring-1 ring-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Total Balance</div>
                    <div className="text-2xl font-bold tracking-tight">$14,480.24</div>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded flex items-center">
                    +5%
                  </div>
                </div>
                <div className="h-16 w-full flex items-end gap-1.5 mt-6">
                   {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                     <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-sm relative group cursor-pointer transition-all duration-300 hover:bg-emerald-500/40" style={{ height: `${h}%` }}>
                        <div className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-400" style={{ height: '50%' }}></div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Right Rotated Card */}
             <div className="absolute right-[5%] top-[140px] w-[300px] bg-white rounded-2xl p-5 shadow-2xl text-slate-900 transform rotate-3 z-30 hover:rotate-0 hover:-translate-y-3 transition-all duration-500 ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-semibold text-sm">Saved Actions</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-2">See All</Button>
                </div>
                <div className="space-y-3">
                  {[
                    {name: 'Website Design', desc: 'Design payment', amount: '$1,240.00', color: 'bg-blue-100 text-blue-600'},
                    {name: 'Brand Retainer', desc: 'Subscription Fees', amount: '$2,000.00', color: 'bg-purple-100 text-purple-600'}
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-default border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${item.color}`}>
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium leading-none mb-1">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.desc}</div>
                        </div>
                      </div>
                      <span className="text-sm font-bold">{item.amount}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary/20 h-9 rounded-lg border-none shadow-none text-xs font-semibold">
                  + Save a New Action
                </Button>
             </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-50 py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3 text-center w-full block">Workflow</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Built for speed and simplicity</h3>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Generate invoices in seconds and let your customers pay with their preferred EVM wallet. It's really that straightforward.
            </p>
          </div>
            
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="group border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white p-8 rounded-3xl hover:-translate-y-2 relative overflow-hidden">
              <div className="w-16 h-16 bg-emerald-50 group-hover:bg-emerald-500 transition-colors duration-300 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100 group-hover:border-emerald-500">
                <Scan className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-slate-900">1. Generate Invoice</h4>
              <p className="text-slate-600 leading-relaxed">
                Input the amount and description. We’ll instantly generate a secure, shareable link and QR code.
              </p>
            </Card>

            <Card className="group border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white p-8 rounded-3xl hover:-translate-y-2 relative overflow-hidden">
              <div className="w-16 h-16 bg-emerald-50 group-hover:bg-emerald-500 transition-colors duration-300 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100 group-hover:border-emerald-500">
                <CheckCircle className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-slate-900">2. Customer Pays</h4>
              <p className="text-slate-600 leading-relaxed">
                Your client clicks the link, connects their wallet, and confirms the transaction in one tap.
              </p>
            </Card>

            <Card className="group border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white p-8 rounded-3xl hover:-translate-y-2 relative overflow-hidden">
              <div className="w-16 h-16 bg-emerald-50 group-hover:bg-emerald-500 transition-colors duration-300 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100 group-hover:border-emerald-500">
                <Zap className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-slate-900">3. Instant Settlement</h4>
              <p className="text-slate-600 leading-relaxed">
                Payment is verified on-chain instantly. Receipts are sent, and the sale is recorded in your dashboard.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Rav Section */}
      <section id="why-rav" className="py-24 sm:py-32 bg-white relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3 block w-full">Enterprise Grade</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Why RavGateway?</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
               A robust infrastructure designed for trust, global access, and unwavering reliability.
            </p>
          </div>
            
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50 group-hover:ring-emerald-100 transition-all duration-300">
                <Shield className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">Trustless Security</h4>
              <p className="text-slate-500 leading-relaxed max-w-xs break-words">
                Built on robust blockchain infrastructure ensuring transparent, immutable, and easily auditable transaction records.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50 group-hover:ring-blue-100 transition-all duration-300">
                <Globe className="w-10 h-10 text-blue-500" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">Global Access</h4>
              <p className="text-slate-500 leading-relaxed max-w-xs break-words">
                Break borders. Provide banking for the unbanked with mobile-first solutions accessible from any corner of the globe.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-purple-50/50 group-hover:ring-purple-100 transition-all duration-300">
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900">High Reliability</h4>
              <p className="text-slate-500 leading-relaxed max-w-xs break-words">
                Enjoy significantly lower fees, instant multi-chain settlements, and 99.9% uptime for your business operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 bg-emerald-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to scale your business?
          </h2>
          <p className="text-emerald-50 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of modern merchants using RavGateway to process digital payments securely and instantly.
          </p>
          <Button size="lg" className="bg-white text-emerald-600 hover:bg-slate-50 text-lg h-14 px-10 rounded-full shadow-xl hover:-translate-y-1 transition-transform" asChild>
            <Link to="/auth">Create an account for free</Link>
          </Button>
          <p className="mt-6 text-sm text-emerald-100/80 font-medium">No credit card required. Setup in minutes.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;

