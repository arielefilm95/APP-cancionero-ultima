import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Layout } from '../components/Layout';
import { getAllSongs, searchSongs } from '../db/songs';
import type { Song } from '../db/client';

export function Home() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSongs();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                searchSongs(query).then(setSongs);
            } else {
                loadSongs();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    async function loadSongs() {
        const allSongs = await getAllSongs();
        setSongs(allSongs);
        setLoading(false);
    }

    return (
        <Layout>
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Buscar canción..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando canciones...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {songs.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No se encontraron canciones</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {songs.map((song) => (
                                <li key={song.id}>
                                    <Link
                                        to={`/song/${song.id}`}
                                        className="block p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="font-medium text-gray-900">{song.title}</div>
                                        {song.artist && (
                                            <div className="text-sm text-gray-500">{song.artist}</div>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </Layout>
    );
}
