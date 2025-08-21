interface CodeDisplayProps {
  data: string;
  brandType: 'КМДМ' | 'КМЧЗ';
  size?: number;
  forceShow?: boolean;
}

export function CodeDisplay({ data, brandType, size = 80 }: CodeDisplayProps) {
  if (brandType === 'КМЧЗ') {
    return <QRCodeDisplay data={data} size={size} />;
  } else {
    return <DataMatrixDisplay data={data} size={size} />;
  }
}

// QR Code display using QR-Server.com API for КМЧЗ
function QRCodeDisplay({ data, size }: { data: string; size: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={qrUrl} 
        alt="QR Code" 
        className="border rounded"
        style={{ width: size, height: size }}
        onError={(e) => {
          console.error('QR code failed to load:', e);
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="text-xs text-center max-w-[200px] break-all">
        <span className="font-mono bg-gray-100 px-1 py-0.5 rounded" title={data}>
          {data}
        </span>
      </div>
    </div>
  );
}

// DataMatrix display using TEC-IT barcode service with proper GS1 handling
function DataMatrixDisplay({ data, size }: { data: string; size: number }) {
  // Process GS1 data to handle separator characters correctly
  const processGS1Data = (inputData: string): string => {
    console.log('Processing GS1 data:', inputData);

    // Replace Unicode escape sequences with actual GS1 separator character (ASCII 29)
    let processedData = inputData
      .replace(/\\u001[dD]/g, String.fromCharCode(29)) // Handle \u001D and \u001d
      .replace(/\\u001D/g, String.fromCharCode(29))    // Handle \u001D specifically
      .replace(/\\u001d/g, String.fromCharCode(29));   // Handle \u001d specifically

    console.log('Processed GS1 data:', processedData);
    return processedData;
  };

  // Process the data for GS1 compliance
  const processedData = processGS1Data(data);

  // For TEC-IT service, we need to properly encode the GS1 data
  // The service expects GS1 separators to be represented as <GS> or we can use the raw character
  const encodedData = encodeURIComponent(processedData);

  // Generate TEC-IT DataMatrix barcode URL with proper GS1 handling
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&translate-esc=on&eclevel=L`;

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
      <div className="text-xs text-center max-w-[200px] break-all">
        <span className="font-mono bg-gray-100 px-1 py-0.5 rounded" title={data}>
          {data}
        </span>
      </div>
    </div>
  );
}
