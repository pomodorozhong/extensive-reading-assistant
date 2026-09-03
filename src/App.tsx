import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { MyStories } from './pages/MyStories'
import { NewStory } from './pages/NewStory'
import { SettingsPage } from './pages/Settings'
import { StoryView } from './pages/StoryView'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewStory />} />
        <Route path="/stories" element={<MyStories />} />
        <Route path="/stories/:id" element={<StoryView />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
