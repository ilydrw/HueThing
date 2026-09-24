import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'hue_database.json');

export interface StoredTheme {
    id: string;
    name: string;
    colors: { accent: string; bg: string; glass: string };
    layout: string;
}

export interface StoredScene {
    id: string;
    name: string;
    palette: Array<{ x: number, y: number }>; // CIE 1931 coordinates
}

const createEmptyDb = () => ({ themes: [], scenes: {} as Record<string, StoredScene> });

const getDb = () => {
    if (!fs.existsSync(DB_PATH)) return createEmptyDb();

    try {
        const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return {
            themes: Array.isArray(parsed?.themes) ? parsed.themes : [],
            scenes: parsed?.scenes && typeof parsed.scenes === 'object' ? parsed.scenes : {}
        };
    } catch (error) {
        console.error('[HueThing] Failed to read hue_database.json, falling back to an empty database.', error);
        return createEmptyDb();
    }
};

const saveDb = (data: any) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

export const Database = {
    saveTheme: (theme: StoredTheme) => {
        const db = getDb();
        const index = db.themes.findIndex((t: any) => t.id === theme.id);
        if (index > -1) db.themes[index] = theme; else db.themes.push(theme);
        saveDb(db);
    },

    cacheScene: (scene: StoredScene) => {
        const db = getDb();
        db.scenes[scene.id] = scene;
        saveDb(db);
    },

    getThemes: () => getDb().themes,
    getCachedScenes: () => getDb().scenes
};
