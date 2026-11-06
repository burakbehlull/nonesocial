import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiLock, FiUsers, FiLogIn, FiMoon, FiSun } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getSocket } from '@services/socket';
import { validateRoomName, validatePassword } from '@utils/helpers';
import { useTheme } from '@contexts/ThemeContext';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card';
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
        // Toast will be shown in Room component
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Dark Mode Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10 rounded-full"
        >
          {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Hero */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                  <FiVideo className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    None Social
                  </span>
                </h1>
                <p className="text-muted-foreground text-xl leading-relaxed max-w-md">
                  Kayıt olmadan, anonim olarak görüntülü sohbet et
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FiVideo className="w-5 h-5 mr-2" />
                  Yeni Oda
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={() => setShowJoinModal(true)}
                >
                  <FiLogIn className="w-5 h-5 mr-2" />
                  Odaya Katıl
                </Button>
              </div>
            </div>

            {/* Right Side - Features */}
            <div className="grid gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <FiVideo className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Video & Ses</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Gerçek zamanlı görüntülü görüşme
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <FiLock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Özel Odalar</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Parola korumalı odalar oluştur
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <FiUsers className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Grup Görüşmeleri</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Birden fazla kişiyle konuş
                      </p>
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

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Oda Oluştur</CardTitle>
              <CardDescription>Yeni bir video sohbet odası oluştur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Oda Adı</label>
                <Input
                  placeholder="Oda adını girin"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={30}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Parola (Opsiyonel)</label>
                <Input
                  type="password"
                  placeholder="Parola girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Maksimum Katılımcı</label>
                <Input
                  type="number"
                  min="2"
                  max="20"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                />
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button onClick={handleCreateRoom} className="flex-1">
                Oluştur
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Odaya Katıl</CardTitle>
              <CardDescription>Mevcut bir odaya katıl</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Oda ID</label>
                <Input
                  placeholder="Oda ID'sini girin"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Parola (Gerekirse)</label>
                <Input
                  type="password"
                  placeholder="Parola girin"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowJoinModal(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button onClick={handleJoinRoom} className="flex-1">
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
