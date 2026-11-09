import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Play from './pages/Play.jsx';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
