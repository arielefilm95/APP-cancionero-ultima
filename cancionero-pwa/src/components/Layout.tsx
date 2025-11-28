import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Settings } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

export function Layout({ children, title = "Cancionero" }: LayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                        <Music className="w-6 h-6" />
                        <span>{title}</span>
                    </Link>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>
            <main className="flex-1 max-w-3xl mx-auto w-full p-4">
                {children}
            </main>
        </div>
    );
}
