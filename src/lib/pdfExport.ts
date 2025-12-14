import jsPDF from 'jspdf';
import { ProductMarkDetail } from '@/types/ProductMark';
import { CodeGenerator } from '@/lib/codeGenerator';

import 'jspdf/dist/polyfills.es.js';

export class PDFExportService {

  static async exportProductMarksToPDF(productMarks: ProductMarkDetail[], title: string = 'Product Marks Report') {
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.setFont('courier');

      pdf.setFontSize(16);
      pdf.setFont('courier', 'normal');
      pdf.text(title, 20, 20);

      pdf.setFontSize(10);
      pdf.setFont('courier', 'normal');
      const now = new Date().toLocaleString('en-GB');
      pdf.text(`Generated: ${now}`, 20, 30);

      const headers = [
        'Product', 'Barcode', 'Supplier Code', 'Brand Type', 
        'Brand', 'Datamatrix', 'Status', 'Created'
      ];

      const data = productMarks.map(mark => [
        mark.product || '-',
        mark.barcode || '-',
        mark.supplierCode || '-',
        mark.brandType,
        mark.brand.substring(0, 15) + (mark.brand.length > 15 ? '...' : ''),
        mark.datamatrix.substring(0, 20) + (mark.datamatrix.length > 20 ? '...' : ''),
        mark.status,
        new Date(mark.createdAt).toLocaleDateString('ru-RU')
      ]);

      let y = 45;
      const rowHeight = 8;
      const colWidths = [20, 20, 20, 15, 30, 35, 20, 20];
      let x = 20;

      pdf.setFontSize(8);
      pdf.setFont('courier', 'normal');
      headers.forEach((header, i) => {
        pdf.rect(x, y, colWidths[i], rowHeight);
        pdf.text(header, x + 2, y + 5);
        x += colWidths[i];
      });

      y += rowHeight;

      pdf.setFont('courier', 'normal');
      data.forEach((row) => {
        x = 20;
        
        if (y > 180) {
          pdf.addPage();
          y = 20;
        }

        row.forEach((cell, i) => {
          pdf.rect(x, y, colWidths[i], rowHeight);
          pdf.text(cell.toString(), x + 2, y + 5);
          x += colWidths[i];
        });
        y += rowHeight;
      });

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, 250, 200);
        pdf.text(`Total records: ${productMarks.length}`, 20, 200);
      }

      const fileName = `product-marks-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async exportProductMarksWithImages(productMarks: ProductMarkDetail[], title: string = 'Product Marks Report') {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.setFont('courier');

      let y = 20;

      pdf.setFillColor(51, 51, 51);
      pdf.rect(15, 10, 180, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('courier', 'normal');
      pdf.text(title, 20, 20);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      pdf.setFont('courier', 'normal');
      const now = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Generated: ${now}`, 20, y + 15);
      y += 25;

      const codesPerRow = 10;
      const rowsPerPage = 4;
      const codeSize = 16;
      const codeSpacing = 2;
      const textHeight = 8;
      const totalCodeHeight = codeSize + textHeight + 4;
      
      const pageWidth = 210;
      const totalGridWidth = codesPerRow * codeSize + (codesPerRow - 1) * codeSpacing;
      const startX = (pageWidth - totalGridWidth) / 2;

      for (let i = 0; i < productMarks.length; i++) {
        const mark = productMarks[i];
        
        if (i > 0 && i % (codesPerRow * rowsPerPage) === 0) {
          pdf.addPage();
          y = 20;
        }

        const gridIndex = i % (codesPerRow * rowsPerPage);
        const row = Math.floor(gridIndex / codesPerRow);
        const col = gridIndex % codesPerRow;
        
        const x = startX + col * (codeSize + codeSpacing);
        const currentY = y + row * totalCodeHeight;

        try {
          if (mark.brandType === 'КМДМ') {
            const codeDataUrl = await CodeGenerator.generateDataMatrix(mark.brand, 100, false);
            
            pdf.addImage(codeDataUrl, 'PNG', x, currentY, codeSize, codeSize);
            
            pdf.setFontSize(6);
            pdf.setTextColor(80, 80, 80);
            const codeText = mark.brand;
            const centerX = x + codeSize / 2;
            pdf.text(codeText, centerX - (codeText.length * 1.5), currentY + codeSize + 4);
            pdf.setTextColor(0, 0, 0);
          } else {
            const hasGS1 = mark.brand.includes('\\u001D') || mark.brand.includes('\u001D');
            let processedData = mark.brand.trim();
            
            if (hasGS1) {
              processedData = processedData
                .replace(/\\u001[dD]/g, String.fromCharCode(29))
                .replace(/\\u001D/g, String.fromCharCode(29))
                .replace(/\\u001d/g, String.fromCharCode(29));
            }
            
            if (!processedData || processedData.length === 0) {
              throw new Error('Empty data for DataMatrix');
            }
            
            const encodedData = encodeURIComponent(processedData);
            const dataMatrixUrl = hasGS1 
              ? `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&translate-esc=on&eclevel=L&dpi=96&imgsize=6`
              : `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&eclevel=L&dpi=96&imgsize=6`;
            
            let codeDataUrl: string | undefined;
            try {
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 5000);
              });
              
              codeDataUrl = await Promise.race([
                CodeGenerator.loadImageAsDataUrl(dataMatrixUrl),
                timeoutPromise
              ]);
            } catch (loadError) {
              console.warn('Failed to load DataMatrix image:', loadError);
            }

            if (codeDataUrl) {
              pdf.addImage(codeDataUrl, 'PNG', x, currentY, codeSize, codeSize);
              
              pdf.setFontSize(6);
              pdf.setTextColor(80, 80, 80);
              let codeText = mark.brand;
              
              if (mark.brandType === 'КМЧЗ') {
                const gs1Index = codeText.search(/\\u001[dD]|\u001D/);
                if (gs1Index !== -1) {
                  codeText = codeText.substring(0, gs1Index);
                }
              }
              
              const centerX = x + codeSize / 2;
              pdf.text(codeText, centerX - (codeText.length * 1.5), currentY + codeSize + 4);
              pdf.setTextColor(0, 0, 0);
            } else {
              pdf.setFontSize(6);
              pdf.setTextColor(100, 100, 100);
              const centerX = x + codeSize / 2;
              const truncatedData = processedData.length > 8 ? processedData.substring(0, 8) + '...' : processedData;
              pdf.text(truncatedData, centerX - (truncatedData.length * 1.5), currentY + codeSize + 4);
              pdf.setTextColor(0, 0, 0);
            }
          }
        } catch (imgError) {
          pdf.setFontSize(6);
          pdf.setTextColor(100, 100, 100);
          const centerX = x + codeSize / 2;
          const truncatedData = mark.brand.length > 8 ? mark.brand.substring(0, 8) + '...' : mark.brand;
          pdf.text(truncatedData, centerX - (truncatedData.length * 1.5), currentY + codeSize + 4);
          pdf.setTextColor(0, 0, 0);
        }
      }

      // Clean footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Footer line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(15, 280, 195, 280);
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Page ${i} of ${pageCount}`, 170, 285);
        pdf.text(`Total: ${productMarks.length} codes`, 20, 285);
      }

      // Download the PDF
      const fileName = `product-marks-codes-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating codes PDF:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async exportAsZPL(productMarks: ProductMarkDetail[]): Promise<{ success: boolean; zplCode?: string; error?: string }> {
    try {
      const now = new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let zplCode = '';
      const codesPerPage = 45;
      const totalPages = Math.ceil(productMarks.length / codesPerPage);

      for (let page = 0; page < totalPages; page++) {
        zplCode += '^XA\n';
        zplCode += `^FO4350,3000 ^A0,20,20 ^FD${now}^FS\n`;

        const startIndex = page * codesPerPage;
        const endIndex = Math.min(startIndex + codesPerPage, productMarks.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          const mark = productMarks[i];
          const localIndex = i - startIndex;
          
          const codesPerRow = 9;
          const row = Math.floor(localIndex / codesPerRow);
          const col = localIndex % codesPerRow;
          
          const x = 50 + col * 500;
          const y = 100 + row * 600;
          const textY = y + 450;
          
          if (mark.brandType === 'КМДМ') {
            zplCode += `^FO${x},${y} ^BXN,18,200,Y,N,N^FD${mark.brand}^FS\n`;
          } else {
            zplCode += `^FO${x},${y} ^BXN,10,200,Y,N,N^FD${mark.brand}^FS\n`;
          }
          
          let smallText = mark.brand;
          
          if (mark.brandType === 'КМЧЗ') {
            const gs1Index = smallText.search(/\\u001[dD]|\u001D/);
            if (gs1Index !== -1) {
              smallText = smallText.substring(0, gs1Index);
            }
          }
          
          zplCode += `^FO${x},${textY} ^A0,25,25 ^FD${smallText}^FS\n`;
        }

        zplCode += '^XZ\n';
      }

      return { success: true, zplCode };
    } catch (error) {
      console.error('Error generating ZPL code:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

    static async exportZPLAsPDF(productMarks: ProductMarkDetail[]): Promise<{ success: boolean; fileName?: string; error?: string }> {
    try {
      const codesPerPage = 45;
      const totalPages = Math.ceil(productMarks.length / codesPerPage);
      
      if (totalPages === 1) {
        const zplResult = await this.exportAsZPL(productMarks);
        
        if (!zplResult.success || !zplResult.zplCode) {
          return { success: false, error: zplResult.error || 'Failed to generate ZPL code' };
        }

        const response = await fetch('https://api.labelary.com/v1/printers/12dpmm/labels/15x10/0/', {
          method: 'POST',
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: zplResult.zplCode
        });

        if (!response.ok) {
          throw new Error(`Labelary API error: ${response.status} ${response.statusText}`);
        }

        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-marks-labels-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, fileName: link.download };
      } else {
        const pdfBlobs: Blob[] = [];
        
        for (let page = 0; page < totalPages; page++) {
          const startIndex = page * codesPerPage;
          const endIndex = Math.min(startIndex + codesPerPage, productMarks.length);
          const pageMarks = productMarks.slice(startIndex, endIndex);
          
          const zplResult = await this.exportAsZPL(pageMarks);
          
          if (!zplResult.success || !zplResult.zplCode) {
            return { success: false, error: zplResult.error || 'Failed to generate ZPL code' };
          }

          const response = await fetch('https://api.labelary.com/v1/printers/12dpmm/labels/15x10/0/', {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: zplResult.zplCode
          });

          if (!response.ok) {
            throw new Error(`Labelary API error: ${response.status} ${response.statusText}`);
          }

          const pdfBlob = await response.blob();
          pdfBlobs.push(pdfBlob);
        }

        const { PDFDocument } = await import('pdf-lib');
        const mergedPdf = await PDFDocument.create();
        
        for (const pdfBlob of pdfBlobs) {
          const pdfBytes = await pdfBlob.arrayBuffer();
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page: any) => mergedPdf.addPage(page));
        }
        
        const mergedPdfBytes = await mergedPdf.save();
        const mergedPdfBlob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(mergedPdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-marks-labels-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, fileName: link.download };
      }
    } catch (error) {
      console.error('Error converting ZPL to PDF:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async exportWithDataMatrixCodes(productMarks: ProductMarkDetail[], title: string = 'Product Marks with Codes') {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add PT Sans font for Cyrillic support
      pdf.setFont('courier');

      let y = 20;
      const pageHeight = 270;
      const itemHeight = 60;

      pdf.setFontSize(16);
      pdf.setFont('courier', 'normal');
      pdf.text(title, 20, y);
      y += 15;

      pdf.setFontSize(10);
      pdf.setFont('courier', 'normal');
      const now = new Date().toLocaleString('ru-RU');
      pdf.text(`Создано: ${now}`, 20, y);
      y += 15;

      for (const mark of productMarks) {
        if (y + itemHeight > pageHeight) {
          pdf.addPage();
          y = 20;
        }

        pdf.rect(20, y, 170, itemHeight);

        pdf.setFontSize(12);
        pdf.setFont('courier', 'normal');
        pdf.text(`Product: ${mark.product || 'N/A'}`, 25, y + 10);
        
        pdf.setFontSize(10);
        pdf.setFont('courier', 'normal');
        pdf.text(`Barcode: ${mark.barcode || 'N/A'}`, 25, y + 18);
        pdf.text(`Supplier Code: ${mark.supplierCode || 'N/A'}`, 25, y + 26);
        pdf.text(`Brand Type: ${mark.brandType}`, 25, y + 34);
        pdf.text(`Status: ${mark.status}`, 25, y + 42);
        
        const brand = mark.brand.length > 30 ? mark.brand.substring(0, 30) + '...' : mark.brand;
        pdf.text(`Brand: ${brand}`, 25, y + 50);

        pdf.setFontSize(8);
        pdf.setFont('courier', 'normal');
        pdf.text('DataMatrix:', 120, y + 10);
        
        const datamatrix = mark.datamatrix;
        const maxCharsPerLine = 25;
        const lines = [] as string[];
        for (let i = 0; i < datamatrix.length; i += maxCharsPerLine) {
          lines.push(datamatrix.substring(i, i + maxCharsPerLine));
        }
        
        lines.slice(0, 6).forEach((line, index) => {
          pdf.text(line, 120, y + 18 + (index * 6));
        });

        y += itemHeight + 10;
      }

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, 180, 285);
        pdf.text(`Total records: ${productMarks.length}`, 20, 285);
      }

      const fileName = `product-marks-detailed-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating detailed PDF:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
