import type { CanvasConfig } from '../types/kovar'
import { STROKE_SIZES } from 'tldraw'

// Default border width for geo shapes (dynamically updated per shape selection)
STROKE_SIZES.m = 1

/**
 * Returns canvas config based on current window size with padding.
 */
export function getCanvasConfig(): CanvasConfig {
  const padding = 80
  return {
    width: Math.max(400, window.innerWidth - padding * 2),
    height: Math.max(300, window.innerHeight - padding * 2),
    name: 'Main Window',
  }
}

/**
 * Default canvas configuration (initial fallback).
 */
export const DEFAULT_CANVAS: CanvasConfig = {
  width: 800,
  height: 600,
  name: 'Main Window',
}

/**
 * Frame ID for the main design area.
 */
export const MAIN_FRAME_ID = 'kovar:main-frame'

/**
 * API endpoint for saving HTML to kovar-cli.
 */
export const API_SAVE_ENDPOINT = '/api/save'

/**
 * Schema version for Kovar UI JSON.
 */
export const SCHEMA_VERSION = '1.0'

/**
 * Toolbar tools available in the editor.
 */
export const ALLOWED_TOOLS = ['select', 'geo', 'frame', 'text', 'asset'] as const

export type AllowedTool = (typeof ALLOWED_TOOLS)[number]
