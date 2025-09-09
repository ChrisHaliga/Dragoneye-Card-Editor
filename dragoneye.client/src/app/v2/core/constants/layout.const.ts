// Card layout constants extracted from CardDisplayComponent
export const CARD_LAYOUT = {
  DESCRIPTION_BOX_X: 20,
  DESCRIPTION_BOX_Y: 180,
  DESCRIPTION_BOX_WIDTH: 160,
  DESCRIPTION_BOX_HEIGHT: 75,
  TEXT_START_X: 24,
  TEXT_START_Y: 190,
  LINE_HEIGHT: 7,
  TITLE_OFFSET_Y: 2.25,
  DETAIL_SPACING: 4,
  FONT_SIZE: 6,
  TITLE_FONT_SIZE: 7,
  MARGIN: 8,
  BOTTOM_MARGIN: 20
} as const;

// Viewport constants
export const VIEWPORT = {
  DEFAULT_ZOOM: 1,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  ZOOM_STEP: 0.1,
  ZOOM_FACTOR: 1.1,
  PINCH_ZOOM_FACTOR: 0.02,
  FOCUS_ZOOM_LEVEL: 1.5
} as const;

// Animation constants
export const ANIMATION = {
  ZOOM_CONTROLS_FADE_DELAY: 2000,
  GROUP_EDIT_FOCUS_DELAY: 0,
  GROUP_EDIT_BLUR_DELAY: 100
} as const;

// Touch interaction constants
export const TOUCH = {
  SINGLE_FINGER: 1,
  TWO_FINGERS: 2,
  PINCH_THRESHOLD: 10
} as const;
