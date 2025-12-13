import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  
  // Update these with your actual social media URLs
  const socialLinks = {
    facebook: "https://facebook.com/ravgateway",
    twitter: "https://x.com/RAVGateway",
    instagram: "https://instagram.com/ravgateway",
    linkedin: "https://linkedin.com/company/ravgateway",
    email: "mailto:ravgateway@gmail.com"
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
            
            {/* Social Media Links - NEW */}
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a
                href={socialLinks.email}
                className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
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