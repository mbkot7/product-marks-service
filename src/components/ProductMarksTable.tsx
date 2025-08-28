import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save, Package, Upload, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { ProductMarkDetail, BRAND_TYPES, MARK_STATUSES } from '@/types/ProductMark';
import { storage } from '@/lib/storage';
import { CodeDisplay } from './CodeDisplay';
import { TableSettings, TableSettings as TableSettingsType } from './TableSettings';
import { useToast } from '@/hooks/useToast';

interface ProductMarksTableProps {
  productMarks: ProductMarkDetail[];
  onDataChange: (marks: ProductMarkDetail[]) => void;
}

export function ProductMarksTable({ productMarks, onDataChange }: ProductMarksTableProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [parsedData, setParsedData] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ProductMarkDetail>>({});
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAllCodes, setShowAllCodes] = useState(false);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [decodeBase64, setDecodeBase64] = useState(false);
  const [tableSettings, setTableSettings] = useState<TableSettingsType>({
    showProduct: true,
    showBarcode: true,
    showSupplierCode: true,
    showBrandType: true,
    showBrand: true,
    showDatamatrix: true,
    showStatus: true,
    brandColumnWidth: 200,
  });
  const { toast } = useToast();

  const decodeBase64String = (str: string): string => {
    try {
      return atob(str);
    } catch (error) {
      return str;
    }
  };

  const parseBulkData = () => {
    if (!bulkData.trim()) {
      toast({
        title: "Error",
        description: "Please enter data to parse",
        variant: "destructive",
      });
      return;
    }

    try {
      const lines = bulkData.trim().split('\n');
      const parsed: string[] = [];

      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          const decodedLine = decodeBase64 ? decodeBase64String(trimmedLine) : trimmedLine;
          parsed.push(decodedLine);
        }
      });

      if (parsed.length === 0) {
        toast({
          title: "Error",
          description: "No valid data found to parse",
          variant: "destructive",
        });
        return;
      }

      setParsedData(parsed);
      setShowPreview(true);

      toast({
        title: "Success",
        description: `Parsed ${parsed.length} codes`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse data. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleBulkAdd = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "Error",
        description: "No data to add",
        variant: "destructive",
      });
      return;
    }

    const existingBrands = new Set(productMarks.map(mark => mark.brand));
    const newCodes = parsedData.filter(code => {
      const brand = code.substring(0, 13);
      return !existingBrands.has(brand);
    });
    
    if (newCodes.length === 0) {
      toast({
        title: "Info",
        description: "All provided marks already exist in the table",
        variant: "default",
      });
      return;
    }

    if (newCodes.length < parsedData.length) {
      toast({
        title: "Info",
        description: `Skipped ${parsedData.length - newCodes.length} duplicate marks`,
        variant: "default",
      });
    }

    setLoading(true);
    try {
      const newMarks = storage.addProductMarksBulk(newCodes);
      onDataChange([...productMarks, ...newMarks]);

      setBulkData('');
      setParsedData([]);
      setShowPreview(false);
      setShowDialog(false);

      toast({
        title: "Success",
        description: `Added ${newMarks.length} product marks`,
      });
    } catch (error) {
      console.error('Error adding product marks:', error);
      toast({
        title: "Error",
        description: "Failed to add product marks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mark: ProductMarkDetail) => {
    setEditingRow(mark._id);
    setEditData({
      product: mark.product,
      barcode: mark.barcode,
      supplierCode: mark.supplierCode,
      brandType: mark.brandType,
      brand: mark.brand,
      datamatrix: mark.datamatrix,
      status: mark.status
    });
  };

  const handleSave = async (markId: string) => {
    setUpdating(true);
    try {
      const updatedMark = storage.updateProductMark(markId, editData);
      if (updatedMark) {
        onDataChange(productMarks.map(mark => 
          mark._id === markId ? updatedMark : mark
        ));
        setEditingRow(null);
        setEditData({});
        toast({
          title: "Success",
          description: "Product mark updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating product mark:', error);
      toast({
        title: "Error",
        description: "Failed to update product mark",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (markId: string) => {
    setDeleting(markId);
    try {
      const success = storage.deleteProductMark(markId);
      if (success) {
        onDataChange(productMarks.filter(mark => mark._id !== markId));
        toast({
          title: "Success",
          description: "Product mark deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting product mark:', error);
      toast({
        title: "Error",
        description: "Failed to delete product mark",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Выбыла':
        return 'text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800';
      case 'В обороте':
        return 'text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800';
      case 'Сломана':
        return 'text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800';
      default:
        return 'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800';
    }
  };

  const getBrandType = (editingRow: string | null, editData: Partial<ProductMarkDetail>, mark: ProductMarkDetail): 'КМДМ' | 'КМЧЗ' => {
    if (editingRow === mark._id && editData.brandType) {
      return editData.brandType === 'КМДМ' || editData.brandType === 'КМЧЗ' ? editData.brandType as 'КМДМ' | 'КМЧЗ' : mark.brandType as 'КМДМ' | 'КМЧЗ';
    }
    return mark.brandType as 'КМДМ' | 'КМЧЗ';
  };

  const toggleCodeVisibility = (markId: string) => {
    setVisibleCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(markId)) {
        newSet.delete(markId);
      } else {
        newSet.add(markId);
      }
      return newSet;
    });
  };

  return (
    <Card className="backdrop-blur-sm bg-card/50 border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Mark Details
            </CardTitle>
            <CardDescription>Product mark information and datamatrix codes</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TableSettings 
              settings={tableSettings} 
              onSettingsChange={setTableSettings} 
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAllCodes(!showAllCodes);
                if (!showAllCodes) {
                  setVisibleCodes(new Set());
                }
              }}
              className="flex items-center gap-2"
            >
              {showAllCodes ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide All Codes
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show All Codes
                </>
              )}
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Bulk Add Marks
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-background">
                <DialogHeader>
                  <DialogTitle>Bulk Add Marks</DialogTitle>
                  <DialogDescription>
                    Add codes (one per line). Numeric codes (КМДМ) generate QR codes, codes with \u001D (КМЧЗ) generate DataMatrix codes. Codes go to "Марка" column.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {!showPreview ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bulkData"> Codes (one per line)</Label>
                        <Textarea
                          id="bulkData"
                          value={bulkData}
                          onChange={(e) => setBulkData(e.target.value)}
                          placeholder="0104610037130258215(lCi:R_B(>N.\u001D91FFD0\u001D92dGVzdNbKbLZNM/OYkf4ac7XcCyE76PzN6ihNuexutiI="
                          className="min-h-[120px] font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="decodeBase64"
                          checked={decodeBase64}
                          onChange={(e) => setDecodeBase64(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="decodeBase64" className="text-sm">
                          Decode from base64
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={parseBulkData}
                          disabled={!bulkData.trim()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Parse Data
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setBulkData('')}
                          disabled={!bulkData.trim()}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Preview ({parsedData.length} codes)</h4>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleBulkAdd}
                            disabled={loading || parsedData.length === 0}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Add All ({parsedData.length})
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowPreview(false);
                              setParsedData([]);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-auto border rounded-lg">
                        <div className="grid grid-cols-1 gap-2 p-4">
                          {parsedData.map((code, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded border font-mono text-sm break-all">
                              {code}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {tableSettings.showProduct && <TableHead>Товар</TableHead>}
                {tableSettings.showBarcode && <TableHead>Штрих-код</TableHead>}
                {tableSettings.showSupplierCode && <TableHead>Код поставщика</TableHead>}
                {tableSettings.showBrandType && <TableHead>Тип марки</TableHead>}
                {tableSettings.showBrand && <TableHead style={{ width: `${tableSettings.brandColumnWidth}px` }}>Марка</TableHead>}
                {tableSettings.showDatamatrix && <TableHead>QR/DataMatrix код</TableHead>}
                {tableSettings.showStatus && <TableHead>Статус</TableHead>}
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productMarks.map((mark) => (
                <TableRow key={mark._id}>
                  {tableSettings.showProduct && (
                    <TableCell>
                      {editingRow === mark._id ? (
                        <Input
                          value={editData.product || ''}
                          onChange={(e) => setEditData({ ...editData, product: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        mark.product
                      )}
                    </TableCell>
                  )}
                  {tableSettings.showBarcode && (
                    <TableCell>
                      {editingRow === mark._id ? (
                        <Input
                          value={editData.barcode || ''}
                          onChange={(e) => setEditData({ ...editData, barcode: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        mark.barcode
                      )}
                    </TableCell>
                  )}
                  {tableSettings.showSupplierCode && (
                    <TableCell>
                      {editingRow === mark._id ? (
                        <Input
                          value={editData.supplierCode || ''}
                          onChange={(e) => setEditData({ ...editData, supplierCode: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        mark.supplierCode
                      )}
                    </TableCell>
                  )}
                  {tableSettings.showBrandType && (
                    <TableCell>
                      {editingRow === mark._id ? (
                        <Select
                          value={editData.brandType || mark.brandType}
                          onValueChange={(value) => setEditData({ ...editData, brandType: value as 'КМДМ' | 'КМЧЗ' })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAND_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
                          {mark.brandType}
                        </span>
                      )}
                    </TableCell>
                  )}
                  {tableSettings.showBrand && (
                    <TableCell style={{ width: `${tableSettings.brandColumnWidth}px` }}>
                      {editingRow === mark._id ? (
                        <Input
                          value={editData.brand || ''}
                          onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        <div className="font-mono text-sm break-all" style={{ maxWidth: `${tableSettings.brandColumnWidth}px` }}>
                          {mark.brand}
                        </div>
                      )}
                    </TableCell>
                  )}
                  {tableSettings.showDatamatrix && (
                    <TableCell>
                      {editingRow === mark._id ? (
                        <Textarea
                          value={editData.datamatrix || ''}
                          onChange={(e) => setEditData({ ...editData, datamatrix: e.target.value })}
                          className="w-full min-h-[60px] font-mono text-xs"
                        />
                      ) : (
                        <div className="space-y-2">
                          {showAllCodes || visibleCodes.has(mark._id) ? (
                            <div 
                              className="cursor-pointer"
                              onClick={() => toggleCodeVisibility(mark._id)}
                            >
                              <CodeDisplay 
                                data={mark.brand} 
                                brandType={getBrandType(editingRow, editData, mark)}
                                size={80}
                              />
                            </div>
                          ) : (
                            <div 
                              className="text-xs text-gray-500 dark:text-gray-400 italic cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                              onClick={() => toggleCodeVisibility(mark._id)}
                            >
                              Click to show {mark.brandType === 'КМДМ' ? 'QR code' : 'DataMatrix code (GS1)'}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
                  {tableSettings.showStatus && (
                    <TableCell>
                      {editingRow === mark._id ? (
                        <Select
                          value={editData.status || mark.status}
                          onValueChange={(value) => setEditData({ ...editData, status: value as typeof MARK_STATUSES[number] })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MARK_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 py-1 rounded-md text-sm ${getStatusColor(mark.status)}`}>
                          {mark.status}
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingRow === mark._id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSave(mark._id)}
                            disabled={updating}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {updating ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={updating}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(mark)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(mark._id)}
                            disabled={deleting === mark._id}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            {deleting === mark._id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {productMarks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No product marks found. Click "Bulk Add Marks" to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
