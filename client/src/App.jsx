import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Profile from './pages/Profile'
import Result from './pages/Result'
import Playbook from './pages/Playbook'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/result" element={<Result />} />
        <Route path="/playbook/:slug" element={<Playbook />} />
      </Routes>
    </div>
  )
}
