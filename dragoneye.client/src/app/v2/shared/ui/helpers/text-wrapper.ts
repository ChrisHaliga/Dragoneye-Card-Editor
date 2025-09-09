import { TextLine } from '../../../core/models/card.model';
import { CARD_LAYOUT } from '../../../core/constants/layout.const';

export interface TextWrapOptions {
  fontSize?: number;
  fontFamily?: string;
  maxWidth: number;
  maxLines?: number;
  ellipsis?: boolean;
}

export class TextWrapper {
  
  /**
   * Wrap text to fit within specified constraints
   */
  static wrapText(
    text: string, 
    options: TextWrapOptions,
    ctx?: CanvasRenderingContext2D
  ): TextLine[] {
    if (!text) return [];

    // Create temporary canvas if none provided
    let context = ctx;
    let tempCanvas: HTMLCanvasElement | null = null;
    
    if (!context) {
      tempCanvas = document.createElement('canvas');
      context = tempCanvas.getContext('2d');
    }

    if (!context) {
      console.warn('Could not get canvas context for text wrapping');
      return [{ text, width: 0 }];
    }

    const fontSize = options.fontSize || CARD_LAYOUT.FONT_SIZE;
    const fontFamily = options.fontFamily || 'serif';
    context.font = `${fontSize}px ${fontFamily}`;

    const words = text.split(' ');
    const lines: TextLine[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = context.measureText(testLine);
      
      if (metrics.width <= options.maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push({
            text: currentLine,
            width: context.measureText(currentLine).width
          });

          // Check max lines constraint
          if (options.maxLines && lines.length >= options.maxLines) {
            if (options.ellipsis) {
              // Replace last line with ellipsis version
              const lastLine = lines[lines.length - 1];
              const ellipsisLine = this.addEllipsis(lastLine.text, options.maxWidth, context);
              lines[lines.length - 1] = ellipsisLine;
            }
            break;
          }
        }
        currentLine = word;
      }
    }

    // Add remaining text if we haven't hit line limit
    if (currentLine && (!options.maxLines || lines.length < options.maxLines)) {
      lines.push({
        text: currentLine,
        width: context.measureText(currentLine).width
      });
    }

    return lines;
  }

  /**
   * Add ellipsis to text that exceeds width
   */
  static addEllipsis(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): TextLine {
    const ellipsis = '...';
    const ellipsisWidth = ctx.measureText(ellipsis).width;
    
    if (ctx.measureText(text).width <= maxWidth) {
      return { text, width: ctx.measureText(text).width };
    }

    let truncatedText = text;
    while (truncatedText.length > 0) {
      const testText = truncatedText + ellipsis;
      const width = ctx.measureText(testText).width;
      
      if (width <= maxWidth) {
        return { text: testText, width };
      }
      
      truncatedText = truncatedText.slice(0, -1);
    }

    return { text: ellipsis, width: ellipsisWidth };
  }

  /**
   * Wrap text for card details specifically
   */
  static wrapDetailText(text: string, ctx?: CanvasRenderingContext2D): TextLine[] {
    const maxWidth = CARD_LAYOUT.DESCRIPTION_BOX_X + CARD_LAYOUT.DESCRIPTION_BOX_WIDTH - CARD_LAYOUT.TEXT_START_X - 8;
    
    return this.wrapText(text, {
      maxWidth,
      fontSize: CARD_LAYOUT.FONT_SIZE,
      fontFamily: 'serif'
    }, ctx);
  }

  /**
   * Wrap text for card titles
   */
  static wrapTitleText(text: string, maxWidth: number, ctx?: CanvasRenderingContext2D): TextLine[] {
    return this.wrapText(text, {
      maxWidth,
      fontSize: CARD_LAYOUT.TITLE_FONT_SIZE,
      fontFamily: 'serif',
      maxLines: 2,
      ellipsis: true
    }, ctx);
  }

  /**
   * Calculate text height for given lines
   */
  static calculateTextHeight(lines: TextLine[], lineHeight?: number): number {
    const height = lineHeight || CARD_LAYOUT.LINE_HEIGHT;
    return lines.length * height;
  }

  /**
   * Get maximum width from text lines
   */
  static getMaxWidth(lines: TextLine[]): number {
    return Math.max(...lines.map(line => line.width), 0);
  }

  /**
   * Truncate text to fit exact character count
   */
  static truncateToCharCount(text: string, maxChars: number, ellipsis: boolean = true): string {
    if (text.length <= maxChars) {
      return text;
    }

    if (ellipsis && maxChars > 3) {
      return text.substring(0, maxChars - 3) + '...';
    }

    return text.substring(0, maxChars);
  }

  /**
   * Split text into multiple columns
   */
  static wrapTextInColumns(
    text: string,
    columnCount: number,
    columnWidth: number,
    ctx?: CanvasRenderingContext2D
  ): TextLine[][] {
    const words = text.split(' ');
    const columns: TextLine[][] = [];
    
    for (let i = 0; i < columnCount; i++) {
      columns.push([]);
    }

    let currentColumn = 0;
    let remainingWords = [...words];

    while (remainingWords.length > 0 && currentColumn < columnCount) {
      const wordsForColumn = Math.ceil(remainingWords.length / (columnCount - currentColumn));
      const columnText = remainingWords.splice(0, wordsForColumn).join(' ');
      
      const lines = this.wrapText(columnText, {
        maxWidth: columnWidth,
        fontSize: CARD_LAYOUT.FONT_SIZE
      }, ctx);
      
      columns[currentColumn] = lines;
      currentColumn++;
    }

    return columns;
  }

  /**
   * Measure text dimensions
   */
  static measureText(
    text: string,
    fontSize: number = CARD_LAYOUT.FONT_SIZE,
    fontFamily: string = 'serif',
    ctx?: CanvasRenderingContext2D
  ): { width: number; height: number } {
    let context = ctx;
    let tempCanvas: HTMLCanvasElement | null = null;
    
    if (!context) {
      tempCanvas = document.createElement('canvas');
      context = tempCanvas.getContext('2d');
    }

    if (!context) {
      return { width: 0, height: 0 };
    }

    context.font = `${fontSize}px ${fontFamily}`;
    const metrics = context.measureText(text);
    
    return {
      width: metrics.width,
      height: fontSize * 1.2 // Approximate height based on font size
    };
  }

  /**
   * Check if text fits within constraints
   */
  static doesTextFit(
    text: string,
    maxWidth: number,
    maxHeight?: number,
    fontSize: number = CARD_LAYOUT.FONT_SIZE,
    ctx?: CanvasRenderingContext2D
  ): boolean {
    const lines = this.wrapText(text, { maxWidth, fontSize }, ctx);
    const textHeight = this.calculateTextHeight(lines);
    
    if (maxHeight && textHeight > maxHeight) {
      return false;
    }

    return true;
  }

  /**
   * Auto-size text to fit within bounds
   */
  static autoSizeText(
    text: string,
    maxWidth: number,
    maxHeight: number,
    minFontSize: number = 8,
    maxFontSize: number = 24,
    ctx?: CanvasRenderingContext2D
  ): { fontSize: number; lines: TextLine[] } {
    let fontSize = maxFontSize;
    
    while (fontSize >= minFontSize) {
      const lines = this.wrapText(text, { maxWidth, fontSize }, ctx);
      const textHeight = this.calculateTextHeight(lines, fontSize * 1.2);
      
      if (textHeight <= maxHeight) {
        return { fontSize, lines };
      }
      
      fontSize--;
    }

    // If we can't fit even at minimum size, return minimum
    const lines = this.wrapText(text, { maxWidth, fontSize: minFontSize }, ctx);
    return { fontSize: minFontSize, lines };
  }
}
