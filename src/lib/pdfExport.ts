import jsPDF from 'jspdf';
import { ProductMarkDetail } from '@/types/ProductMark';

export class PDFExportService {
  static async exportProductMarksToPDF(productMarks: ProductMarkDetail[], title: string = 'Product Marks Report') {
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 20, 20);

      // Add timestamp
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const now = new Date().toLocaleString();
      pdf.text(`Generated: ${now}`, 20, 30);

      // Table headers
      const headers = [
        'Product', 'Barcode', 'Supplier Code', 'Brand Type', 
        'Brand', 'Status', 'Created'
      ];

      // Table data
      const data = productMarks.map(mark => [
        mark.product || '-',
        mark.barcode || '-',
        mark.supplierCode || '-',
        mark.brandType,
        mark.brand.substring(0, 20) + (mark.brand.length > 20 ? '...' : ''),
        mark.status,
        new Date(mark.createdAt).toLocaleDateString()
      ]);

      // Simple table implementation
      let y = 45;
      const rowHeight = 8;
      const colWidths = [25, 25, 25, 20, 40, 25, 25]; // Column widths
      let x = 20;

      // Draw headers
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        pdf.rect(x, y, colWidths[i], rowHeight);
        pdf.text(header, x + 2, y + 5);
        x += colWidths[i];
      });

      y += rowHeight;

      // Draw data rows
      pdf.setFont('helvetica', 'normal');
      data.forEach((row) => {
        x = 20;
        
        // Check if we need a new page
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

      // Add footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, 250, 200);
        pdf.text(`Total records: ${productMarks.length}`, 20, 200);
      }

      // Download the PDF
      const fileName = `product-marks-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
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

      let y = 20;
      const pageHeight = 270;
      const itemHeight = 60; // Height per product mark item

      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 20, y);
      y += 15;

      // Add timestamp
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const now = new Date().toLocaleString();
      pdf.text(`Generated: ${now}`, 20, y);
      y += 15;

      for (const mark of productMarks) {
        // Check if we need a new page
        if (y + itemHeight > pageHeight) {
          pdf.addPage();
          y = 20;
        }

        // Draw border around item
        pdf.rect(20, y, 170, itemHeight);

        // Product info
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Product: ${mark.product || 'N/A'}`, 25, y + 10);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Barcode: ${mark.barcode || 'N/A'}`, 25, y + 18);
        pdf.text(`Supplier Code: ${mark.supplierCode || 'N/A'}`, 25, y + 26);
        pdf.text(`Brand Type: ${mark.brandType}`, 25, y + 34);
        pdf.text(`Status: ${mark.status}`, 25, y + 42);
        
        // Brand (truncated)
        const brand = mark.brand.length > 30 ? mark.brand.substring(0, 30) + '...' : mark.brand;
        pdf.text(`Brand: ${brand}`, 25, y + 50);

        // DataMatrix info (right side)
        pdf.setFontSize(8);
        pdf.text('DataMatrix:', 120, y + 10);
        
        // Split datamatrix into multiple lines
        const datamatrix = mark.datamatrix;
        const maxCharsPerLine = 25;
        const lines = [];
        for (let i = 0; i < datamatrix.length; i += maxCharsPerLine) {
          lines.push(datamatrix.substring(i, i + maxCharsPerLine));
        }
        
        lines.slice(0, 6).forEach((line, index) => {
          pdf.text(line, 120, y + 18 + (index * 6));
        });

        y += itemHeight + 10;
      }

      // Add footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, 180, 285);
        pdf.text(`Total records: ${productMarks.length}`, 20, 285);
      }

      // Download the PDF
      const fileName = `product-marks-detailed-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating detailed PDF:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
