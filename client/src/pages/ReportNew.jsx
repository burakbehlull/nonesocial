import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, ArrowLeft, Send, Copy, Check,
  User, MessageSquare, Video, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import Footer from '@components/Footer';

const ReportNew = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    roomId: '',
    userId: '',
    description: '',
    email: ''
  });
  const [copied, setCopied] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'spam', label: 'Spam / Reklam', icon: MessageSquare, color: 'text-yellow-500' },
    { value: 'harassment', label: 'Taciz / Rahatsız Edici Davranış', icon: User, color: 'text-red-500' },
    { value: 'inappropriate', label: 'Uygunsuz İçerik', icon: AlertTriangle, color: 'text-orange-500' },
    { value: 'abuse', label: 'Kötüye Kullanım', icon: Shield, color: 'text-purple-500' },
    { value: 'other', label: 'Diğer', icon: Video, color: 'text-blue-500' }
  ];

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success('Kopyalandı!');
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast.error('Lütfen bir kategori seçin');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Lütfen konu başlığı girin');
      return;
    }

    // Oda ID veya Kullanıcı ID'den en az biri zorunlu
    if (!formData.roomId.trim() && !formData.userId.trim()) {
      toast.error('Lütfen Oda ID veya Kullanıcı ID girin (en az biri zorunlu)');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Lütfen açıklama girin');
      return;
    }

    if (formData.description.trim().length < 10) {
      toast.error('Açıklama en az 10 karakter olmalıdır');
      return;
    }

    setIsSubmitting(true);

    // TODO: Backend'e gönder
    // Şimdilik console'a yazdır
    console.log('Report submitted:', formData);

    // Simulated API call
    setTimeout(() => {
      toast.success('Raporunuz başarıyla gönderildi!');
      setIsSubmitting(false);
      
      // Reset form
      setFormData({
        category: '',
        subject: '',
        roomId: '',
        userId: '',
        description: '',
        email: ''
      });

      // Navigate back to support after 2 seconds
      setTimeout(() => {
        navigate('/support');
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold gradient-text">None Social</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/support" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </Link>
            <Link 
              to="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Anasayfa</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-500">Rapor Gönder</span>
            </div>
            <h1 className="text-4xl font-bold gradient-text">Kötüye Kullanım Bildir</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Platformda karşılaştığınız uygunsuz davranışları, spam veya kötüye kullanımı bildirin
            </p>
          </div>

          {/* Instructions Card */}
          <Card className="border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Rapor Göndermeden Önce
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p>
                  <strong>Oda ID'sini kopyalayın:</strong> Oda sayfasında URL'deki ID'yi (örn: /room/<code className="text-primary">abc123</code>) kopyalayın
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p>
                  <strong>Kullanıcı ID'sini kopyalayın:</strong> Raporlamak istediğiniz kullanıcının üzerine geldiğinizde ID gösterilir
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p>
                  <strong>Detaylı açıklama yazın:</strong> Ne olduğunu, ne zaman olduğunu ve neden raporladığınızı belirtin
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Report Form */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Rapor Formu</CardTitle>
              <CardDescription>
                Tüm alanları doldurarak raporunuzu gönderin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Category Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold block">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.value })}
                          className={`
                            p-4 rounded-lg border-2 transition-all text-left
                            ${formData.category === cat.value 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50 bg-card'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${cat.color}`} />
                            <span className="font-medium text-sm">{cat.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-semibold block">
                    Konu Başlığı <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="subject"
                    placeholder="Örn: Odada spam yapan kullanıcı"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    maxLength={100}
                    className="flex-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Raporunuzu kısaca özetleyen bir başlık ({formData.subject.length}/100)
                  </p>
                </div>

                {/* Room ID & User ID - At least one required */}
                <div className="space-y-4 p-4 rounded-lg border-2 border-orange-500/20 bg-orange-500/5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      Aşağıdaki alanlardan <strong>en az birini</strong> doldurun
                    </p>
                  </div>

                  {/* Room ID */}
                  <div className="space-y-2">
                    <label htmlFor="roomId" className="text-sm font-semibold block">
                      Oda ID
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="roomId"
                        placeholder="Örn: abc123xy"
                        value={formData.roomId}
                        onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                        className="flex-1"
                      />
                      {formData.roomId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(formData.roomId, 'roomId')}
                        >
                          {copied === 'roomId' ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      URL'den kopyalayın: /room/<strong>abc123xy</strong>
                    </p>
                  </div>

                  {/* User ID */}
                  <div className="space-y-2">
                    <label htmlFor="userId" className="text-sm font-semibold block">
                      Kullanıcı ID
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="userId"
                        placeholder="Raporlamak istediğiniz kullanıcının ID'si"
                        value={formData.userId}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                        className="flex-1"
                      />
                      {formData.userId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(formData.userId, 'userId')}
                        >
                          {copied === 'userId' ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-semibold block">
                    Açıklama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    placeholder="Lütfen detaylı bir şekilde ne olduğunu anlatın..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 karakter ({formData.description.length}/10)
                  </p>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold block">
                    E-posta <span className="text-muted-foreground text-xs font-normal">(Opsiyonel - Geri dönüş için)</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    E-posta adresiniz gizli tutulacak ve sadece size geri dönüş için kullanılacaktır
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/support')}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Rapor Gönder
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-border/50 bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Raporunuz Gizli Tutulacaktır</h3>
                  <p className="text-xs text-muted-foreground">
                    Gönderdiğiniz raporlar ekibimiz tarafından incelenecek ve gerekli önlemler alınacaktır. 
                    Kimliğiniz rapor edilen kişiye bildirilmeyecektir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ReportNew;
