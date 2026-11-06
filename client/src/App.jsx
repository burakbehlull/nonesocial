import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@contexts/ThemeContext'
import Home from '@pages/Home'
import Room from '@pages/Room'
import RoomSimple from '@pages/RoomSimple'
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
              background: '#333',
              color: '#fff',
            }
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<RoomSimple />} />
          <Route path="/room-old/:roomId" element={<Room />} />
          <Route path="/test" element={<WebRTCTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
