import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Eye, Download } from 'lucide-react';
import { ProductMarkDetail } from '@/types/ProductMark';
import { PDFExportService } from '@/lib/pdfExport';

interface PrintDialogProps {
  productMarks: ProductMarkDetail[];
}

interface PrintSettings {
  copies: number;
  orientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'letter' | 'a3';
  margin: number;
  includeHeaders: boolean;
  includeTimestamps: boolean;
}

const defaultPrintSettings: PrintSettings = {
  copies: 1,
  orientation: 'landscape',
  paperSize: 'a4',
  margin: 10,
  includeHeaders: true,
  includeTimestamps: true,
};

export function PrintDialog({ productMarks }: PrintDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<PrintSettings>(defaultPrintSettings);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = async () => {
    if (productMarks.length === 0) return;

    setIsPrinting(true);
    try {
      // Generate PDF for printing
      const result = await PDFExportService.exportZPLAsPDF(productMarks);
      
      if (result.success && result.fileName) {
        // Create a blob URL for the PDF
        const response = await fetch(`https://api.labelary.com/v1/printers/12dpmm/labels/15x10/0/`, {
          method: 'POST',
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: await PDFExportService.exportAsZPL(productMarks).then(r => r.zplCode || '')
        });

        if (response.ok) {
          const pdfBlob = await response.blob();
          const url = URL.createObjectURL(pdfBlob);
          setPreviewUrl(url);

          // Wait a bit for the iframe to load
          setTimeout(() => {
            if (printFrameRef.current) {
              printFrameRef.current.contentWindow?.print();
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (productMarks.length === 0) return;

    try {
      await PDFExportService.exportZPLAsPDF(productMarks);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Settings
          </DialogTitle>
          <DialogDescription>
            Configure print settings and preview your labels
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Print Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Print Configuration</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="copies">Number of Copies</Label>
                <Input
                  id="copies"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.copies}
                  onChange={(e) => updateSetting('copies', parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>

              <div>
                <Label htmlFor="orientation">Orientation</Label>
                <Select value={settings.orientation} onValueChange={(value: 'portrait' | 'landscape') => updateSetting('orientation', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paperSize">Paper Size</Label>
                <Select value={settings.paperSize} onValueChange={(value: 'a4' | 'letter' | 'a3') => updateSetting('paperSize', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="a3">A3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="margin">Margin (mm)</Label>
                <Input
                  id="margin"
                  type="number"
                  min="0"
                  max="50"
                  value={settings.margin}
                  onChange={(e) => updateSetting('margin', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeHeaders"
                    checked={settings.includeHeaders}
                    onChange={(e) => updateSetting('includeHeaders', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeHeaders">Include Headers</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeTimestamps"
                    checked={settings.includeTimestamps}
                    onChange={(e) => updateSetting('includeTimestamps', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeTimestamps">Include Timestamps</Label>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button 
                onClick={handlePrint} 
                disabled={isPrinting || productMarks.length === 0}
                className="w-full"
              >
                {isPrinting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                {isPrinting ? 'Printing...' : 'Print Labels'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDownload}
                disabled={productMarks.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {productMarks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                No marks to print. Add some marks first.
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h4 className="font-medium">Preview</h4>
            
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
              {previewUrl ? (
                <iframe
                  ref={printFrameRef}
                  src={previewUrl}
                  className="w-full h-full min-h-[400px] border-0"
                  title="Print Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Click "Print Labels" to generate preview</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p><strong>Total Marks:</strong> {productMarks.length}</p>
              <p><strong>Estimated Pages:</strong> {Math.ceil(productMarks.length / 45)}</p>
              <p><strong>Copies:</strong> {settings.copies}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
