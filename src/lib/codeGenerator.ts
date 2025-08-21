import QRCode from 'qrcode';

export class CodeGenerator {
  // Generate QR code as data URL
  static async generateQRCode(data: string, size: number = 200): Promise<string> {
    try {
      const options = {
        width: size,
        height: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const
      };

      return await QRCode.toDataURL(data, options);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to simple canvas-drawn QR pattern
      return this.generateFallbackCode(data, size, 'QR');
    }
  }

  // Generate DataMatrix code using external API (for КМЧЗ with GS1)
  static async generateDataMatrix(data: string, size: number = 200): Promise<string> {
    try {
      // Process GS1 data for DataMatrix
      const hasGS1 = data.includes('\\u001D') || data.includes('\u001D');
      let processedData = data.trim();
      
      if (hasGS1) {
        // Convert escaped GS1 separators to actual character
        processedData = processedData
          .replace(/\\u001[dD]/g, String.fromCharCode(29))
          .replace(/\\u001D/g, String.fromCharCode(29))
          .replace(/\\u001d/g, String.fromCharCode(29));
      }
      
      // Use TEC-IT for DataMatrix generation
      const encodedData = encodeURIComponent(processedData);
      const baseUrl = 'https://barcode.tec-it.com/barcode.ashx';
      const params = [
        `data=${encodedData}`,
        'code=DataMatrix',
        'unit=Fit',
        'dpi=96',
        'imagetype=Png',
        'rotation=0',
        'color=%23000000',
        'bgcolor=%23ffffff',
        'qunit=Mm',
        'quiet=0'
      ];
      
      if (hasGS1) {
        params.push('translate-esc=on');
        params.push('eclevel=L');
      }
      
      const dataMatrixUrl = `${baseUrl}?${params.join('&')}`;
      console.log('Generated DataMatrix URL:', dataMatrixUrl);
      
      // Load the image and convert to data URL
      return await this.loadImageAsDataUrl(dataMatrixUrl);
    } catch (error) {
      console.error('Error generating DataMatrix:', error);
      return this.generateFallbackCode(data, size, 'DataMatrix');
    }
  }

  // Helper method to load external image and convert to data URL
  static async loadImageAsDataUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Try without crossOrigin first, then with
      const tryLoad = (withCors: boolean = false) => {
        if (withCors) {
          img.crossOrigin = 'anonymous';
        }
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }
            
            canvas.width = img.width || 200;
            canvas.height = img.height || 200;
            
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } catch (canvasError) {
            console.error('Canvas error:', canvasError);
            if (!withCors) {
              // Try with CORS
              tryLoad(true);
            } else {
              reject(canvasError);
            }
          }
        };
        
        img.onerror = (error) => {
          console.error('Image load error:', error);
          if (!withCors) {
            // Try with CORS
            tryLoad(true);
          } else {
            reject(new Error('Failed to load image from URL'));
          }
        };
        
        img.src = url;
      };
      
      // Add timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Image load timeout (10s)'));
      }, 10000);
      
      // Clear timeout on success
      const originalResolve = resolve;
      resolve = (value: string | PromiseLike<string>) => {
        clearTimeout(timeoutId);
        originalResolve(value);
      };
      
      const originalReject = reject;
      reject = (reason: any) => {
        clearTimeout(timeoutId);
        originalReject(reason);
      };
      
      tryLoad(false);
    });
  }

  // Generate fallback code when all else fails
  private static generateFallbackCode(_data: string, size: number, type: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // Return a simple data URL if canvas fails
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2YjcyODAiPkNvZGU8L3RleHQ+PC9zdmc+';
    }

    canvas.width = size;
    canvas.height = size;

    // Gray background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);

    // Text
    ctx.fillStyle = '#6b7280';
    ctx.font = `${Math.floor(size / 10)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type, size / 2, size / 2 - size / 10);
    ctx.fillText('Code', size / 2, size / 2 + size / 10);

    return canvas.toDataURL('image/png');
  }

  // Main method to generate appropriate code based on type
  static async generateCode(data: string, brandType: 'КМДМ' | 'КМЧЗ', size: number = 200): Promise<string> {
    if (brandType === 'КМДМ') {
      return await this.generateQRCode(data, size);
    } else {
      return await this.generateDataMatrix(data, size);
    }
  }
}
