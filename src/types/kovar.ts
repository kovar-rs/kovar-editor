/**
 * Kovar UI Schema types.
 * Defines the intermediate representation between tldraw shapes and final HTML output.
 */

export interface KovarStyle {
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  color?: string
  backgroundColor?: string
  borderRadius?: number
  borderWidth?: number
  opacity?: number
}

export interface KovarNode {
  id: string
  type: 'container' | 'text' | 'image' | 'button' | 'canvas' | 'list-item'
  style: KovarStyle
  binding?: string
  text?: string
  src?: string
  is_display?: boolean // For text: use k-display instead of k-text
  children?: KovarNode[]
}

export interface KovarSchema {
  version: string
  root: KovarNode
}

/**
 * Metadata stored in tldraw shape.meta for Kovar binding.
 */
export interface KovarMeta {
  kovar_id?: string
  visibility_binding?: string
  is_display?: boolean // For text: use k-display instead of k-text
  component_type?: 'container' | 'button' | 'canvas' // For geo: override default div
  border_width?: number // Custom border width in px (1-10)
}

/**
 * Canvas configuration for the Main Window frame.
 */
export interface CanvasConfig {
  width: number
  height: number
  name: string
}
