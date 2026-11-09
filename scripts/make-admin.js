import mongoose from 'mongoose';
import readline from 'readline';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 30) {
    return 'Kullanıcı adı 3-30 karakter olmalıdır';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir';
  }
  return null;
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Şifre en az 8 karakter olmalıdır';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Şifre en az bir büyük harf içermelidir';
  }
  if (!/[a-z]/.test(password)) {
    return 'Şifre en az bir küçük harf içermelidir';
  }
  if (!/[0-9]/.test(password)) {
    return 'Şifre en az bir rakam içermelidir';
  }
  return null;
};

const createAdmin = async () => {
  try {
    console.log('\n🔒 NoneSocial Admin Oluşturma Scripti\n');
    console.log('MongoDB bağlantısı kuruluyor...\n');

    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI bulunamadı! .env dosyasını kontrol edin.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Get username
    let username;
    while (true) {
      username = await question('Kullanıcı Adı: ');
      const usernameError = validateUsername(username);
      
      if (usernameError) {
        console.log(`❌ ${usernameError}\n`);
        continue;
      }

      // Check if username exists
      const existingAdmin = await Admin.findOne({ username: username.toLowerCase() });
      if (existingAdmin) {
        console.log(`❌ Bu kullanıcı adı zaten kullanımda!\n`);
        continue;
      }

      break;
    }

    // Get password
    let password;
    while (true) {
      // Note: readline doesn't hide input, but we'll add instructions
      console.log('\n⚠️  Not: Şifre ekranda görünecektir. Güvenli bir ortamda olduğunuzdan emin olun.');
      password = await question('\nŞifre (min 8 karakter, büyük/küçük harf ve rakam): ');
      
      const passwordError = validatePassword(password);
      if (passwordError) {
        console.log(`❌ ${passwordError}\n`);
        continue;
      }

      const passwordConfirm = await question('Şifre (Tekrar): ');
      if (password !== passwordConfirm) {
        console.log('❌ Şifreler eşleşmiyor!\n');
        continue;
      }

      break;
    }

    // Get role
    console.log('\nRol seçin:');
    console.log('1. admin (Normal admin - çoğu yetkiye sahip)');
    console.log('2. superadmin (Süper admin - tüm yetkilere sahip)\n');
    
    let roleChoice = await question('Rol (1 veya 2): ');
    while (!['1', '2'].includes(roleChoice)) {
      console.log('❌ Geçersiz seçim!\n');
      roleChoice = await question('Rol (1 veya 2): ');
    }
    
    const role = roleChoice === '2' ? 'superadmin' : 'admin';

    // Confirm
    console.log('\n📋 Özet:');
    console.log(`   Kullanıcı Adı: ${username}`);
    console.log(`   Rol: ${role}`);
    console.log(`   Şifre: ${'*'.repeat(password.length)}\n`);

    const confirm = await question('Onaylıyor musunuz? (evet/hayır): ');
    if (confirm.toLowerCase() !== 'evet') {
      console.log('\n❌ İptal edildi.');
      process.exit(0);
    }

    // Create admin
    const admin = await Admin.create({
      username: username.toLowerCase(),
      password,
      role,
      createdBy: 'script',
      permissions: role === 'superadmin' ? {
        viewRooms: true,
        viewUsers: true,
        viewReports: true,
        banUsers: true,
        deleteRooms: true,
        viewLogs: true
      } : {
        viewRooms: true,
        viewUsers: true,
        viewReports: true,
        banUsers: true,
        deleteRooms: false,
        viewLogs: true
      }
    });

    console.log('\n✅ Admin başarıyla oluşturuldu!');
    console.log(`\n📝 Admin ID: ${admin._id}`);
    console.log(`   Kullanıcı Adı: ${admin.username}`);
    console.log(`   Rol: ${admin.role}`);
    console.log(`\n🔐 Giriş için: /admin/login sayfasını kullanın\n`);

  } catch (error) {
    console.error('\n❌ Hata oluştu:', error.message);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();
