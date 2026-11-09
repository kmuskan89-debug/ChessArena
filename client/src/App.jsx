import { Routes, Route } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h1>Chess Arena</h1>
            <p>MERN stack starter template initialized.</p>
          </div>
        }
      />
    </Routes>
  )
}

export default App
