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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      {/* Dark Mode Toggle - Top Right */}
      <div className="fixed top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10 rounded-full"
        >
          {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </Button>
      </div>

      <div className="w-full max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <FiVideo className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            None Social
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Kayıt olmadan, anonim olarak görüntülü sohbet et
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 max-w-md mx-auto">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => setShowCreateModal(true)}
          >
            <FiVideo className="w-5 h-5 mr-2" />
            Yeni Oda
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setShowJoinModal(true)}
          >
            <FiLogIn className="w-5 h-5 mr-2" />
            Odaya Katıl
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <FiVideo className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Video & Ses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerçek zamanlı görüntülü görüşme
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FiLock className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Özel Odalar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Parola korumalı odalar oluştur
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FiUsers className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Grup Görüşmeleri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Birden fazla kişiyle konuş
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

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
