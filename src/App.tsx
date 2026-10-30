import { Routes, Route } from 'react-router-dom'
import InvitePage from './pages/InvitePage'
import AdminPage from './pages/AdminPage'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/invite" element={<InvitePage />} />
      <Route path="/invite/:inviteId" element={<InvitePage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
