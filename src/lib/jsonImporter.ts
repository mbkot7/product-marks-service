import { ProductMarkDetail } from '@/types/ProductMark';

export interface ImportedProduct {
  id: string;
  productCode: string;
  productName: string;
  barcodes: string[];
  vendorCode?: string;
  markcodes?: string[];
  tnp1?: string;
}

export interface ImportResponse {
  products: ImportedProduct[];
}

export interface ResponseData {
  id?: number;
  storeCode?: string;
  storeName?: string;
  task?: string;
  type?: string;
  typeName?: string;
  status?: string;
  statusName?: string;
  goodsNumber?: number;
  productsNumber?: number;
  createdAt?: number;
  createdDateTime?: string;
  deadlineAt?: number;
  deadlineDateTime?: string;
  storeUntil?: number;
  storeUntilDateTime?: string;
  userStartPicked?: string;
  currencySymbol?: string;
  totalPrice?: string;
  products: ImportedProduct[];
  availableSectors?: string[];
  prepaid?: boolean;
  replaceSoftCheck?: boolean;
  prolongAllow?: boolean;
}

/**
 * Декодирует base64 строку в обычную строку
 */
export function decodeBase64(base64String: string): string {
  console.log('Decoding base64:', base64String);
  try {
    const decoded = atob(base64String);
    console.log('Decoded result before GS replacement:', decoded);
    
    // Заменяем символ GS (ASCII 29) на \u001D
    const gs = String.fromCharCode(29);
    const result = decoded.replace(new RegExp(gs, 'g'), '\\u001D');
    
    console.log('Final decoded result:', result);
    return result;
  } catch (error) {
    console.error('Error decoding base64:', error, 'Original string:', base64String);
    return base64String; // Возвращаем исходную строку если декодирование не удалось
  }
}

/**
 * Определяет тип марки (КМДМ или КМЧЗ) на основе содержимого
 */
export function determineBrandType(decodedMark: string): 'КМДМ' | 'КМЧЗ' {
  // Если содержит GS1 разделители или символы, это КМЧЗ
  const gs = String.fromCharCode(29);
  if (decodedMark.includes('\u001D') || decodedMark.includes('\\u001D') || decodedMark.includes('#') || decodedMark.includes(gs)) {
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
  
  console.log(`Processing ${importedProducts.length} products`);
  
  importedProducts.forEach((product, productIndex) => {
    console.log(`Product ${productIndex}: id=${product.id}, tnp1=${product.tnp1}, markcodes=${product.markcodes?.length || 0}`);
    
    // Обрабатываем только товары с tnp1: "X" и наличием марок
    if (product.tnp1 === 'X' && product.markcodes && product.markcodes.length > 0) {
      console.log(`Processing product ${product.id} with ${product.markcodes.length} marks`);
      
      product.markcodes.forEach((markCode, index) => {
        console.log(`Processing mark ${index} for product ${product.id}:`, markCode);
        
        const decodedMark = decodeBase64(markCode);
        const brandType = determineBrandType(decodedMark);
        
        // Берем первый штрих-код из массива
        const barcode = product.barcodes[0] || '';
        
        console.log(`Creating product mark:`, {
          id: `${product.id}_${index}_${Date.now()}`,
          product: product.productCode,
          barcode: barcode,
          supplierCode: product.vendorCode || '',
          brandType: brandType,
          brand: decodedMark || 'Unknown',
          status: 'В обороте'
        });
        
        const productMark: ProductMarkDetail = {
          _id: `${product.id}_${index}_${Date.now()}`,
          product: product.productCode,
          barcode: barcode,
          supplierCode: product.vendorCode || '',
          brandType: brandType,
          brand: decodedMark || 'Unknown',
          datamatrix: decodedMark,
          status: 'В обороте',
          createdAt: new Date().toISOString()
        };
        
        console.log(`Final product mark:`, productMark);
        productMarks.push(productMark);
      });
    } else {
      console.log(`Skipping product ${product.id}: tnp1=${product.tnp1}, hasMarkcodes=${!!product.markcodes}`);
    }
  });
  
  console.log(`Total product marks created: ${productMarks.length}`);
  return productMarks;
}

/**
 * Импортирует данные из JSON файла
 */
export function importFromJson(jsonData: ImportResponse | ResponseData): ProductMarkDetail[] {
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
export function validateImportData(data: any): data is ImportResponse | ResponseData {
  console.log('Validating data:', data);
  console.log('Data type:', typeof data);
  console.log('Data is object:', typeof data === 'object');
  console.log('Data is null:', data === null);
  console.log('Data.products exists:', 'products' in data);
  console.log('Data.products type:', typeof data.products);
  console.log('Data.products is array:', Array.isArray(data.products));
  console.log('Data.products length:', data.products?.length);
  
  if (!data || typeof data !== 'object') {
    console.log('Validation failed: data is not an object');
    return false;
  }
  
  // Проверяем, что есть массив products
  if (!Array.isArray(data.products)) {
    console.log('Validation failed: products is not an array, it is:', typeof data.products);
    return false;
  }
  
  // Проверяем, что массив products не пустой
  if (data.products.length === 0) {
    console.log('Validation failed: products array is empty');
    return false;
  }
  
  // Проверяем структуру каждого продукта
  const isValid = data.products.every((product: any, index: number) => {
    console.log(`Validating product ${index}:`, product);
    
    const checks = {
      isObject: typeof product === 'object' && product !== null,
      hasId: typeof product.id === 'string',
      hasProductCode: typeof product.productCode === 'string',
      hasBarcodes: Array.isArray(product.barcodes),
      hasVendorCode: !product.vendorCode || typeof product.vendorCode === 'string', // vendorCode не обязателен
      hasMarkcodes: !product.markcodes || Array.isArray(product.markcodes) // markcodes не обязательны
    };
    
    console.log(`Product ${index} checks:`, checks);
    
    const productValid = Object.values(checks).every(check => check);
    console.log(`Product ${index} is valid:`, productValid);
    
    if (!productValid) {
      console.log(`Product ${index} failed validation:`, product);
    }
    
    return productValid;
  });
  
  console.log('Overall validation result:', isValid);
  return isValid;
}
