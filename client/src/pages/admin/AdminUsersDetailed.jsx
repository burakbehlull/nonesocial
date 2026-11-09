import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { 
  Shield, Users, LogOut, Menu, X, Ban, CheckCircle, Eye,
  MapPin, Monitor, Clock, MessageSquare, Phone, ChevronLeft,
  Edit2, Save, XCircle as XIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { adminApi } from '@/utils/api';

const AdminUsersDetailed = () => {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, [pagination.page]);

  useEffect(() => {
    if (urlUserId) {
      loadUserDetails(urlUserId);
    }
  }, [urlUserId]);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!token || !adminUser) {
      navigate('/admin/login');
      return;
    }

    const parsedAdmin = JSON.parse(adminUser);
    
    // Check if superadmin
    if (parsedAdmin.role !== 'superadmin') {
      toast.error('Bu sayfaya erişim yetkiniz yok!');
      navigate('/admin/dashboard');
      return;
    }

    setAdmin(parsedAdmin);
  };

  const loadUsers = async () => {
    try {
      const data = await adminApi(`/api/admin/users/detailed?page=${pagination.page}&limit=50`);

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

  const loadUserDetails = async (userId) => {
    try {
      const data = await adminApi(`/api/admin/users/${userId}/details`);

      if (data.success) {
        setUserDetails(data);
        setSelectedUser(data.user);
        setEditData({
          location: data.user.location,
          browser: data.user.browser
        });
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('User details error:', error);
      toast.error('Kullanıcı detayları yüklenemedi');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const data = await adminApi(`/api/admin/users/${selectedUser.userId}`, {
        method: 'PATCH',
        body: JSON.stringify(editData)
      });

      if (data.success) {
        toast.success('Kullanıcı güncellendi');
        setEditMode(false);
        loadUserDetails(selectedUser.userId);
        loadUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Güncelleme başarısız');
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
        if (selectedUser?.userId === userId) {
          loadUserDetails(userId);
        }
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

  const formatDate = (date) => {
    if (!date) return 'Hiçbir zaman';
    return new Date(date).toLocaleString('tr-TR');
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
              <Users className="w-5 h-5" />
              Kullanıcılar
            </Link>
            <Link to="/admin/users/detailed" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
              <Eye className="w-5 h-5" />
              Detaylı Kullanıcılar
            </Link>
            <Link to="/admin/rooms" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Shield className="w-5 h-5" />
              Odalar
            </Link>
            <Link to="/admin/reports" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Shield className="w-5 h-5" />
              Raporlar
            </Link>
          </nav>

          <div className="p-4 border-t border-border/50">
            <div className="mb-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm font-semibold text-orange-500 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {admin?.username}
              </p>
              <p className="text-xs text-orange-400 uppercase">{admin?.role}</p>
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
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Eye className="w-6 h-6 text-orange-500" />
                  Detaylı Kullanıcı Listesi
                </h2>
                <p className="text-sm text-muted-foreground">Superadmin - Gerçek IP adresleri ve tüm detaylar</p>
              </div>
            </div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Anasayfaya Dön
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Banner */}
          <Card className="border-orange-500/50 bg-orange-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-orange-500">Superadmin Erişimi</h3>
                  <p className="text-sm text-orange-400/80">
                    Bu sayfada kullanıcıların gerçek IP adresleri, lokasyonları ve tüm hassas verileri görüntülenir. 
                    GDPR ve gizlilik kurallarına uygun olarak kullanın.
                  </p>
                  <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs">
                    <p className="text-orange-300 font-medium mb-1">📝 Not:</p>
                    <p className="text-orange-400/70">
                      <strong>Eski kullanıcılar:</strong> Sistem güncellemesinden önce kaydolan kullanıcıların gerçek IP adresleri saklanmamıştır. 
                      Bu kullanıcılar için sadece hash gösterilir. Kullanıcı yeniden bağlandığında gerçek IP kaydedilecektir.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcılar ({pagination.total})</CardTitle>
              <CardDescription>Tüm kullanıcı detayları ve IP adresleri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-semibold">Kullanıcı ID</th>
                      <th className="pb-3 font-semibold">IP Adresi</th>
                      <th className="pb-3 font-semibold">Konum</th>
                      <th className="pb-3 font-semibold">Tarayıcı</th>
                      <th className="pb-3 font-semibold">İlk Görülme</th>
                      <th className="pb-3 font-semibold">Son Aktif</th>
                      <th className="pb-3 font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.userId}
                          </code>
                        </td>
                        <td className="py-4">
                          {user.ipAddress ? (
                            <code className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded border border-orange-500/20">
                              {user.ipAddress}
                            </code>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {user.ipHash?.substring(0, 16)}...
                              </code>
                              <span className="text-[10px] text-muted-foreground">
                                (Hash - Gerçek IP yok)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">
                              {user.location?.city}, {user.location?.country}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">
                              {user.browser?.name} - {user.browser?.os}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {formatDate(user.firstSeen)}
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {formatDate(user.stats?.lastActive)}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadUserDetails(user.userId)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {user.banned?.isBanned ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-500/10 text-green-500 border-green-500/20"
                                onClick={() => toast.info('Unban özelliği yakında')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 hover:bg-red-500/10"
                                onClick={() => handleBan(user.userId)}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  >
                    Önceki
                  </Button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Sayfa {pagination.page} / {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  >
                    Sonraki
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedUser && userDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-border sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Eye className="w-5 h-5 text-orange-500" />
                    Kullanıcı Detayları
                  </h3>
                  <code className="text-sm text-muted-foreground">{selectedUser.userId}</code>
                </div>
                <div className="flex items-center gap-2">
                  {!editMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(false)}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDetailModal(false);
                      setEditMode(false);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* IP & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-orange-500" />
                      IP Adresi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-lg font-mono text-orange-500">
                      {selectedUser.ipAddress}
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Hash: {selectedUser.ipHash?.substring(0, 16)}...
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      Konum
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Şehir"
                          value={editData.location?.city || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            location: { ...editData.location, city: e.target.value }
                          })}
                        />
                        <Input
                          placeholder="Ülke"
                          value={editData.location?.country || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            location: { ...editData.location, country: e.target.value }
                          })}
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-lg">{selectedUser.location?.city}, {selectedUser.location?.country}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.location?.timezone}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Browser */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-purple-500" />
                    Tarayıcı & Cihaz
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Tarayıcı</p>
                      <p className="font-medium">{selectedUser.browser?.name} {selectedUser.browser?.version}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">İşletim Sistemi</p>
                      <p className="font-medium">{selectedUser.browser?.os}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cihaz</p>
                      <p className="font-medium capitalize">{selectedUser.browser?.device}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <MessageSquare className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{selectedUser.stats?.totalMessages || 0}</p>
                    <p className="text-xs text-muted-foreground">Mesaj</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Users className="w-8 h-8 text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">{selectedUser.stats?.totalRooms || 0}</p>
                    <p className="text-xs text-muted-foreground">Oda</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Phone className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{selectedUser.stats?.totalCallMinutes || 0}</p>
                    <p className="text-xs text-muted-foreground">Dakika Arama</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Clock className="w-8 h-8 text-orange-500 mb-2" />
                    <p className="text-2xl font-bold">{userDetails.sessions?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Oturum</p>
                  </CardContent>
                </Card>
              </div>

              {/* Times */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Zaman Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">İlk Görülme</p>
                      <p className="font-medium">{formatDate(selectedUser.firstSeen)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Son Görülme</p>
                      <p className="font-medium">{formatDate(selectedUser.lastSeen)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Son Aktif</p>
                      <p className="font-medium">{formatDate(selectedUser.stats?.lastActive)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ban Status */}
              {selectedUser.banned?.isBanned && (
                <Card className="border-red-500/50 bg-red-500/10">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                      <Ban className="w-4 h-4" />
                      Yasaklı Kullanıcı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p><strong>Sebep:</strong> {selectedUser.banned.bannedReason}</p>
                    <p><strong>Yasaklayan:</strong> {selectedUser.banned.bannedBy}</p>
                    <p><strong>Tarih:</strong> {formatDate(selectedUser.banned.bannedAt)}</p>
                    {selectedUser.banned.bannedUntil && (
                      <p><strong>Bitiş:</strong> {formatDate(selectedUser.banned.bannedUntil)}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersDetailed;
