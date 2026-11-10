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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobilde kapalı başlasın

  // Ekran boyutu değişimini dinle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize(); // İlk yükleme
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-slate-900/95 backdrop-blur-sm border-r border-border/50 
        transition-transform duration-300 z-40 w-64
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-base sm:text-lg">Admin Panel</h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">NoneSocial</p>
                </div>
              </div>
              <button 
                className="lg:hidden p-1 hover:bg-muted rounded"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium text-sm"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-sm"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Kullanıcılar
            </Link>
            {admin?.role === 'superadmin' && (
              <Link
                to="/admin/users/detailed"
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border-l-2 border-orange-500 ml-2 text-sm"
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                <span className="text-xs sm:text-sm">Detaylı Kullanıcılar</span>
              </Link>
            )}
            <Link
              to="/admin/rooms"
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-sm"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
            >
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              Odalar
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-sm"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
            >
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Raporlar
            </Link>
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 sm:p-4 border-t border-border/50">
            <div className="mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg bg-muted/50">
              <p className="text-xs sm:text-sm font-semibold truncate">{admin?.username}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">{admin?.role}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10 text-sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg sm:text-2xl font-bold">Dashboard</h2>
            </div>
            <Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              ← Anasayfaya Dön
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Total Users */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardDescription className="text-xs sm:text-sm">Toplam Kullanıcı</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl font-bold">{stats?.total.users || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span>Son 24 saat: {stats?.last24h.newUsers || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Rooms */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardDescription className="text-xs sm:text-sm">Toplam Oda</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl font-bold">{stats?.total.rooms || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span>Son 24 saat: {stats?.last24h.newRooms || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardDescription className="text-xs sm:text-sm">Aktif Oturum</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl font-bold">{stats?.total.activeSessions || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span>Şu anda aktif</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Admins */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardDescription className="text-xs sm:text-sm">Toplam Admin</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl font-bold">{stats?.total.admins || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
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
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start h-auto py-3 sm:py-4 text-sm">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-xs sm:text-sm">Kullanıcıları Yönet</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Ban, unban ve detaylar</div>
                  </div>
                </Button>
              </Link>

              <Link to="/admin/rooms">
                <Button variant="outline" className="w-full justify-start h-auto py-3 sm:py-4 text-sm">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-xs sm:text-sm">Odaları Yönet</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Oda listesi ve silme</div>
                  </div>
                </Button>
              </Link>

              <Button variant="outline" className="w-full justify-start h-auto py-3 sm:py-4 text-sm" disabled>
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-xs sm:text-sm">Raporlar</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Yakında eklenecek</div>
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

          {/* Recent Users - Superadmin Only */}
          {admin?.role === 'superadmin' && stats?.recentUsers && stats.recentUsers.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Son Kullanıcılar
                  <span className="ml-auto text-xs font-normal text-muted-foreground">Superadmin</span>
                </CardTitle>
                <CardDescription>Son 10 aktif kullanıcı ve IP adresleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentUsers.map((user, index) => (
                    <div key={user.userId} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 text-primary font-semibold text-xs sm:text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <code className="text-[10px] sm:text-xs font-mono bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded break-all">
                          {user.userId}
                        </code>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                          <span>{user.location?.city}, {user.location?.country}</span>
                          <span>•</span>
                          <span>{user.browser?.name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-1 w-full sm:w-auto">
                        <code className="text-[10px] sm:text-xs bg-orange-500/10 text-orange-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-500/20 font-mono">
                          {user.ipAddress || 'N/A'}
                        </code>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {user.lastSeen ? new Date(user.lastSeen).toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/admin/users/detailed" className="block mt-3 sm:mt-4">
                  <Button variant="outline" className="w-full text-sm">
                    Tümünü Gör →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
