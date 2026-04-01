import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminDashboard from './pages/admin/AdminDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
