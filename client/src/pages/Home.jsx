import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, Lock, Users, LogIn, Moon, Sun,
  Sparkles, Shield, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocket } from '@services/socket';
import { validateRoomName, validatePassword } from '@utils/helpers';
import { useTheme } from '@contexts/ThemeContext';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card';
import { IconButton } from '@components/ui/icon-button';
import Footer from '@components/Footer';

const Home = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [limit, setLimit] = useState(10);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleCreateRoom = () => {
    const nameError = validateRoomName(roomName);
    if (nameError) {
      toast.error(nameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    const socket = getSocket();
    socket.emit('createRoom', {
      name: roomName,
      password: password || null,
      limit: limit,
      videoEnabled: true
    }, (response) => {
      if (response.success) {
        navigate(`/room/${response.roomId}`, { state: { isCreator: true } });
      } else {
        toast.error('Oda oluşturulamadı');
      }
    });
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast.error('Lütfen oda ID girin');
      return;
    }

    navigate(`/room/${joinRoomId}`, { state: { password: joinPassword } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Theme Toggle - Premium */}
      <div className="fixed top-6 right-6 z-50">
        <IconButton
          variant="ghost"
          className="glass shadow-premium"
          onClick={toggleTheme}
          tooltip={isDark ? "Aydınlık moda geç" : "Karanlık moda geç"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </IconButton>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left - Hero Section */}
            <div className="space-y-10 animate-in">
              <div className="space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Anonim Sohbet</span>
                </div>

                {/* Logo & Title */}
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-premium-xl">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tight">
                    <span className="gradient-text">
                      None Social
                    </span>
                  </h1>
                  <p className="text-muted-foreground text-xl leading-relaxed max-w-lg">
                    Kayıt olmadan, güvenli ve anonim olarak görüntülü sohbet edin
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 shadow-premium-xl hover:shadow-premium-lg interactive"
                  onClick={() => setShowCreateModal(true)}
                  aria-label="Yeni oda oluştur"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Yeni Oda Oluştur
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 shadow-premium interactive"
                  onClick={() => setShowJoinModal(true)}
                  aria-label="Mevcut odaya katıl"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Odaya Katıl
                </Button>
              </div>
            </div>

            {/* Right - Feature Cards */}
            <div className="grid gap-5 animate-in">
              <Card className="hover:shadow-premium-lg transition-all duration-300 border-border/50 interactive group">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                      <Video className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Video & Ses Görüşmesi</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        Gerçek zamanlı, yüksek kaliteli görüntülü ve sesli iletişim
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-premium-lg transition-all duration-300 border-border/50 interactive group">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 to-success/10 group-hover:from-success/30 group-hover:to-success/20 transition-colors">
                      <Shield className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Güvenli & Özel</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        Parola korumalı odalar ve şifreli bağlantılar
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-premium-lg transition-all duration-300 border-border/50 interactive group">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 group-hover:from-purple-500/30 group-hover:to-purple-500/20 transition-colors">
                      <Zap className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Anında Başla</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        Kayıt gerekmez, hemen odanızı oluşturun ve paylaşın
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Create Room Modal - Premium */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in" 
          onClick={() => setShowCreateModal(false)}
        >
          <Card className="w-full max-w-md shadow-premium-xl animate-in" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-2xl gradient-text">Oda Oluştur</CardTitle>
              <CardDescription>Yeni bir video sohbet odası oluşturun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block" htmlFor="room-name-input">
                  Oda Adı
                </label>
                <Input
                  id="room-name-input"
                  placeholder="Oda adını girin"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={30}
                  className="focus-ring"
                  aria-label="Oda adı"
                  aria-required="true"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block" htmlFor="room-password-input">
                  Parola <span className="text-muted-foreground font-normal">(Opsiyonel)</span>
                </label>
                <Input
                  id="room-password-input"
                  type="password"
                  placeholder="Parola girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus-ring"
                  aria-label="Oda parolası (opsiyonel)"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block" htmlFor="room-limit-input">
                  Maksimum Katılımcı
                </label>
                <Input
                  id="room-limit-input"
                  type="number"
                  min="2"
                  max="20"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="focus-ring"
                  aria-label="Maksimum katılımcı sayısı"
                  aria-valuemin="2"
                  aria-valuemax="20"
                  aria-valuenow={limit}
                />
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
                aria-label="İptal et ve modalı kapat"
              >
                İptal
              </Button>
              <Button 
                onClick={handleCreateRoom} 
                className="flex-1 shadow-premium"
                aria-label="Oda oluştur"
              >
                Oluştur
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Join Room Modal - Premium */}
      {showJoinModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in" 
          onClick={() => setShowJoinModal(false)}
        >
          <Card className="w-full max-w-md shadow-premium-xl animate-in" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-2xl gradient-text">Odaya Katıl</CardTitle>
              <CardDescription>Mevcut bir odaya katılın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block" htmlFor="join-room-id-input">
                  Oda ID
                </label>
                <Input
                  id="join-room-id-input"
                  placeholder="Oda ID'sini girin"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="focus-ring"
                  aria-label="Katılmak istediğiniz oda ID'si"
                  aria-required="true"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block" htmlFor="join-room-password-input">
                  Parola <span className="text-muted-foreground font-normal">(Gerekirse)</span>
                </label>
                <Input
                  id="join-room-password-input"
                  type="password"
                  placeholder="Parola girin"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="focus-ring"
                  aria-label="Oda parolası (gerekirse)"
                />
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowJoinModal(false)}
                className="flex-1"
                aria-label="İptal et ve modalı kapat"
              >
                İptal
              </Button>
              <Button 
                onClick={handleJoinRoom} 
                className="flex-1 shadow-premium"
                aria-label="Odaya katıl"
              >
                Katıl
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Home;
