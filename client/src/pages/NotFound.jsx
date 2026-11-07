import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 mb-6">
          <span className="text-6xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-3xl font-bold mb-3 gradient-text">Sayfa Bulunamadı</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Button 
          onClick={() => navigate('/')}
          size="lg"
          className="gap-2 shadow-premium"
        >
          <Home className="w-5 h-5" />
          Ana Sayfa
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
