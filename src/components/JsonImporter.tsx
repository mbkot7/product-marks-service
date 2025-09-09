import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { importFromJson, validateImportData, ImportResponse } from '@/lib/jsonImporter';
import { ProductMarkDetail } from '@/types/ProductMark';
import { useToast } from '@/hooks/useToast';

interface JsonImporterProps {
  onImport: (productMarks: ProductMarkDetail[]) => void;
}

export function JsonImporter({ onImport }: JsonImporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите JSON файл',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!validateImportData(jsonData)) {
        throw new Error('Неверный формат JSON файла. Ожидается структура с массивом products');
      }

      const productMarks = importFromJson(jsonData as ImportResponse);
      
      if (productMarks.length === 0) {
        toast({
          title: 'Предупреждение',
          description: 'В файле не найдено марок для импорта',
          variant: 'destructive'
        });
        return;
      }

      onImport(productMarks);
      
      toast({
        title: 'Успешно',
        description: `Импортировано ${productMarks.length} марок`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Ошибка импорта',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Импорт из JSON</CardTitle>
        <CardDescription>
          Загрузите JSON файл с данными о марках товаров
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">
                Перетащите JSON файл сюда или
              </p>
              <Button
                onClick={openFileDialog}
                disabled={isLoading}
                variant="outline"
                className="mt-2"
              >
                {isLoading ? 'Загрузка...' : 'Выберите файл'}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              Поддерживается формат JSON с массивом products
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
