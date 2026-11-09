import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Users, Video, Activity, LogOut, 
  TrendingUp, AlertCircle, Clock, Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { adminApi } from '@/utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!token || !adminUser) {
      navigate('/admin/login');
      return;
    }

    try {
      const data = await adminApi('/api/admin/verify');

      if (!data.success) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        return;
      }

      setAdmin(JSON.parse(adminUser));
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/admin/login');
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi('/api/admin/stats');

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Stats error:', error);
      toast.error('İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Çıkış yapıldı');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-slate-900/95 backdrop-blur-sm border-r border-border/50 
        transition-all duration-300 z-40
        ${sidebarOpen ? 'w-64' : 'w-0'}
      `}>
        <div className={`h-full flex flex-col ${sidebarOpen ? '' : 'hidden'}`}>
          {/* Logo */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">NoneSocial</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium"
            >
              <Activity className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Users className="w-5 h-5" />
              Kullanıcılar
            </Link>
            <Link
              to="/admin/rooms"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Video className="w-5 h-5" />
              Odalar
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <AlertCircle className="w-5 h-5" />
              Raporlar
            </Link>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-border/50">
            <div className="mb-3 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-semibold">{admin?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{admin?.role}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h2 className="text-2xl font-bold">Dashboard</h2>
            </div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Anasayfaya Dön
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardDescription>Toplam Kullanıcı</CardDescription>
                <CardTitle className="text-3xl font-bold">{stats?.total.users || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Son 24 saat: {stats?.last24h.newUsers || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Rooms */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardDescription>Toplam Oda</CardDescription>
                <CardTitle className="text-3xl font-bold">{stats?.total.rooms || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Son 24 saat: {stats?.last24h.newRooms || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardDescription>Aktif Oturum</CardDescription>
                <CardTitle className="text-3xl font-bold">{stats?.total.activeSessions || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Şu anda aktif</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Admins */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardDescription>Toplam Admin</CardDescription>
                <CardTitle className="text-3xl font-bold">{stats?.total.admins || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span>Aktif yönetici</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
              <CardDescription>Sık kullanılan yönetim işlemleri</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Users className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Kullanıcıları Yönet</div>
                    <div className="text-xs text-muted-foreground">Ban, unban ve detaylar</div>
                  </div>
                </Button>
              </Link>

              <Link to="/admin/rooms">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Video className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Odaları Yönet</div>
                    <div className="text-xs text-muted-foreground">Oda listesi ve silme</div>
                  </div>
                </Button>
              </Link>

              <Button variant="outline" className="w-full justify-start h-auto py-4" disabled>
                <AlertCircle className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Raporlar</div>
                  <div className="text-xs text-muted-foreground">Yakında eklenecek</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Son Aktivite
              </CardTitle>
              <CardDescription>Son 24 saatteki önemli olaylar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.last24h && (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">{stats.last24h.newUsers} yeni kullanıcı kaydı</p>
                        <p className="text-sm text-muted-foreground">Son 24 saat</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">{stats.last24h.newRooms} yeni oda oluşturuldu</p>
                        <p className="text-sm text-muted-foreground">Son 24 saat</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">{stats.last24h.newSessions} yeni oturum</p>
                        <p className="text-sm text-muted-foreground">Son 24 saat</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
