import { useEffect, useRef } from 'react'
import { useEditor } from 'tldraw'
import type { TLShape, TLShapeId } from 'tldraw'

/**
 * Extracts base name and number from a name like "geo-1" or "myShape-2".
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
 */
function getNextName(baseName: string, existingNames: Set<string>): string {
  const { base, num } = parseNameNumber(baseName)
  let startNum = num !== null ? num + 1 : 1
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
 * Excludes Main Window frame.
 */
function countShapesByType(shapes: TLShape[], type: string): number {
  return shapes.filter((s) => {
    if (s.type !== type) return false
    // Exclude Main Window frame
    if (s.type === 'frame' && s.meta.is_main_window === true) return false
    return true
  }).length
}

/**
 * Handles automatic naming for shapes (kovar_id assignment).
 * Main Window is treated as visual root - shapes stay on page, not reparented.
 * Schema export will treat page-level shapes as children of root.
 */
export function ShapeNaming() {
  const editor = useEditor()
  const processedShapes = useRef<Set<string>>(new Set())

  useEffect(() => {
    const unsubscribe = editor.store.listen(
      (entry) => {
        const { changes } = entry

        if (changes.added) {
          const allShapes = editor.getCurrentPageShapes()
          const existingNames = getExistingNames(allShapes)

          for (const [id, shape] of Object.entries(changes.added) as [string, TLShape][]) {
            // Skip Main Window frame
            if (shape.type === 'frame' && shape.meta.is_main_window === true) continue
            // Skip already processed
            if (processedShapes.current.has(id)) continue

            const meta = shape.meta as Record<string, string> | undefined

            if (!meta?.kovar_id) {
              const typeCount = countShapesByType(allShapes, shape.type)
              let newName = `${shape.type}-${typeCount}`

              while (existingNames.has(newName)) {
                newName = getNextName(newName, existingNames)
              }

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
              // Check for duplicate (copy/paste)
              const originalName = meta.kovar_id
              const shapesWithSameName = allShapes.filter((s) => {
                const m = s.meta as Record<string, string> | undefined
                return m?.kovar_id === originalName && s.id !== id
              })

              if (shapesWithSameName.length > 0) {
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

    return () => unsubscribe()
  }, [editor])

  return null
}
