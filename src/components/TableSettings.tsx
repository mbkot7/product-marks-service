import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface TableSettings {
  showProduct: boolean;
  showBarcode: boolean;
  showSupplierCode: boolean;
  showBrandType: boolean;
  showBrand: boolean;
  showDatamatrix: boolean;
  showStatus: boolean;
  brandColumnWidth: number;
}

interface TableSettingsProps {
  settings: TableSettings;
  onSettingsChange: (settings: TableSettings) => void;
}

const defaultSettings: TableSettings = {
  showProduct: true,
  showBarcode: true,
  showSupplierCode: true,
  showBrandType: true,
  showBrand: true,
  showDatamatrix: true,
  showStatus: true,
  brandColumnWidth: 200,
};

export function TableSettings({ settings, onSettingsChange }: TableSettingsProps) {
  const [localSettings, setLocalSettings] = useState<TableSettings>(settings);
  const [isOpen, setIsOpen] = useState(false);

  // Update local settings when external settings change
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggleColumn = (column: keyof Omit<TableSettings, 'brandColumnWidth'>) => {
    const newSettings = { ...localSettings, [column]: !localSettings[column] };
    setLocalSettings(newSettings);
  };

  const handleWidthChange = (width: number) => {
    const newSettings = { ...localSettings, brandColumnWidth: Math.max(50, Math.min(500, width)) };
    setLocalSettings(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
  };

  const visibleColumnsCount = Object.values(localSettings).filter(value => typeof value === 'boolean' && value).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Table Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Table Settings
          </DialogTitle>
          <DialogDescription>
            Configure which columns to display and adjust column widths
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Visible Columns ({visibleColumnsCount})</h4>
            <div className="space-y-3">
              {[
                { key: 'showProduct', label: 'Товар', icon: localSettings.showProduct ? Eye : EyeOff },
                { key: 'showBarcode', label: 'Штрих-код', icon: localSettings.showBarcode ? Eye : EyeOff },
                { key: 'showSupplierCode', label: 'Код поставщика', icon: localSettings.showSupplierCode ? Eye : EyeOff },
                { key: 'showBrandType', label: 'Тип марки', icon: localSettings.showBrandType ? Eye : EyeOff },
                { key: 'showBrand', label: 'Марка', icon: localSettings.showBrand ? Eye : EyeOff },
                { key: 'showDatamatrix', label: 'QR/DataMatrix код', icon: localSettings.showDatamatrix ? Eye : EyeOff },
                { key: 'showStatus', label: 'Статус', icon: localSettings.showStatus ? Eye : EyeOff },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm">{label}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleColumn(key as keyof Omit<TableSettings, 'brandColumnWidth'>)}
                    className="h-8 w-8 p-0"
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Column Width</h4>
            <div className="space-y-2">
              <Label htmlFor="brandWidth">Марка column width (px)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="brandWidth"
                  type="number"
                  min="50"
                  max="500"
                  value={localSettings.brandColumnWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
