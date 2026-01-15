import { useEffect } from 'react'
import { useEditor, useValue, STROKE_SIZES } from 'tldraw'
import type { TLShape } from 'tldraw'
import type { KovarMeta } from '../types/kovar'

type TLShapeWithMeta = TLShape & { meta: Partial<KovarMeta> }

/**
 * Syncs STROKE_SIZES.m with the selected shape's border_width.
 * This allows the canvas to display the correct border width for the selected shape.
 */
export function BorderWidthSync() {
  const editor = useEditor()

  const selectedGeo = useValue(
    'selected geo',
    () => {
      const shapes = editor.getSelectedShapes() as TLShapeWithMeta[]
      return shapes.find((s) => s.type === 'geo') || null
    },
    [editor]
  )

  useEffect(() => {
    if (selectedGeo) {
      const borderWidth = (selectedGeo.meta.border_width as number) || 1
      STROKE_SIZES.m = borderWidth
      // Force re-render by nudging the shape
      editor.updateShapes([
        {
          id: selectedGeo.id,
          type: selectedGeo.type,
          props: { ...selectedGeo.props },
        },
      ])
    }
  }, [selectedGeo, selectedGeo?.meta.border_width, editor])

  return null
}
