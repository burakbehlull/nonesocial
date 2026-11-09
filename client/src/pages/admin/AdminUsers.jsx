import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Users, LogOut, Menu, X, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { adminApi } from '@/utils/api';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, [pagination.page]);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!token || !adminUser) {
      navigate('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminUser));
  };

  const loadUsers = async () => {
    try {
      const data = await adminApi(`/api/admin/users?page=${pagination.page}&limit=20`);

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Users error:', error);
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId) => {
    const reason = prompt('Ban sebebi:');
    if (!reason) return;
    
    try {
      const data = await adminApi(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason, duration: 30 })
      });

      if (data.success) {
        toast.success('Kullanıcı yasaklandı');
        loadUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar (aynı) */}
      <aside className={`fixed top-0 left-0 h-full bg-slate-900/95 backdrop-blur-sm border-r border-border/50 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        <div className={`h-full flex flex-col ${sidebarOpen ? '' : 'hidden'}`}>
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

          <nav className="flex-1 p-4 space-y-2">
            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Shield className="w-5 h-5" />
              Dashboard
            </Link>
            <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
              <Users className="w-5 h-5" />
              Kullanıcılar
            </Link>
            {admin?.role === 'superadmin' && (
              <Link to="/admin/users/detailed" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border-l-2 border-orange-500 ml-2">
                <Shield className="w-5 h-5 text-orange-500" />
                <span className="text-sm">Detaylı Kullanıcılar</span>
              </Link>
            )}
            <Link to="/admin/rooms" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Shield className="w-5 h-5" />
              Odalar
            </Link>
          </nav>

          <div className="p-4 border-t border-border/50">
            <div className="mb-3 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-semibold">{admin?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{admin?.role}</p>
            </div>
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-slate-900/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h2 className="text-2xl font-bold">Kullanıcılar</h2>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Tüm Kullanıcılar</CardTitle>
              <CardDescription>
                Toplam {pagination.total} kullanıcı • Sayfa {pagination.page}/{pagination.pages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex-1">
                        <p className="font-semibold">{user.userId}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.location?.country} • {user.browser?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {user.banned?.isBanned ? (
                          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-semibold">
                            Yasaklı
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-semibold">
                            Aktif
                          </span>
                        )}
                        {!user.banned?.isBanned && (
                          <Button size="sm" variant="destructive" onClick={() => handleBan(user.userId)}>
                            <Ban className="w-4 h-4 mr-1" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  Önceki
                </Button>
                <span className="px-4 py-2 text-sm">
                  {pagination.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Sonraki
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
