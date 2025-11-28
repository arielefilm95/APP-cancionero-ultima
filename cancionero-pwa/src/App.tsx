import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { hydrateSongs } from './db/client'
import { Home } from './pages/Home';
import { SongDetail } from './pages/SongDetail';
import './index.css'

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrateSongs().then(() => {
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-4 flex items-center justify-center h-screen">Cargando cancionero...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/song/:id" element={<SongDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
