import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Layout } from '../components/Layout';
import { getSongById } from '../db/songs';
import type { Song } from '../db/client';

export function SongDetail() {
    const { id } = useParams<{ id: string }>();
    const [song, setSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            getSongById(Number(id)).then((s) => {
                setSong(s);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="text-center py-8 text-gray-500">Cargando canción...</div>
            </Layout>
        );
    }

    if (!song) {
        return (
            <Layout>
                <div className="text-center py-8 text-red-500">Canción no encontrada</div>
                <Link to="/" className="block text-center text-blue-600 hover:underline">
                    Volver al inicio
                </Link>
            </Layout>
        );
    }

    return (
        <Layout title={song.title}>
            <div className="mb-4">
                <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 min-h-[50vh]">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{song.title}</h1>
                {song.artist && (
                    <p className="text-gray-500 mb-6">{song.artist}</p>
                )}

                <div className="whitespace-pre-wrap font-mono text-lg leading-relaxed overflow-x-auto">
                    {song.lyrics}
                </div>
            </div>
        </Layout>
    );
}
