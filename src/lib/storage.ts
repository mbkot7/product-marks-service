import { ProductMarkDetail } from '@/types/ProductMark';

const STORAGE_KEY = 'product-marks-data';

export const storage = {
  getProductMarks(): ProductMarkDetail[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading product marks from storage:', error);
      return [];
    }
  },

  saveProductMarks(marks: ProductMarkDetail[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
    } catch (error) {
      console.error('Error saving product marks to storage:', error);
    }
  },

  addProductMark(mark: Omit<ProductMarkDetail, '_id' | 'createdAt'>): ProductMarkDetail {
    const marks = this.getProductMarks();
    const newMark: ProductMarkDetail = {
      ...mark,
      _id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };
    marks.push(newMark);
    this.saveProductMarks(marks);
    return newMark;
  },

  updateProductMark(id: string, updates: Partial<ProductMarkDetail>): ProductMarkDetail | null {
    const marks = this.getProductMarks();
    const index = marks.findIndex(mark => mark._id === id);
    if (index === -1) return null;
    
    marks[index] = { ...marks[index], ...updates };
    this.saveProductMarks(marks);
    return marks[index];
  },

  deleteProductMark(id: string): boolean {
    const marks = this.getProductMarks();
    const filtered = marks.filter(mark => mark._id !== id);
    if (filtered.length === marks.length) return false;
    
    this.saveProductMarks(filtered);
    return true;
  },

  addProductMarksBulk(datamatrixes: string[]): ProductMarkDetail[] {
    const existingMarks = this.getProductMarks();
    const existingBrands = new Set(existingMarks.map(mark => mark.brand));
    
    const newMarks: ProductMarkDetail[] = [];
    
    datamatrixes.forEach(inputCode => {
      // Determine brand type based on content
      // КМЧЗ: contains \u001D or other GS1 identifiers or parentheses 
      // КМДМ: pure numeric codes
      const hasGS1Separator = inputCode.includes('\\u001D') || inputCode.includes('\u001D');
      const hasParentheses = inputCode.includes('(') || inputCode.includes(')');
      const hasLetters = /[a-zA-Z]/.test(inputCode);
      const isNumericOnly = /^\d+$/.test(inputCode.trim());
      
      const brandType: 'КМДМ' | 'КМЧЗ' = (hasGS1Separator || hasParentheses || hasLetters) && !isNumericOnly ? 'КМЧЗ' : 'КМДМ';
      
      console.log(`Code: ${inputCode}, Type: ${brandType}, hasGS1: ${hasGS1Separator}, hasParens: ${hasParentheses}, hasLetters: ${hasLetters}, isNumeric: ${isNumericOnly}`);
      
      // Brand column should show the full input code for display
      // Datamatrix will be used only for generating QR/DataMatrix images
      const brand = inputCode.trim(); // Always use full code in Brand column
      
      if (!existingBrands.has(brand)) {
        const newMark: ProductMarkDetail = {
          _id: Math.random().toString(36).substring(2, 15),
          product: '',
          barcode: '',
          supplierCode: '',
          brandType,
          brand, // This goes to "Марка" column
          datamatrix: inputCode, // This goes to "Datamatrix" column
          status: 'В обороте',
          createdAt: new Date().toISOString(),
        };
        newMarks.push(newMark);
        existingBrands.add(brand);
      }
    });
    
    const allMarks = [...existingMarks, ...newMarks];
    this.saveProductMarks(allMarks);
    return newMarks;
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
