import { ProductMarkDetail } from '@/types/ProductMark';

export interface ImportedProduct {
  id: string;
  productCode: string;
  productName: string;
  barcodes: string[];
  vendorCode: string;
  markcodes: string[];
  brand?: string;
}

export interface ImportResponse {
  products: ImportedProduct[];
}

/**
 * Декодирует base64 строку в обычную строку
 */
export function decodeBase64(base64String: string): string {
  try {
    return atob(base64String);
  } catch (error) {
    console.error('Error decoding base64:', error);
    return base64String; // Возвращаем исходную строку если декодирование не удалось
  }
}

/**
 * Определяет тип марки (КМДМ или КМЧЗ) на основе содержимого
 */
export function determineBrandType(decodedMark: string): 'КМДМ' | 'КМЧЗ' {
  // Если содержит GS1 разделители или символы, это КМЧЗ
  if (decodedMark.includes('\u001D') || decodedMark.includes('\\u001D') || decodedMark.includes('#')) {
    return 'КМЧЗ';
  }
  // Иначе это КМДМ
  return 'КМДМ';
}

/**
 * Конвертирует импортированные данные в формат ProductMarkDetail
 */
export function convertToProductMarks(importedProducts: ImportedProduct[]): ProductMarkDetail[] {
  const productMarks: ProductMarkDetail[] = [];
  
  importedProducts.forEach(product => {
    product.markcodes.forEach((markCode, index) => {
      const decodedMark = decodeBase64(markCode);
      const brandType = determineBrandType(decodedMark);
      
      // Берем первый штрих-код из массива
      const barcode = product.barcodes[0] || '';
      
      const productMark: ProductMarkDetail = {
        _id: `${product.id}_${index}_${Date.now()}`,
        product: product.productCode,
        barcode: barcode,
        supplierCode: product.vendorCode,
        brandType: brandType,
        brand: product.brand || 'Unknown',
        datamatrix: decodedMark,
        status: 'В обороте',
        createdAt: new Date().toISOString()
      };
      
      productMarks.push(productMark);
    });
  });
  
  return productMarks;
}

/**
 * Импортирует данные из JSON файла
 */
export function importFromJson(jsonData: ImportResponse): ProductMarkDetail[] {
  try {
    console.log('Importing data from JSON:', jsonData);
    
    if (!jsonData.products || !Array.isArray(jsonData.products)) {
      throw new Error('Invalid JSON format: products array not found');
    }
    
    const productMarks = convertToProductMarks(jsonData.products);
    
    console.log(`Successfully imported ${productMarks.length} product marks`);
    return productMarks;
    
  } catch (error) {
    console.error('Error importing from JSON:', error);
    throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Валидирует структуру JSON данных
 */
export function validateImportData(data: any): data is ImportResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  if (!Array.isArray(data.products)) {
    return false;
  }
  
  return data.products.every((product: any) => 
    typeof product === 'object' &&
    typeof product.id === 'string' &&
    typeof product.productCode === 'string' &&
    Array.isArray(product.barcodes) &&
    typeof product.vendorCode === 'string' &&
    Array.isArray(product.markcodes)
  );
}
