import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { hydrateSongs } from './db/client'
import { Home } from './pages/Home';
import { SongDetail } from './pages/SongDetail';
import './index.css'

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrateSongs().then(() => {
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError(err.message || "Error desconocido al cargar la base de datos");
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-4 flex items-center justify-center h-screen">Cargando cancionero...</div>;

  if (error) return (
    <div className="p-4 flex flex-col items-center justify-center h-screen text-red-600">
      <h2 className="text-xl font-bold mb-2">Error de Inicialización</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Reintentar</button>
    </div>
  );

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
