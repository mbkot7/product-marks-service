
interface CodeDisplayProps {
  data: string;
  brandType: 'КМДМ' | 'КМЧЗ';
  size?: number;
  forceShow?: boolean;
}

export function CodeDisplay({ data, brandType, size = 80 }: CodeDisplayProps) {
  if (brandType === 'КМЧЗ') {
    return <DataMatrixDisplay data={data} size={size} withSeparators={true} />;
  } else {
    return <DataMatrixDisplay data={data} size={size} withSeparators={false} />;
  }
}


function DataMatrixDisplay({ data, size, withSeparators }: { data: string; size: number; withSeparators: boolean }) {
  const gs = String.fromCharCode(29);
  const hasGS1 = data.includes('\\u001D') || data.includes('\u001D') || data.includes('#') || data.includes(gs);
  
  let processedData: string;
  let barcodeUrl: string;
  
  if (withSeparators && hasGS1) {
    console.log('Processing GS1 data with separators:', data);
    const gs = String.fromCharCode(29); 
    
    processedData = data
      .replace(/\\u001[dD]/g, gs) 
      .replace(/\\u001D/g, gs)    
      .replace(/\\u001d/g, gs)
      .replace(/#/g, gs);   

    console.log('Processed GS1 data:', processedData);
    
    const encodedData = encodeURIComponent(processedData);
    barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&translate-esc=on&eclevel=L`;
  } else if (withSeparators && !hasGS1) {
    console.log('Processing data without GS1 separators, adding gs wrapper:', data);
    const gs = String.fromCharCode(29);
    processedData = gs + data + gs;
    const encodedData = encodeURIComponent(processedData);
    barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&translate-esc=on&eclevel=L`;
  } else {
    console.log('Processing КМДМ data without separators:', data);
    processedData = data;
    const encodedData = encodeURIComponent(processedData);
    barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodedData}&code=DataMatrix&eclevel=L`;
  }

  console.log('Generated DataMatrix URL:', barcodeUrl);

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