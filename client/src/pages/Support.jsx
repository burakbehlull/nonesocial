import { Link } from 'react-router-dom';
import { 
  Shield, Database, Clock, Info, ArrowLeft, 
  Lock, Eye, Trash2, MapPin, Globe, Smartphone,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import Footer from '@components/Footer';

const Support = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header / Navbar */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-base sm:text-lg">N</span>
            </div>
            <span className="text-lg sm:text-xl font-bold gradient-text">None Social</span>
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium hidden xs:inline">Anasayfa</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
          
          {/* Hero Section */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-2 sm:mb-4">
              <Info className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary">Destek & Bilgilendirme</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">Support</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
              None Social platformunda toplanan veriler, gizlilik politikamız ve veri saklama süreleri hakkında detaylı bilgiler
            </p>
          </div>

          {/* Veri Gizliliği */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Veri Gizliliği</h2>
            </div>
            
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Gizlilik Taahhüdümüz
                </CardTitle>
                <CardDescription>
                  None Social, kullanıcı gizliliğini ön planda tutar ve GDPR uyumlu çalışır
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Eye className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Anonim Kullanım</h3>
                      <p className="text-sm text-muted-foreground">
                        Kayıt gerektirmiyoruz. Gerçek kimliğinizi paylaşmanız gerekmiyor.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Shield className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">IP Adresi Koruması</h3>
                      <p className="text-sm text-muted-foreground">
                        IP adresiniz <strong>SHA256 + salt ile hash'lenerek</strong> saklanır. 
                        Gerçek IP adresiniz asla düz metin olarak kaydedilmez.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Trash2 className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Otomatik Silme</h3>
                      <p className="text-sm text-muted-foreground">
                        Verileriniz belirli süreler sonra otomatik olarak kalıcı şekilde silinir.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Toplanan Veriler */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                <Database className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Toplanan Veriler</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Konum Bilgisi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Ülke ve şehir bilgisi (IP'den)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Konum bilgisi yalnızca istatistiksel amaçlarla toplanır ve kullanıcıyı tanımlamak için kullanılmaz.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="w-5 h-5 text-green-500" />
                    Tarayıcı Bilgisi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Tarayıcı adı ve versiyonu</li>
                    <li>• İşletim sistemi</li>
                    <li>• Cihaz tipi (masaüstü/mobil)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Uyumluluğu artırmak ve performansı optimize etmek için kullanılır.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="w-5 h-5 text-orange-500" />
                    Kullanım İstatistikleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Katıldığınız oda sayısı</li>
                    <li>• Gönderdiğiniz mesaj sayısı</li>
                    <li>• Toplam çağrı süresi</li>
                    <li>• Oluşturduğunuz odalar</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Platform iyileştirmeleri için anonim istatistik olarak kullanılır.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lock className="w-5 h-5 text-red-500" />
                    Oda Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Oda adı ve ID</li>
                    <li>• Oda sahibi</li>
                    <li>• Katılan üyeler ve süreleri</li>
                    <li>• Mesaj ve çağrı istatistikleri</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Oda geçmişi yalnızca kısa süre saklanır ve otomatik silinir.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Veri Saklama Süreleri */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-success/20 to-success/10">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Veri Saklama Süreleri</h2>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Otomatik Silme Politikası</CardTitle>
                <CardDescription>
                  Tüm veriler belirli süreler sonra MongoDB TTL (Time To Live) mekanizması ile otomatik silinir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 bg-card">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                      <span className="text-xl sm:text-2xl font-bold text-primary">7</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">gün</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">Oturum Kayıtları</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Bağlantı logları, ziyaret edilen odalar, session events gibi geçici veriler 
                        <strong> 7 gün</strong> sonra otomatik silinir.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 bg-card">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-purple-500/10 flex flex-col items-center justify-center">
                      <span className="text-xl sm:text-2xl font-bold text-purple-500">30</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">gün</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">Oda Geçmişi</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Oda bilgileri, üye kayıtları ve istatistikler 
                        <strong> 30 gün</strong> sonra kalıcı olarak silinir.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/50 bg-card">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-success/10 flex flex-col items-center justify-center">
                      <span className="text-xl sm:text-2xl font-bold text-success">90</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">gün</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">Kullanıcı Verileri</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Kullanıcı istatistikleri, konum ve tarayıcı bilgileri inactive kullanıcılar için 
                        <strong> 90 gün</strong> sonra otomatik silinir.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Önemli Notlar */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Önemli Notlar</h2>
            </div>

            <Card className="border-border/50 bg-muted/50">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Video ve ses kayıtları saklanmaz.</strong> Tüm görüntülü ve sesli iletişim 
                    peer-to-peer (WebRTC) teknolojisi ile gerçekleşir ve sunucularımızdan geçmez.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Mesaj içerikleri hash'lenmez.</strong> Ancak sadece oda açık olduğu sürece 
                    bellekte tutulur, veritabanına kaydedilmez.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Üçüncü taraflara veri satmıyoruz.</strong> Toplanan veriler yalnızca 
                    platform iyileştirmeleri için kullanılır.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>GDPR uyumlu çalışıyoruz.</strong> Verilerinizin silinmesini istiyorsanız 
                    bizimle iletişime geçebilirsiniz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Rapor Gönder */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Kötüye Kullanım Bildir</h2>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Rapor Gönderme</CardTitle>
                <CardDescription>
                  Platformda karşılaştığınız uygunsuz davranışları bize bildirin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Spam, taciz, uygunsuz içerik veya diğer kötüye kullanımları raporlamak için:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">Oda ID'sini Kopyalayın</h3>
                      <p className="text-xs text-muted-foreground">
                        Oda sayfasındaki URL'den ID'yi kopyalayın (örn: /room/<strong>abc123</strong>)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">Kullanıcı ID'sini Alın</h3>
                      <p className="text-xs text-muted-foreground">
                        Raporlamak istediğiniz kullanıcının ID'sini not edin
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">Rapor Formu</h3>
                      <p className="text-xs text-muted-foreground">
                        Aşağıdaki butona tıklayarak rapor formunu doldurun
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4">
                  <Link
                    to="/report/new"
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-semibold shadow-lg w-full justify-center text-sm sm:text-base"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Rapor Gönder
                  </Link>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm">Gizlilik Garantisi</h3>
                    <p className="text-xs text-muted-foreground">
                      Raporlarınız tamamen gizli tutulur ve kimliğiniz rapor edilen kişiye bildirilmez.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* İletişim */}
          <section className="text-center py-6 sm:py-8">
            <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 px-4">
              <h3 className="text-xl sm:text-2xl font-bold">Sorularınız mı var?</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Veri gizliliği ve güvenlik hakkında daha fazla bilgi almak için 
                bizimle iletişime geçebilirsiniz.
              </p>
              <Link 
                to="/"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold shadow-lg text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4" />
                Anasayfaya Dön
              </Link>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Support;
