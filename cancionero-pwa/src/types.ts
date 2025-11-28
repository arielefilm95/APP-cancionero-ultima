export interface Song {
    id?: number;
    title: string;
    artist: string;
    lyrics: string;
    key: string;
    category?: string;
}

export interface Collection {
    id?: number;
    name: string;
    songs: number[]; // Array of song IDs
}
