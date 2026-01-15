const DEFAULT_LEFT_WIDTH = 240
const DEFAULT_RIGHT_WIDTH = 240
const TOP_BAR_HEIGHT = 40

/**
 * Layout dimensions for calculating visible canvas area.
 */
export const LAYOUT_DIMENSIONS = {
  topBarHeight: TOP_BAR_HEIGHT,
  defaultLeftWidth: DEFAULT_LEFT_WIDTH,
  defaultRightWidth: DEFAULT_RIGHT_WIDTH,
  getLeftWidth: () => {
    const saved = localStorage.getItem('kovar:left-panel-width')
    return saved ? parseInt(saved) : DEFAULT_LEFT_WIDTH
  },
  getRightWidth: () => {
    const saved = localStorage.getItem('kovar:right-panel-width')
    return saved ? parseInt(saved) : DEFAULT_RIGHT_WIDTH
  },
}
