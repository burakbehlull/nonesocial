import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, AlertTriangle, LogOut, Menu, X, Eye, CheckCircle, 
  XCircle, Clock, Ban, Trash2, Send, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';

const AdminReports = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadReports();
  }, [pagination.page, filter]);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (!token || !adminUser) {
      navigate('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminUser));
  };

  const loadReports = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(filter.status && { status: filter.status }),
        ...(filter.category && { category: filter.category })
      });

      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Reports error:', error);
      toast.error('Raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (reportId) => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setSelectedReport(data.report);
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Rapor yüklenemedi');
    }
  };

  const handleUpdateStatus = async (status, notes = '') => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNotes: notes })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Durum güncellendi');
        setShowModal(false);
        loadReports();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleAction = async (actionType) => {
    const details = prompt(`${actionType} için detay girin (opsiyonel):`);
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport._id}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actionType, details })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Aksiyon gerçekleştirildi');
        setShowModal(false);
        loadReports();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleSendResponse = async () => {
    const message = prompt('Kullanıcıya gönderilecek mesaj:');
    if (!message) return;

    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport._id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Yanıt gönderildi');
        setShowModal(false);
        loadReports();
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

  const getCategoryColor = (category) => {
    const colors = {
      spam: 'bg-yellow-500/20 text-yellow-500',
      harassment: 'bg-red-500/20 text-red-500',
      inappropriate: 'bg-orange-500/20 text-orange-500',
      abuse: 'bg-purple-500/20 text-purple-500',
      other: 'bg-blue-500/20 text-blue-500'
    };
    return colors[category] || colors.other;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      reviewed: 'bg-blue-500/20 text-blue-500',
      resolved: 'bg-green-500/20 text-green-500',
      rejected: 'bg-red-500/20 text-red-500'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-500/20 text-gray-500',
      medium: 'bg-blue-500/20 text-blue-500',
      high: 'bg-red-500/20 text-red-500'
    };
    return colors[priority] || colors.medium;
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
            <Link to="/admin/rooms" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Shield className="w-5 h-5" />
              Odalar
            </Link>
            <Link to="/admin/reports" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
              <AlertTriangle className="w-5 h-5" />
              Raporlar
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
              <h2 className="text-2xl font-bold">Raporlar</h2>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="pending">Beklemede</option>
                  <option value="reviewed">İncelendi</option>
                  <option value="resolved">Çözüldü</option>
                  <option value="rejected">Reddedildi</option>
                </select>

                <select
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="">Tüm Kategoriler</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Taciz</option>
                  <option value="inappropriate">Uygunsuz İçerik</option>
                  <option value="abuse">Kötüye Kullanım</option>
                  <option value="other">Diğer</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() => setFilter({ status: '', category: '' })}
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Tüm Raporlar</CardTitle>
              <CardDescription>
                Toplam {pagination.total} rapor • Sayfa {pagination.page}/{pagination.pages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report._id} className="flex items-start justify-between p-4 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold">{report.subject}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(report.category)}`}>
                            {report.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(report.priority)}`}>
                            {report.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {report.roomId && <span>Oda: {report.roomId}</span>}
                          {report.userId && <span>Kullanıcı: {report.userId}</span>}
                          <span>
                            {new Date(report.createdAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleViewReport(report._id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        İncele
                      </Button>
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

      {/* Report Detail Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle>{selectedReport.subject}</CardTitle>
                  <CardDescription>
                    Rapor ID: {selectedReport._id}
                  </CardDescription>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(selectedReport.category)}`}>
                  {selectedReport.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(selectedReport.priority)}`}>
                  {selectedReport.priority} priority
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Açıklama</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              {/* Related Info */}
              <div className="grid grid-cols-2 gap-4">
                {selectedReport.roomId && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Oda ID</h4>
                    <p className="text-sm text-muted-foreground">{selectedReport.roomId}</p>
                  </div>
                )}
                {selectedReport.userId && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Kullanıcı ID</h4>
                    <p className="text-sm text-muted-foreground">{selectedReport.userId}</p>
                  </div>
                )}
                {selectedReport.reportedBy?.email && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Raporlayan Email</h4>
                    <p className="text-sm text-muted-foreground">{selectedReport.reportedBy.email}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold mb-1">Oluşturma Tarihi</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedReport.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedReport.adminNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Admin Notları</h3>
                  <p className="text-sm text-muted-foreground">{selectedReport.adminNotes}</p>
                </div>
              )}

              {/* Actions Taken */}
              {selectedReport.actions && selectedReport.actions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Alınan Aksiyonlar</h3>
                  <div className="space-y-2">
                    {selectedReport.actions.map((action, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{action.type}</span>
                          <span className="text-xs text-muted-foreground">
                            {action.performedBy} • {new Date(action.performedAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        {action.details && (
                          <p className="text-sm text-muted-foreground mt-1">{action.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <h3 className="font-semibold">Aksiyonlar</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpdateStatus('reviewed', prompt('Admin notları (opsiyonel):') || '')}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    İncelenmiş Olarak İşaretle
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpdateStatus('resolved')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Çözüldü Olarak İşaretle
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-red-500 hover:text-red-600"
                    onClick={() => handleUpdateStatus('rejected')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reddet
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSendResponse}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Yanıt Gönder
                  </Button>

                  {selectedReport.userId && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleAction('ban_user')}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Kullanıcıyı Yasakla
                    </Button>
                  )}

                  {selectedReport.roomId && admin?.role === 'superadmin' && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleAction('delete_room')}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Odayı Sil
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAction('warning')}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Uyarı Ver
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAction('no_action')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Aksiyon Gerekmiyor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
