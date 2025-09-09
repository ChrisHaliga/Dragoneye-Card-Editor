import { CardDetail, DetailLayout, TextLine } from '../../../core/models/card.model';
import { CARD_LAYOUT } from '../../../core/constants/layout.const';

export class LayoutCalculator {
  
  /**
   * Calculate layout positions for card details
   */
  static calculateDetailLayouts(
    details: CardDetail[], 
    canvas: HTMLCanvasElement | CanvasRenderingContext2D | null = null
  ): DetailLayout[] {
    if (!details || details.length === 0) {
      return [];
    }

    // Create a temporary canvas if none provided
    let ctx: CanvasRenderingContext2D | null = null;
    let tempCanvas: HTMLCanvasElement | null = null;
    
    if (canvas) {
      if (canvas instanceof HTMLCanvasElement) {
        ctx = canvas.getContext('2d');
      } else {
        ctx = canvas;
      }
    } else {
      tempCanvas = document.createElement('canvas');
      ctx = tempCanvas.getContext('2d');
    }

    if (!ctx) {
      console.warn('Could not get canvas context for layout calculation');
      return [];
    }

    const layouts: DetailLayout[] = [];
    let currentY = CARD_LAYOUT.TEXT_START_Y;

    for (const detail of details) {
      // Check if we have space for this detail
      if (currentY > CARD_LAYOUT.DESCRIPTION_BOX_Y + CARD_LAYOUT.DESCRIPTION_BOX_HEIGHT - CARD_LAYOUT.BOTTOM_MARGIN) {
        break;
      }

      const titleX = this.getDetailTitleX(detail);
      const availableWidth = this.getAvailableTextWidth();
      const lines = this.wrapText(detail.details, availableWidth, ctx);
      
      const detailHeight = CARD_LAYOUT.LINE_HEIGHT + (lines.length * CARD_LAYOUT.LINE_HEIGHT) + CARD_LAYOUT.DETAIL_SPACING;
      
      layouts.push({
        detail,
        yPosition: currentY,
        height: detailHeight,
        titleX,
        lines
      });

      currentY += detailHeight;
    }

    return layouts;
  }

  /**
   * Calculate the X position for detail title based on cost circles
   */
  static getDetailTitleX(detail: CardDetail): number {
    return CARD_LAYOUT.TEXT_START_X + Math.max(detail.apCost + detail.spCost, 1) * 8 + 5;
  }

  /**
   * Get available width for text content
   */
  static getAvailableTextWidth(): number {
    return CARD_LAYOUT.DESCRIPTION_BOX_X + CARD_LAYOUT.DESCRIPTION_BOX_WIDTH - CARD_LAYOUT.TEXT_START_X - CARD_LAYOUT.MARGIN;
  }

  /**
   * Wrap text to fit within specified width
   */
  static wrapText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): TextLine[] {
    if (!text) return [];

    ctx.font = `${CARD_LAYOUT.FONT_SIZE}px serif`;
    
    const words = text.split(' ');
    const lines: TextLine[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push({
            text: currentLine,
            width: ctx.measureText(currentLine).width
          });
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push({
        text: currentLine,
        width: ctx.measureText(currentLine).width
      });
    }

    return lines;
  }

  /**
   * Calculate total height needed for all details
   */
  static calculateTotalHeight(layouts: DetailLayout[]): number {
    if (layouts.length === 0) return 0;
    
    const lastLayout = layouts[layouts.length - 1];
    return lastLayout.yPosition + lastLayout.height - CARD_LAYOUT.TEXT_START_Y;
  }

  /**
   * Check if all details fit within the available space
   */
  static doDetailsfit(details: CardDetail[], ctx?: CanvasRenderingContext2D): boolean {
    const layouts = this.calculateDetailLayouts(details, ctx);
    return layouts.length === details.length;
  }

  /**
   * Get the Y position for detail circles
   */
  static getDetailCircleY(layout: DetailLayout): number {
    return layout.yPosition;
  }

  /**
   * Get the Y position for detail title
   */
  static getDetailTitleY(layout: DetailLayout): number {
    return layout.yPosition + CARD_LAYOUT.TITLE_OFFSET_Y;
  }

  /**
   * Get the Y position for detail text content
   */
  static getDetailTextY(layout: DetailLayout): number {
    return layout.yPosition + CARD_LAYOUT.TITLE_OFFSET_Y + CARD_LAYOUT.LINE_HEIGHT;
  }

  /**
   * Calculate card bounds for focus/zoom operations
   */
  static calculateCardBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    // Standard card dimensions - these would typically come from the actual card template
    return {
      x: 0,
      y: 0,
      width: 200, // Standard card width
      height: 280 // Standard card height
    };
  }

  /**
   * Calculate optimal zoom level to fit content
   */
  static calculateOptimalZoom(
    contentBounds: { width: number; height: number },
    containerBounds: { width: number; height: number },
    padding: number = 20
  ): number {
    const availableWidth = containerBounds.width - (padding * 2);
    const availableHeight = containerBounds.height - (padding * 2);
    
    const scaleX = availableWidth / contentBounds.width;
    const scaleY = availableHeight / contentBounds.height;
    
    return Math.min(scaleX, scaleY, 3); // Cap at 3x zoom
  }

  /**
   * Calculate center position for element focusing
   */
  static calculateCenterPosition(
    elementBounds: { x: number; y: number; width: number; height: number },
    containerBounds: { width: number; height: number },
    zoom: number
  ): { x: number; y: number } {
    const elementCenterX = elementBounds.x + elementBounds.width / 2;
    const elementCenterY = elementBounds.y + elementBounds.height / 2;
    
    const containerCenterX = containerBounds.width / 2;
    const containerCenterY = containerBounds.height / 2;
    
    return {
      x: containerCenterX - (elementCenterX * zoom),
      y: containerCenterY - (elementCenterY * zoom)
    };
  }

  /**
   * Check if point is within bounds
   */
  static isPointInBounds(
    point: { x: number; y: number },
    bounds: { x: number; y: number; width: number; height: number }
  ): boolean {
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }

  /**
   * Calculate intersection of two rectangles
   */
  static calculateIntersection(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): { x: number; y: number; width: number; height: number } | null {
    const left = Math.max(rect1.x, rect2.x);
    const top = Math.max(rect1.y, rect2.y);
    const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
    
    if (left < right && top < bottom) {
      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
      };
    }
    
    return null;
  }
}
