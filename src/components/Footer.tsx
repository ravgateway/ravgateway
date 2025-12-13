import { Link } from "react-router-dom";
import { Twitter, Instagram, Mail, Github, MessageCircle, FileText, BookOpen } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  
  // RAV Gateway actual social media URLs
  const socialLinks = {
    email: "mailto:ravgateway@gmail.com",
    twitter: "https://x.com/RAVGateway",
    tiktok: "https://tiktok.com/@ravgateway",
    instagram: "https://www.instagram.com/ravgateway",
    substack: "https://substack.com/@ravgateway",
    telegram: "https://t.me/+QlBolVjDEJ4xZjc8",
    medium: "https://medium.com/@ravgateway",
    github: "https://github.com/ravgateway"
  };
  
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-20 h-20 bg-background rounded-lg flex items-center justify-center black">           
                <img src="/rav-logo.png" alt="Rav logo w-8 h-8"/>
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Reliable access to digital payments via blockchain technology.
            </p>
            
            {/* Social Media Links - Mobile Optimized */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Email */}
              <a
                href={socialLinks.email}
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Email"
                title="Email us"
              >
                <Mail className="w-5 h-5" />
              </a>
              
              {/* X (Twitter) */}
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="X (Twitter)"
                title="Follow us on X"
              >
                <Twitter className="w-5 h-5" />
              </a>
              
              {/* Instagram */}
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Instagram"
                title="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              
              {/* TikTok - Using custom styled text */}
              <a
                href={socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted font-bold text-sm"
                aria-label="TikTok"
                title="Follow us on TikTok"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              
              {/* Telegram */}
              <a
                href={socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Telegram"
                title="Join our Telegram"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              
              {/* Medium */}
              <a
                href={socialLinks.medium}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Medium"
                title="Read us on Medium"
              >
                <BookOpen className="w-5 h-5" />
              </a>
              
              {/* Substack */}
              <a
                href={socialLinks.substack}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Substack"
                title="Subscribe on Substack"
              >
                <FileText className="w-5 h-5" />
              </a>
              
              {/* GitHub */}
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="GitHub"
                title="Follow us on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base text-foreground">Product</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors inline-block py-1">Dashboard</Link></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors inline-block py-1">How It Works</a></li>
              <li><a href="#why-rav" className="hover:text-primary transition-colors inline-block py-1">Why Rav</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base text-foreground">Legal</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors inline-block py-1">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors inline-block py-1">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors inline-block py-1">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; {year} Rav. All rights reserved. Powered by blockchain.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;