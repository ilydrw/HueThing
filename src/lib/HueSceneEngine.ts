import { xyToRgb, SimplifiedScene } from '../types';

export interface SceneTheme {
    name: string;
    colors: string[]; // CSS-ready RGB strings
    isDynamic: boolean;
}

/**
 * Maps SimplifiedScene data to the "Official" App Look
 */
export const formatHueScene = (scene: SimplifiedScene): SceneTheme => {
    // Convert pre-processed colors to RGB strings
    const colors = scene.colors.map(c =>
        xyToRgb(c.x, c.y, c.brightness)
    );

    // Fallback if no colors are present
    if (colors.length === 0) {
        colors.push('rgb(255, 244, 229)'); // Warm White fallback
    }

    return {
        name: scene.name,
        colors,
        isDynamic: !!scene.isDynamic
    };
};