import { useNavigate } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';
import { Button } from '@components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Sayfa bulunamadı</p>
        <Button onClick={() => navigate('/')}>
          <FiHome className="w-4 h-4 mr-2" />
          Ana Sayfa
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
