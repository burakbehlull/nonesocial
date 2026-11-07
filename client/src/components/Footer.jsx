import { Github, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Brand */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} NoneSocial</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Anonim Video Sohbet</span>
          </div>

          {/* Center - Created By */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Created with</span>
            <Heart className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" />
            <span className="text-muted-foreground">by</span>
            <a
              href="https://github.com/orgs/Paradox-Forge/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              aria-label="Paradox Forge GitHub organizasyonu"
            >
              <Github className="w-4 h-4" aria-hidden="true" />
              <span>Paradox Forge</span>
            </a>
          </div>

          {/* Right - Links */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href="https://github.com/orgs/Paradox-Forge/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors duration-300 flex items-center gap-1"
              aria-label="GitHub'da Paradox Forge"
            >
              <Github className="w-3.5 h-3.5" aria-hidden="true" />
              <span>GitHub</span>
            </a>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-xs">v3.0 Premium</span>
          </div>
        </div>

        {/* Mobile - Simplified version */}
        <div className="md:hidden text-center mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Kayıt olmadan anonim ve güvenli görüntülü sohbet
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
