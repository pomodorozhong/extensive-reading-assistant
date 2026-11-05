import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Exam } from './pages/Exam'
import { LevelCheck } from './pages/LevelCheck'
import { MyStories } from './pages/MyStories'
import { NewStory } from './pages/NewStory'
import { SettingsPage } from './pages/Settings'
import { StoryExam } from './pages/StoryExam'
import { StoryView } from './pages/StoryView'
import { Vocabulary } from './pages/Vocabulary'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/new" replace />} />
        <Route path="/new" element={<NewStory />} />
        <Route path="/level-check" element={<LevelCheck />} />
        <Route path="/stories" element={<MyStories />} />
        <Route path="/stories/:id" element={<StoryView />} />
        <Route path="/stories/:id/exam" element={<StoryExam />} />
        <Route path="/dictionary" element={<Vocabulary />} />
        <Route path="/vocabulary" element={<Navigate to="/dictionary" replace />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
