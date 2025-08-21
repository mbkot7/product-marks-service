export interface ProductMarkDetail {
  _id: string;
  product: string;
  barcode: string;
  supplierCode: string;
  brandType: 'КМДМ' | 'КМЧЗ';
  brand: string;
  datamatrix: string;
  status: 'Выбыла' | 'В обороте' | 'Сломана';
  createdAt: string;
}

export const BRAND_TYPES = ['КМДМ', 'КМЧЗ'] as const;
export const MARK_STATUSES = ['Выбыла', 'В обороте', 'Сломана'] as const;
