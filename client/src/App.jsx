import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@contexts/ThemeContext'
import Home from '@pages/Home'
import Room from '@pages/Room'
import Support from '@pages/Support'
import ReportNew from '@pages/ReportNew'
import AdminLogin from '@pages/admin/AdminLogin'
import AdminDashboard from '@pages/admin/AdminDashboard'
import AdminUsers from '@pages/admin/AdminUsers'
import AdminUsersDetailed from '@pages/admin/AdminUsersDetailed'
import AdminRooms from '@pages/admin/AdminRooms'
import AdminReports from '@pages/admin/AdminReports'
import WebRTCTest from '@pages/WebRTCTest'
import NotFound from '@pages/NotFound'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontWeight: '500',
              fontSize: '14px',
              maxWidth: '500px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#8b5cf6',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/support" element={<Support />} />
          <Route path="/report/new" element={<ReportNew />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/detailed" element={<AdminUsersDetailed />} />
          <Route path="/admin/users/detailed/:userId" element={<AdminUsersDetailed />} />
          <Route path="/admin/rooms" element={<AdminRooms />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          
          <Route path="/test" element={<WebRTCTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
