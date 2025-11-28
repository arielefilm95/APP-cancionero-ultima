import { initDB } from './client';
import type { Song } from './client'; // Using inlined types from client.ts

export async function getAllSongs(): Promise<Song[]> {
    const { db, sqlite3 } = await initDB();
    const result: Song[] = [];

    await sqlite3.exec(db, 'SELECT * FROM songs ORDER BY title ASC', (row: any[], columns: string[]) => {
        const song: any = {};
        columns.forEach((col, index) => {
            song[col] = row[index];
        });
        result.push(song);
    });

    return result;
}

export async function getSongById(id: number): Promise<Song | null> {
    const { db, sqlite3 } = await initDB();
    let song: Song | null = null;

    await sqlite3.exec(db, `SELECT * FROM songs WHERE id = ${id}`, (row: any[], columns: string[]) => {
        const s: any = {};
        columns.forEach((col, index) => {
            s[col] = row[index];
        });
        song = s;
    });

    return song;
}

export async function searchSongs(query: string): Promise<Song[]> {
    const { db, sqlite3 } = await initDB();
    const result: Song[] = [];
    const sanitizedQuery = query.replace(/'/g, "''");

    await sqlite3.exec(db, `SELECT * FROM songs WHERE title LIKE '%${sanitizedQuery}%' OR lyrics LIKE '%${sanitizedQuery}%' ORDER BY title ASC`, (row: any[], columns: string[]) => {
        const song: any = {};
        columns.forEach((col, index) => {
            song[col] = row[index];
        });
        result.push(song);
    });

    return result;
}
