import { useState, useEffect } from 'react';
import { CodeGenerator } from '@/lib/codeGenerator';

interface CodeDisplayProps {
  data: string;
  brandType: 'КМДМ' | 'КМЧЗ';
  size?: number;
  forceShow?: boolean;
}

export function CodeDisplay({ data, brandType, size = 80 }: CodeDisplayProps) {
  if (brandType === 'КМЧЗ') {
    return <DataMatrixDisplay data={data} size={size} />; // КМЧЗ uses DataMatrix with GS1
  } else { // КМДМ
    return <QRCodeDisplay data={data} size={size} />; // КМДМ uses local QR code
  }
}

// QR Code display using local generation for КМДМ (simple numeric codes)
function QRCodeDisplay({ data, size }: { data: string; size: number }) {
  const [codeUrl, setCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateCode = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log(`Generating QR code for data: ${data.substring(0, 50)}...`);
        const url = await CodeGenerator.generateQRCode(data, size);
        setCodeUrl(url);
        console.log('Successfully generated QR code');
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    generateCode();
  }, [data, size]);

  if (loading) {
    return (
      <div className="flex items-center justify-center border rounded bg-gray-50" style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gray-100 border rounded"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-red-500">Error</span>
        <span className="text-xs text-gray-500">QR</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={codeUrl}
        alt="QR Code"
        className="border rounded"
        style={{ width: size, height: size }}
        onError={() => {
          console.error('QR code failed to display');
        }}
      />
    </div>
  );
}

// DataMatrix display using TEC-IT barcode service for КМЧЗ (GS1 codes)
function DataMatrixDisplay({ data, size }: { data: string; size: number }) {
  // Check if data contains GS1 separators
  const hasGS1 = data.includes('\\u001D') || data.includes('\u001D');
  
  let processedData: string;
  let barcodeUrl: string;
  
  if (hasGS1) {
    // Process GS1 data to handle separator characters correctly
    console.log('Processing GS1 data:', data);

    // Replace Unicode escape sequences with actual GS1 separator character (ASCII 29)
    processedData = data
      .replace(/\\u001[dD]/g, String.fromCharCode(29)) // Handle \u001D and \u001d
      .replace(/\\u001D/g, String.fromCharCode(29))    // Handle \u001D specifically
      .replace(/\\u001d/g, String.fromCharCode(29));   // Handle \u001d specifically

    console.log('Processed GS1 data:', processedData);
    
    // For TEC-IT service with GS1 data
    const encodedData = encodeURIComponent(processedData);
    barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&translate-esc=on&eclevel=L`;
  } else {
    // For simple numeric codes, use the data as-is
    console.log('Processing simple numeric data:', data);
    processedData = data;
    const encodedData = encodeURIComponent(processedData);
    barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&eclevel=L`;
  }

  console.log('Generated DataMatrix URL:', barcodeUrl);

  // Create a safe SVG fallback using encodeURIComponent instead of btoa
  const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="40%" text-anchor="middle" font-family="monospace" font-size="8" fill="#6b7280">
        DataMatrix
      </text>
      <text x="50%" y="60%" text-anchor="middle" font-family="monospace" font-size="6" fill="#9ca3af">
        Loading...
      </text>
    </svg>
  `)}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={barcodeUrl} 
        alt="DataMatrix Code" 
        className="border rounded bg-white"
        style={{ width: size, height: size }}
        onError={(e) => {
          console.error('DataMatrix failed to load, using fallback');
          (e.target as HTMLImageElement).src = fallbackSvg;
        }}
      />
    </div>
  );
}