import type { TLShape } from 'tldraw'
import type { KovarNode, KovarSchema, KovarMeta } from '../types/kovar'
import { SCHEMA_VERSION, MAIN_FRAME_ID } from './constants'

type TLShapeWithMeta = TLShape & { meta: KovarMeta }

interface TransformOptions {
  frameId?: string
  assets?: Map<string, string> // assetId -> src (base64 or url)
}

/**
 * Extracts plain text from tldraw richText structure.
 */
function extractText(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''

  const doc = richText as { content?: Array<{ content?: Array<{ text?: string }> }> }
  if (!doc.content) return ''

  return doc.content
    .flatMap((block) => block.content?.map((node) => node.text || '') || [])
    .join('')
}

/**
 * Determines the Kovar component type from shape type and meta.
 * geo → container (div) by default, can be overridden to button/canvas
 */
function resolveComponentType(shape: TLShapeWithMeta): KovarNode['type'] {
  // For geo, check if user specified a component_type
  if (shape.type === 'geo' && shape.meta.component_type) {
    return shape.meta.component_type
  }

  switch (shape.type) {
    case 'text':
      return 'text'
    case 'image':
      return 'image'
    case 'geo':
    case 'frame':
    default:
      return 'container'
  }
}

/**
 * Converts a tldraw shape to a Kovar node.
 */
function shapeToNode(shape: TLShapeWithMeta, assets?: Map<string, string>): KovarNode {
  const props = shape.props as Record<string, unknown>

  const node: KovarNode = {
    id: shape.meta.kovar_id || shape.id.replace('shape:', ''),
    type: resolveComponentType(shape),
    style: {
      x: Math.round(shape.x),
      y: Math.round(shape.y),
      width: Math.round((props.w as number) || 0),
      height: Math.round((props.h as number) || 0),
    },
  }

  // Add binding if kovar_id exists
  if (shape.meta.kovar_id) {
    node.binding = shape.meta.kovar_id
  }

  // Add text content
  if (props.richText) {
    const text = extractText(props.richText)
    if (text) {
      node.text = text
    }
  }

  // Add is_display flag for text shapes
  if (shape.type === 'text' && shape.meta.is_display) {
    node.is_display = true
  }

  // Add image source (resolve from assets if available)
  if (shape.type === 'image' && props.assetId) {
    const assetId = props.assetId as string
    node.src = assets?.get(assetId) || assetId
  }

  // Add optional styles
  if (props.color && props.color !== 'black') {
    node.style.color = props.color as string
  }
  if (props.fill && props.fill !== 'none') {
    node.style.backgroundColor = props.fill as string
  }
  if (typeof props.opacity === 'number' && props.opacity !== 1) {
    node.style.opacity = props.opacity
  }

  // Add border width from meta (1-10px)
  if (shape.type === 'geo') {
    const borderWidth = shape.meta.border_width || 1
    node.style.borderWidth = borderWidth as number
  }

  return node
}

/**
 * Builds a tree structure from flat shapes using parentId.
 */
function buildTree(
  shapes: TLShapeWithMeta[],
  parentId: string,
  assets?: Map<string, string>
): KovarNode[] {
  return shapes
    .filter((s) => s.parentId === parentId)
    .sort((a, b) => (a.index > b.index ? 1 : -1))
    .map((shape) => {
      const node = shapeToNode(shape, assets)
      const children = buildTree(shapes, shape.id, assets)
      if (children.length > 0) {
        node.children = children
      }
      return node
    })
}

/**
 * Transforms tldraw shapes to Kovar Schema.
 */
export function transformToSchema(
  shapes: TLShape[],
  options: TransformOptions = {}
): KovarSchema {
  const frameId = options.frameId || `shape:${MAIN_FRAME_ID}`
  const typedShapes = shapes as TLShapeWithMeta[]

  // Find the main frame
  const mainFrame = typedShapes.find((s) => s.id === frameId)
  if (!mainFrame) {
    throw new Error(`Main frame not found: ${frameId}`)
  }

  const frameProps = mainFrame.props as Record<string, unknown>
  const children = buildTree(typedShapes, frameId, options.assets)

  const root: KovarNode = {
    id: 'root',
    type: 'container',
    style: {
      x: 0,
      y: 0,
      width: Math.round((frameProps.w as number) || 800),
      height: Math.round((frameProps.h as number) || 600),
    },
    children,
  }

  return {
    version: SCHEMA_VERSION,
    root,
  }
}

/**
 * Generates HTML string from Kovar Schema.
 */
export function schemaToHtml(schema: KovarSchema): string {
  const renderNode = (node: KovarNode, indent = 0): string => {
    const pad = '  '.repeat(indent)
    const style = [
      'position: absolute',
      `left: ${node.style.x}px`,
      `top: ${node.style.y}px`,
      `width: ${node.style.width}px`,
      `height: ${node.style.height}px`,
      node.style.color ? `color: ${node.style.color}` : '',
      node.style.backgroundColor ? `background-color: ${node.style.backgroundColor}` : '',
      node.style.borderWidth ? `border: ${node.style.borderWidth}px solid currentColor` : '',
      node.style.opacity !== undefined ? `opacity: ${node.style.opacity}` : '',
    ]
      .filter(Boolean)
      .join('; ')

    const id = node.binding || node.id

    // Handle list-item as template
    if (node.type === 'list-item') {
      const inner = node.children?.map((c) => renderNode(c, indent + 1)).join('\n') || ''
      return `${pad}<template id="${id}">\n${inner}\n${pad}</template>`
    }

    // Map type to HTML tag
    let tag: string
    let content = node.text || ''

    switch (node.type) {
      case 'text':
        tag = node.is_display ? 'k-display' : 'k-text'
        break
      case 'button':
        tag = 'button'
        break
      case 'canvas':
        tag = 'canvas'
        break
      case 'image':
        return `${pad}<img id="${id}" src="${node.src || ''}" style="${style}" />`
      case 'container':
      default:
        tag = 'div'
    }

    // Render children or text content
    if (node.children && node.children.length > 0) {
      const childrenHtml = node.children.map((c) => renderNode(c, indent + 1)).join('\n')
      return `${pad}<${tag} id="${id}" style="${style}">\n${childrenHtml}\n${pad}</${tag}>`
    }

    if (content) {
      return `${pad}<${tag} id="${id}" style="${style}">${content}</${tag}>`
    }

    return `${pad}<${tag} id="${id}" style="${style}"></${tag}>`
  }

  return renderNode(schema.root)
}

/**
 * Full transform pipeline: tldraw shapes → Kovar Schema → HTML.
 */
export function transformToHtml(shapes: TLShape[], options?: TransformOptions): string {
  const schema = transformToSchema(shapes, options)
  return schemaToHtml(schema)
}
