import { useEffect, useRef } from 'react'
import { useEditor } from 'tldraw'
import type { TLShape, TLShapeId } from 'tldraw'
import { MAIN_FRAME_ID } from '../lib/constants'

/**
 * Extracts base name and number from a name like "geo-1" or "myShape-2".
 * Returns { base: "geo", num: 1 } or { base: "myShape", num: null } for "myShape".
 */
function parseNameNumber(name: string): { base: string; num: number | null } {
  const match = name.match(/^(.+)-(\d+)$/)
  if (match) {
    return { base: match[1], num: parseInt(match[2], 10) }
  }
  return { base: name, num: null }
}

/**
 * Generates next available name for a given base.
 * e.g., if "geo-1" and "geo-2" exist, returns "geo-3".
 */
function getNextName(baseName: string, existingNames: Set<string>): string {
  const { base, num } = parseNameNumber(baseName)

  // If original has number, increment from there
  let startNum = num !== null ? num + 1 : 1

  // Find next available number
  while (existingNames.has(`${base}-${startNum}`)) {
    startNum++
  }

  return `${base}-${startNum}`
}

/**
 * Gets all existing kovar_ids from shapes.
 */
function getExistingNames(shapes: TLShape[]): Set<string> {
  const names = new Set<string>()
  for (const shape of shapes) {
    const meta = shape.meta as Record<string, string> | undefined
    if (meta?.kovar_id) {
      names.add(meta.kovar_id)
    }
  }
  return names
}

/**
 * Counts shapes by type to generate default names.
 */
function countShapesByType(shapes: TLShape[], type: string): number {
  return shapes.filter((s) => s.type === type && s.id !== `shape:${MAIN_FRAME_ID}`).length
}

/**
 * Handles automatic naming for shapes.
 */
export function ShapeNaming() {
  const editor = useEditor()
  const processedShapes = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Listen for store changes
    const unsubscribe = editor.store.listen(
      (entry) => {
        const { changes } = entry

        // Handle newly added shapes
        if (changes.added) {
          const allShapes = editor.getCurrentPageShapes()
          const existingNames = getExistingNames(allShapes)

          for (const [id, shape] of Object.entries(changes.added) as [string, TLShape][]) {
            // Skip main frame
            if (id === `shape:${MAIN_FRAME_ID}`) continue

            // Skip already processed shapes
            if (processedShapes.current.has(id)) continue

            const meta = shape.meta as Record<string, string> | undefined

            // If shape has no kovar_id, assign default name
            if (!meta?.kovar_id) {
              const typeCount = countShapesByType(allShapes, shape.type)
              let newName = `${shape.type}-${typeCount}`

              // Make sure name is unique
              while (existingNames.has(newName)) {
                newName = getNextName(newName, existingNames)
              }

              existingNames.add(newName)
              processedShapes.current.add(id)

              // Update shape meta
              editor.updateShapes([
                {
                  id: id as TLShapeId,
                  type: shape.type,
                  meta: { ...meta, kovar_id: newName },
                },
              ])
            } else {
              // Shape has kovar_id, check if it's a duplicate (copy/paste)
              const originalName = meta.kovar_id

              // Check if this name already exists in other shapes
              const shapesWithSameName = allShapes.filter((s) => {
                const m = s.meta as Record<string, string> | undefined
                return m?.kovar_id === originalName && s.id !== id
              })

              if (shapesWithSameName.length > 0) {
                // This is a duplicate, generate new name
                const newName = getNextName(originalName, existingNames)
                existingNames.add(newName)
                processedShapes.current.add(id)

                editor.updateShapes([
                  {
                    id: id as TLShapeId,
                    type: shape.type,
                    meta: { ...meta, kovar_id: newName },
                  },
                ])
              } else {
                processedShapes.current.add(id)
              }
            }
          }
        }
      },
      { source: 'user', scope: 'document' }
    )

    return () => {
      unsubscribe()
    }
  }, [editor])

  return null
}
