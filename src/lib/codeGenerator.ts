import QRCode from 'qrcode';

export class CodeGenerator {
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
      return this.generateFallbackCode(data, size, 'QR');
    }
  }

  static async generateDataMatrix(data: string, size: number = 200): Promise<string> {
    try {
      const gs = String.fromCharCode(29);
      const hasGS1 = data.includes('\\u001D') || data.includes('\u001D') || data.includes('#') || data.includes(gs);
      let processedData = data.trim();
      
      if (hasGS1) {
        processedData = processedData
          .replace(/\\u001[dD]/g, gs)
          .replace(/\\u001D/g, gs)
          .replace(/\\u001d/g, gs)
          .replace(/#/g, gs);
      } else {
        // If no GS1 separators found, add gs at the beginning and end
        processedData = gs + processedData + gs;
      }
      
      const encodedData = encodeURIComponent(processedData);
      
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = 'https://barcode.tec-it.com/barcode.ashx';

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
      
      const dataMatrixUrl = `${proxyUrl}${targetUrl}?${params.join('&')}`;
      console.log('Generated DataMatrix URL (via proxy):', dataMatrixUrl);
      
      return await this.loadImageAsDataUrl(dataMatrixUrl);
    } catch (error) {
      console.error('Error generating DataMatrix:', error);
      return this.generateFallbackCode(data, size, 'DataMatrix');
    }
  }

  static async loadImageAsDataUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error in loadImageAsDataUrl:', error);
      throw error;
    }
  }

  private static generateFallbackCode(_data: string, size: number, type: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
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
