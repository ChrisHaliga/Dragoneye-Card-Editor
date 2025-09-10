// File utilities

export class FileUtils {
  
  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  }

  /**
   * Read file as text
   */
  static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Read file as data URL
   */
  static readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file as data URL'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Read file as array buffer
   */
  static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as ArrayBuffer);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file as array buffer'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Create and download a text file
   */
  static downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  /**
   * Create and download a JSON file
   */
  static downloadJsonFile(data: any, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    this.downloadTextFile(jsonString, filename, 'application/json');
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
  }

  /**
   * Get filename without extension
   */
  static getFilenameWithoutExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(0, lastDot) : filename;
  }

  /**
   * Change file extension
   */
  static changeFileExtension(filename: string, newExtension: string): string {
    const nameWithoutExt = this.getFilenameWithoutExtension(filename);
    return `${nameWithoutExt}.${newExtension}`;
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file type is image
   */
  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Check if file type is JSON
   */
  static isJsonFile(file: File): boolean {
    return file.type === 'application/json' || 
           file.name.toLowerCase().endsWith('.json');
  }

  /**
   * Check if file type is text
   */
  static isTextFile(file: File): boolean {
    return file.type.startsWith('text/') || 
           this.isJsonFile(file);
  }

  /**
   * Validate file size
   */
  static validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  }

  /**
   * Validate file type
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        // Handle wildcard types like 'image/*'
        const prefix = type.slice(0, -2);
        return file.type.startsWith(prefix);
      }
      return file.type === type;
    });
  }

  /**
   * Sanitize filename for download
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid characters
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/_+/g, '_')            // Replace multiple underscores with single
      .replace(/^_|_$/g, '')          // Remove leading/trailing underscores
      .substring(0, 255);             // Limit length
  }

  /**
   * Create file input element for file selection
   */
  static createFileInput(
    accept?: string, 
    multiple: boolean = false,
    onChange?: (files: FileList | null) => void
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    
    if (accept) {
      input.accept = accept;
    }
    
    if (multiple) {
      input.multiple = true;
    }
    
    if (onChange) {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        onChange(target.files);
        // Reset input value so same file can be selected again
        target.value = '';
      });
    }
    
    return input;
  }

  /**
   * Open file picker dialog
   */
  static openFilePicker(
    accept?: string, 
    multiple: boolean = false
  ): Promise<FileList | null> {
    return new Promise((resolve) => {
      const input = this.createFileInput(accept, multiple, (files) => {
        resolve(files);
        document.body.removeChild(input);
      });
      
      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Convert data URL to blob
   */
  static dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Convert blob to data URL
   */
  static blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Compress image file
   */
  static compressImage(
    file: File, 
    maxWidth: number = 1920, 
    maxHeight: number = 1080, 
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}
