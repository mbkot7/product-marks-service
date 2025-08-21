import jsPDF from 'jspdf';
import { ProductMarkDetail } from '@/types/ProductMark';
import { CodeGenerator } from '@/lib/codeGenerator';



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
        'Brand', 'Datamatrix', 'Status', 'Created'
      ];

      // Table data
      const data = productMarks.map(mark => [
        mark.product || '-',
        mark.barcode || '-',
        mark.supplierCode || '-',
        mark.brandType,
        mark.brand.substring(0, 15) + (mark.brand.length > 15 ? '...' : ''),
        mark.datamatrix.substring(0, 20) + (mark.datamatrix.length > 20 ? '...' : ''),
        mark.status,
        new Date(mark.createdAt).toLocaleDateString()
      ]);

      // Simple table implementation
      let y = 45;
      const rowHeight = 8;
      const colWidths = [20, 20, 20, 15, 30, 35, 20, 20]; // Column widths
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

  // Export with beautiful table format and QR/DataMatrix images
  static async exportProductMarksWithImages(productMarks: ProductMarkDetail[], title: string = 'Product Marks Report') {
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      let y = 20;
      const pageHeight = 190; // Page content height
      const rowHeight = 22; // Optimized for 8 rows per page

      // Add title with styling
      pdf.setFillColor(41, 98, 255); // Blue background
      pdf.rect(15, 10, 267, 20, 'F');
      pdf.setTextColor(255, 255, 255); // White text
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 20, 23);
      
      // Add timestamp
      pdf.setTextColor(0, 0, 0); // Black text
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const now = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Generated: ${now}`, 20, y + 20);
      y += 35;

      // Table headers with better styling (matching frontend)
      const headers = ['#', 'Товар', 'Штрих-код', 'Код поставщика', 'Тип марки', 'Марка', 'QR/DataMatrix код'];
      const colPositions = [15, 25, 50, 75, 100, 125, 200];
      const colWidths = [8, 23, 23, 23, 23, 73, 30];

      // Header background (adjust width for new columns)
      const tableWidth = colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1] - 15;
      pdf.setFillColor(230, 230, 230);
      pdf.rect(15, y, tableWidth, 12, 'F');
      
      // Header border
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      pdf.rect(15, y, tableWidth, 12);
      
      // Header text
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      for (let i = 0; i < headers.length; i++) {
        pdf.text(headers[i], colPositions[i] + 1, y + 8);
        // Vertical lines for columns
        if (i > 0) {
          pdf.line(colPositions[i], y, colPositions[i], y + 12);
        }
      }
      y += 12;

      // Process each mark with better error handling
      for (let i = 0; i < productMarks.length; i++) {
        const mark = productMarks[i];
        
        // Check if we need a new page
        if (y + rowHeight > pageHeight) {
          pdf.addPage();
          y = 20;
          
          // Redraw headers on new page
          pdf.setFillColor(230, 230, 230);
          pdf.rect(15, y, tableWidth, 12, 'F');
          pdf.setDrawColor(100, 100, 100);
          pdf.rect(15, y, tableWidth, 12);
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          for (let j = 0; j < headers.length; j++) {
            pdf.text(headers[j], colPositions[j] + 1, y + 8);
            if (j > 0) {
              pdf.line(colPositions[j], y, colPositions[j], y + 12);
            }
          }
          y += 12;
        }

        // Row background (alternating colors)
        if (i % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(15, y, tableWidth, rowHeight, 'F');
        }
        
        // Row border
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.rect(15, y, tableWidth, rowHeight);

        // Row data
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        const data = [
          (i + 1).toString(),
          mark.product || '-',
          mark.barcode || '-',
          mark.supplierCode || '-',
          mark.brandType,
          mark.brand, // Full brand text
          '' // QR/DataMatrix will be image
        ];

        // Draw text data with word wrapping
        for (let j = 0; j < data.length; j++) {
          if (j !== 6) { // Skip QR/DataMatrix column
            const text = data[j];
            const maxWidth = colWidths[j] - 4; // More padding
            
            // Word wrap for longer text in Brand column only
            if (j === 5 && text.length > 25) { // Brand column
              const lines = pdf.splitTextToSize(text, maxWidth);
              let textY = y + 6;
              for (const line of lines.slice(0, 2)) { // Max 2 lines
                pdf.text(line, colPositions[j] + 2, textY);
                textY += 6;
                if (textY > y + rowHeight - 2) break;
              }
            } else {
              // Center text vertically for single-line content
              pdf.text(text, colPositions[j] + 2, y + rowHeight/2 + 2);
            }
          }
          
          // Draw column separators
          if (j > 0) {
            pdf.line(colPositions[j], y, colPositions[j], y + rowHeight);
          }
        }

        // Add QR/DataMatrix image
        try {
          console.log(`Generating ${mark.brandType} code for: ${mark.brand}`);
          
          if (mark.brandType === 'КМДМ') {
            // Generate QR code locally
            const codeDataUrl = await CodeGenerator.generateQRCode(mark.brand, 100);
            
            // Center image in column
            const imgSize = 16; // Optimal size for 22mm row height
            const imgX = colPositions[6] + (colWidths[6] - imgSize) / 2;
            const imgY = y + (rowHeight - imgSize) / 2;
            
            // Add the generated QR code image directly to PDF
            pdf.addImage(codeDataUrl, 'PNG', imgX, imgY, imgSize, imgSize);
          } else {
            // Generate DataMatrix using TEC-IT API
            const hasGS1 = mark.brand.includes('\\u001D') || mark.brand.includes('\u001D');
            let processedData = mark.brand.trim();
            
            if (hasGS1) {
              processedData = processedData
                .replace(/\\u001[dD]/g, String.fromCharCode(29))
                .replace(/\\u001D/g, String.fromCharCode(29))
                .replace(/\\u001d/g, String.fromCharCode(29));
            }
            
            const encodedData = encodeURIComponent(processedData);
            const dataMatrixUrl = hasGS1 
              ? `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&translate-esc=on&eclevel=L`
              : `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&eclevel=L`;
            
            // Load DataMatrix image and add to PDF
            const codeDataUrl = await CodeGenerator.loadImageAsDataUrl(dataMatrixUrl);
            
            // Center image in column
            const imgSize = 16; // Optimal size for 22mm row height
            const imgX = colPositions[6] + (colWidths[6] - imgSize) / 2;
            const imgY = y + (rowHeight - imgSize) / 2;
            
            // Add the DataMatrix image to PDF
            pdf.addImage(codeDataUrl, 'PNG', imgX, imgY, imgSize, imgSize);
          }
          
          console.log(`Successfully added ${mark.brandType} image`);
        } catch (imgError) {
          console.error(`Failed to generate ${mark.brandType} code:`, imgError);
          
          // Text fallback if code generation fails
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          const centerX = colPositions[6] + colWidths[6] / 2;
          pdf.text('⚠', centerX - 2, y + rowHeight/2 - 2);
          pdf.text('Error', centerX - 6, y + rowHeight/2 + 4);
          pdf.setTextColor(0, 0, 0);
        }

        y += rowHeight;
      }

      // Beautiful footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Footer line
        pdf.setDrawColor(41, 98, 255);
        pdf.setLineWidth(1);
        pdf.line(15, 200, 15 + tableWidth, 200);
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Страница ${i} из ${pageCount}`, 15 + tableWidth - 40, 205);
        pdf.text(`Всего записей: ${productMarks.length}`, 20, 205);
        pdf.text('Создано в Product Mark Details Service', 20, 210);
      }

      // Download the PDF
      const fileName = `product-marks-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating beautiful PDF:', error);
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
