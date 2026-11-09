import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Video, LogOut, Menu, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';

const AdminRooms = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuth();
    loadRooms();
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

  const loadRooms = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch(`/api/admin/rooms?page=${pagination.page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setRooms(data.rooms);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Rooms error:', error);
      toast.error('Odalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!confirm('Bu odayı silmek istediğinizden emin misiniz?')) return;

    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Oda silindi');
        loadRooms();
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
      {/* Sidebar */}
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
            <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Shield className="w-5 h-5" />
              Kullanıcılar
            </Link>
            <Link to="/admin/rooms" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
              <Video className="w-5 h-5" />
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
              <h2 className="text-2xl font-bold">Odalar</h2>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Tüm Odalar</CardTitle>
              <CardDescription>
                Toplam {pagination.total} oda • Sayfa {pagination.page}/{pagination.pages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div key={room._id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex-1">
                        <p className="font-semibold">{room.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {room.roomId} • Owner: {room.ownerId} • Üyeler: {room.members?.length || 0}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-xs font-semibold capitalize">
                          {room.status}
                        </span>
                        {admin?.role === 'superadmin' && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(room.roomId)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Sil
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

export default AdminRooms;
