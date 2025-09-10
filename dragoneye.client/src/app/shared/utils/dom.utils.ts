// DOM utilities

export class DomUtils {
  
  /**
   * Safely query a single element
   */
  static querySelector<T extends Element = Element>(
    selector: string, 
    parent: Document | Element = document
  ): T | null {
    try {
      return parent.querySelector<T>(selector);
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Safely query multiple elements
   */
  static querySelectorAll<T extends Element = Element>(
    selector: string, 
    parent: Document | Element = document
  ): T[] {
    try {
      return Array.from(parent.querySelectorAll<T>(selector));
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Get element bounds relative to viewport
   */
  static getElementBounds(element: Element): DOMRect | null {
    try {
      return element.getBoundingClientRect();
    } catch (error) {
      console.warn('Failed to get element bounds', error);
      return null;
    }
  }

  /**
   * Check if element is visible in viewport
   */
  static isElementVisible(element: Element): boolean {
    const bounds = this.getElementBounds(element);
    if (!bounds) return false;

    return bounds.top < window.innerHeight && 
           bounds.bottom > 0 && 
           bounds.left < window.innerWidth && 
           bounds.right > 0;
  }

  /**
   * Scroll element into view smoothly
   */
  static scrollIntoView(
    element: Element, 
    options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
  ): void {
    try {
      element.scrollIntoView(options);
    } catch (error) {
      // Fallback for older browsers
      try {
        element.scrollIntoView();
      } catch (fallbackError) {
        console.warn('Failed to scroll element into view', fallbackError);
      }
    }
  }

  /**
   * Add CSS class with error handling
   */
  static addClass(element: Element, className: string): boolean {
    try {
      element.classList.add(className);
      return true;
    } catch (error) {
      console.warn(`Failed to add class ${className}`, error);
      return false;
    }
  }

  /**
   * Remove CSS class with error handling
   */
  static removeClass(element: Element, className: string): boolean {
    try {
      element.classList.remove(className);
      return true;
    } catch (error) {
      console.warn(`Failed to remove class ${className}`, error);
      return false;
    }
  }

  /**
   * Toggle CSS class with error handling
   */
  static toggleClass(element: Element, className: string, force?: boolean): boolean {
    try {
      return element.classList.toggle(className, force);
    } catch (error) {
      console.warn(`Failed to toggle class ${className}`, error);
      return false;
    }
  }

  /**
   * Check if element has CSS class
   */
  static hasClass(element: Element, className: string): boolean {
    try {
      return element.classList.contains(className);
    } catch (error) {
      console.warn(`Failed to check class ${className}`, error);
      return false;
    }
  }

  /**
   * Set element style with error handling
   */
  static setStyle(element: HTMLElement, property: string, value: string): boolean {
    try {
      element.style.setProperty(property, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set style ${property}: ${value}`, error);
      return false;
    }
  }

  /**
   * Get computed style value
   */
  static getComputedStyle(element: Element, property: string): string {
    try {
      return window.getComputedStyle(element).getPropertyValue(property);
    } catch (error) {
      console.warn(`Failed to get computed style ${property}`, error);
      return '';
    }
  }

  /**
   * Create element with attributes and children
   */
  static createElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    attributes: Record<string, string> = {},
    children: (Node | string)[] = []
  ): HTMLElementTagNameMap[T] {
    const element = document.createElement(tagName);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      try {
        element.setAttribute(key, value);
      } catch (error) {
        console.warn(`Failed to set attribute ${key}=${value}`, error);
      }
    });

    // Add children
    children.forEach(child => {
      try {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      } catch (error) {
        console.warn('Failed to append child', error);
      }
    });

    return element;
  }

  /**
   * Focus element with error handling
   */
  static focusElement(element: HTMLElement, options?: FocusOptions): boolean {
    try {
      element.focus(options);
      return true;
    } catch (error) {
      console.warn('Failed to focus element', error);
      return false;
    }
  }

  /**
   * Select text in input element
   */
  static selectText(element: HTMLInputElement | HTMLTextAreaElement): boolean {
    try {
      element.select();
      return true;
    } catch (error) {
      console.warn('Failed to select text', error);
      return false;
    }
  }

  /**
   * Get element's position relative to parent
   */
  static getRelativePosition(element: Element, parent: Element): { x: number; y: number } | null {
    try {
      const elementBounds = element.getBoundingClientRect();
      const parentBounds = parent.getBoundingClientRect();

      return {
        x: elementBounds.left - parentBounds.left,
        y: elementBounds.top - parentBounds.top
      };
    } catch (error) {
      console.warn('Failed to get relative position', error);
      return null;
    }
  }

  /**
   * Wait for element to appear in DOM
   */
  static waitForElement(
    selector: string, 
    timeout: number = 5000,
    parent: Document | Element = document
  ): Promise<Element> {
    return new Promise((resolve, reject) => {
      const element = this.querySelector(selector, parent);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = this.querySelector(selector, parent);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(parent, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element not found: ${selector}`));
      }, timeout);
    });
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.warn('Failed to copy to clipboard', error);
      return false;
    }
  }

  /**
   * Get viewport dimensions
   */
  static getViewportSize(): { width: number; height: number } {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
