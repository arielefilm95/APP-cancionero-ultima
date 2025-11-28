import * as SQLite from 'wa-sqlite';
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';

export interface Song {
  id?: number;
  title: string;
  artist: string;
  lyrics: string;
  key: string;
  category?: string;
}

let db: any = null;
let sqlite3: any = null;

export async function initDB() {
  if (db) return { db, sqlite3 };

  const module = await SQLiteAsyncESMFactory({
    locateFile: (file: string) => {
      if (import.meta.env.PROD) {
        return `/assets/${file}`;
      }
      return file;
    }
  });
  sqlite3 = SQLite.Factory(module);
  const vfs = new IDBBatchAtomicVFS('cancionero-db');
  sqlite3.vfs_register(vfs, true);

  db = await sqlite3.open_v2('cancionero-v3.db');

  // Create tables
  await sqlite3.exec(db, `
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT,
      lyrics TEXT,
      key TEXT,
      category TEXT
    );
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS collection_songs (
      collection_id INTEGER,
      song_id INTEGER,
      PRIMARY KEY (collection_id, song_id)
    );
    CREATE TABLE IF NOT EXISTS user_overrides (
      song_id INTEGER,
      key TEXT,
      PRIMARY KEY (song_id)
    );
  `);

  return { db, sqlite3 };
}

export async function hydrateSongs() {
  const { db, sqlite3 } = await initDB();
  if (!db || !sqlite3) throw new Error("DB not initialized");

  let count = 0;
  await sqlite3.exec(db, 'SELECT COUNT(*) FROM songs', (row: any[]) => {
    count = Number(row[0]);
  });

  if (count === 0) {
    console.log("Hydrating database...");
    try {
      const response = await fetch('/data/songs.json');
      if (!response.ok) throw new Error(`Failed to fetch songs.json: ${response.statusText}`);
      const songs: Song[] = await response.json();

      await sqlite3.exec(db, 'BEGIN');

      for (const song of songs) {
        const title = (song.title || '').replace(/'/g, "''");
        const artist = (song.artist || '').replace(/'/g, "''");
        const lyrics = (song.lyrics || '').replace(/'/g, "''");
        const key = (song.key || '').replace(/'/g, "''");
        const category = (song.category || '').replace(/'/g, "''");

        await sqlite3.exec(db, `INSERT INTO songs (title, artist, lyrics, key, category) VALUES ('${title}', '${artist}', '${lyrics}', '${key}', '${category}')`);
      }

      await sqlite3.exec(db, 'COMMIT');
      console.log(`Hydrated ${songs.length} songs.`);
    } catch (e) {
      console.error("Error hydrating songs:", e);
      await sqlite3.exec(db, 'ROLLBACK');
      throw e;
    }
  } else {
    console.log(`Database already has ${count} songs.`);
  }
}
