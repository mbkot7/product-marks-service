import { useState, useEffect } from 'react'
import { ProductMarksTable } from './components/ProductMarksTable'
import { Toaster } from './components/ui/toaster'
import { useToast } from './hooks/useToast'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Download, FileText, Package, Trash2, Link2 } from 'lucide-react'
import { storage } from './lib/storage'
import { PDFExportService } from './lib/pdfExport'
import { createShareLink, extractStateFromLocation } from './lib/urlState'

function App() {
  const { toast, toasts, removeToast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(true) // Start with loading true
  const [productMarks, setProductMarks] = useState(storage.getProductMarks())
  
  // Debug log to check if React is working
  console.log('App component loaded!')
  
  // Load from URL state on first mount
  useEffect(() => {
    const fromUrl = extractStateFromLocation()
    if (fromUrl && fromUrl.length > 0) {
      storage.saveProductMarks(fromUrl)
      setProductMarks(fromUrl)
      toast({ title: 'Loaded from link', description: `Restored ${fromUrl.length} marks from the URL` })
      // clean URL (remove ?s=...) but keep path
      const clean = `${window.location.origin}${window.location.pathname}`
      window.history.replaceState({}, '', clean)
    }
    // App is fully loaded
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Update product marks when storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setProductMarks(storage.getProductMarks())
    }
    
    const interval = setInterval(handleStorageChange, 500)
    return () => clearInterval(interval)
  }, [])

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      if (productMarks.length === 0) {
        toast({ title: 'No Data', description: 'No product marks to export', variant: 'destructive' })
        return
      }

      console.log('Starting PDF export...');
      const result = await PDFExportService.exportProductMarksWithImages(productMarks, 'Product Marks Report')
      console.log('PDF export result:', result);
      
      if (result.success) {
        toast({ title: 'Success', description: `PDF exported: ${result.fileName}` })
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to export PDF', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleCopyShareLink = async () => {
    try {
      const marks = storage.getProductMarks()
      if (marks.length === 0) {
        toast({ title: 'Nothing to share', description: 'Add some marks first', variant: 'destructive' })
        return
      }
      const link = createShareLink(marks)
      await navigator.clipboard.writeText(link)
      toast({ title: 'Link copied', description: 'Share it to restore the same data elsewhere' })
    } catch (e) {
      console.error('Copy link failed', e)
      toast({ title: 'Copy failed', description: 'Could not copy link', variant: 'destructive' })
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all product marks? This action cannot be undone.')) {
      storage.clearAll()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Package className="h-10 w-10 text-blue-600" />
            Product Mark Details Service
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage your product marks with bulk import, editing capabilities, and PDF export functionality. 
            All data is stored locally in your browser.
          </p>
        </div>

        {/* Stats and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Export your data or manage your product marks collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">Total marks: {productMarks.length}</span>
                <span>•</span>
                <span>Active: {productMarks.filter(m => m.status === 'В обороте').length}</span>
                <span>•</span>
                <span>Retired: {productMarks.filter(m => m.status === 'Выбыла').length}</span>
                <span>•</span>
                <span>Broken: {productMarks.filter(m => m.status === 'Сломана').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCopyShareLink} disabled={loading} variant="outline" size="sm">
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy Share Link
                </Button>
                <Button onClick={handleExportPDF} disabled={loading || exporting || productMarks.length === 0} variant="outline" size="sm">
                  {loading || exporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Loading...' : 'Export PDF'}
                </Button>
                <Button onClick={handleClearAll} disabled={loading || productMarks.length === 0} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Table */}
        <ProductMarksTable productMarks={productMarks} onDataChange={setProductMarks} />

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8 space-y-2">
          <p>Product Mark Details Service - Standalone Version</p>
          <p>Data is stored locally in your browser. Export regularly to backup your data.</p>
          <div className="pt-4 border-t border-gray-200 mt-6">
            <p className="text-gray-400 font-medium">Developed by ERP team</p>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default App
