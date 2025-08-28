import { useState, useEffect } from 'react'
import { ProductMarksTable } from './components/ProductMarksTable'
import { PrintDialog } from './components/PrintDialog'
import { GlobalSearch } from './components/GlobalSearch'
import { ThemeToggle } from './components/ThemeToggle'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from './components/ui/toaster'
import { useToast } from './hooks/useToast'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Download, FileText, Package, Trash2, Link2 } from 'lucide-react'
import { ProductMarkDetail } from './types/ProductMark'
import { storage } from './lib/storage'
import { PDFExportService } from './lib/pdfExport'
import { createSmartShareLink, loadFromGist, extractStateFromLocation } from './lib/urlState'

function App() {
  const { toast, toasts, removeToast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shortening, setShortening] = useState(false)
  const [productMarks, setProductMarks] = useState(storage.getProductMarks())
  const [filteredMarks, setFilteredMarks] = useState<ProductMarkDetail[]>(productMarks)
  const [isSearching, setIsSearching] = useState(false)
  
  console.log('App component loaded!')
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const fromGist = await loadFromGist();
        if (fromGist && fromGist.length > 0) {
          storage.saveProductMarks(fromGist);
          setProductMarks(fromGist);
          toast({ title: 'Loaded from Gist', description: `Restored ${fromGist.length} marks from GitHub Gist` });
          const clean = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, '', clean);
          return;
        }

        const fromUrl = extractStateFromLocation();
        if (fromUrl && fromUrl.length > 0) {
          storage.saveProductMarks(fromUrl);
          setProductMarks(fromUrl);
          toast({ title: 'Loaded from link', description: `Restored ${fromUrl.length} marks from the URL` });
          const clean = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, '', clean);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [])
  
  useEffect(() => {
    const handleStorageChange = () => {
      const marks = storage.getProductMarks();
      setProductMarks(marks);
      if (!isSearching) {
        setFilteredMarks(marks);
      }
    }
    
    const interval = setInterval(handleStorageChange, 500)
    return () => clearInterval(interval)
  }, [isSearching])

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      if (productMarks.length === 0) {
        toast({ title: 'No Data', description: 'No product marks to export', variant: 'destructive' })
        return
      }

      console.log('Starting ZPL PDF export...');
      const result = await PDFExportService.exportZPLAsPDF(productMarks)
      console.log('ZPL PDF export result:', result);
      
      if (result.success) {
        toast({ title: 'Success', description: `ZPL labels exported: ${result.fileName}` })
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to export ZPL labels', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast({ title: 'Error', description: 'Failed to export ZPL labels', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }



  const handleCopyShareLink = async () => {
    setShortening(true);
    try {
      const marks = storage.getProductMarks();
      if (marks.length === 0) {
        toast({ title: 'Nothing to share', description: 'Add some marks first', variant: 'destructive' });
        return;
      }

      toast({ title: 'Creating Gist link...', description: 'Please wait...' });
      
      const shareResult = await createSmartShareLink(marks);
      await navigator.clipboard.writeText(shareResult.url);
      
      const title = 'GitHub Gist link copied! 🔗';
      const description = 'Data uploaded to GitHub Gist (authenticated)';
      
      if (shareResult.warning) {
        toast({ title, description: `${description}. ${shareResult.warning}` });
      } else {
        toast({ title, description });
      }
    } catch (e) {
      console.error('Copy share link failed', e);
      toast({ 
        title: 'Gist creation failed', 
        description: 'Please check your internet connection and try again', 
        variant: 'destructive' 
      });
    } finally {
      setShortening(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all product marks? This action cannot be undone.')) {
      storage.clearAll()
      window.location.reload()
    }
  }

  const handleSearchResults = (results: ProductMarkDetail[]) => {
    setFilteredMarks(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setFilteredMarks(productMarks);
    setIsSearching(false);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 high-contrast:from-white high-contrast:via-white high-contrast:to-white transition-colors">
        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <ThemeToggle />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white high-contrast:text-black flex items-center justify-center gap-3">
              <Package className="h-6 w-6 md:h-10 md:w-10 text-blue-600 dark:text-blue-400 high-contrast:text-black" />
              Product Mark Details Service
            </h1>
            <p className="text-gray-600 dark:text-gray-300 high-contrast:text-black max-w-2xl mx-auto text-sm md:text-base">
              Manage your product marks with bulk import, editing capabilities, and PDF export functionality. 
              All data is stored locally in your browser.
            </p>
          </div>

          {/* Global Search */}
          <Card className="backdrop-blur-sm bg-card/50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Global Search
              </CardTitle>
              <CardDescription>
                Search across all fields in your product marks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GlobalSearch 
                productMarks={productMarks}
                onSearchResults={handleSearchResults}
                onClearSearch={handleClearSearch}
              />
            </CardContent>
          </Card>

          {/* Stats and Actions */}
          <Card className="backdrop-blur-sm bg-card/50 border-0 shadow-lg">
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
              <div className="flex flex-col md:flex-row md:flex-wrap gap-4 items-start md:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-600 dark:text-gray-300 high-contrast:text-black">
                  <span className="font-medium">Total marks: {productMarks.length}</span>
                  <span className="hidden md:inline">•</span>
                  <span>Active: {productMarks.filter(m => m.status === 'В обороте').length}</span>
                  <span className="hidden md:inline">•</span>
                  <span>Retired: {productMarks.filter(m => m.status === 'Выбыла').length}</span>
                  <span className="hidden md:inline">•</span>
                  <span>Broken: {productMarks.filter(m => m.status === 'Сломана').length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PrintDialog productMarks={productMarks} />
                  <Button onClick={handleCopyShareLink} disabled={loading || shortening} variant="outline" size="sm">
                    {shortening ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    {shortening ? 'Creating...' : 'Create Gist Link'}
                  </Button>
                  <Button onClick={handleExportPDF} disabled={loading || exporting || productMarks.length === 0} variant="outline" size="sm">
                    {loading || exporting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Loading...' : 'Export Labels'}
                  </Button>

                                  <Button onClick={handleClearAll} disabled={loading || productMarks.length === 0} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Table */}
          <ProductMarksTable productMarks={filteredMarks} onDataChange={setProductMarks} />

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 high-contrast:text-black pt-8 space-y-2">
            <p>Product Mark Details Service - Standalone Version</p>
            <p>Data is stored locally in your browser. Export regularly to backup your data.</p>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 high-contrast:border-black mt-6">
              <p className="text-gray-400 dark:text-gray-500 high-contrast:text-black font-medium">Developed by ERP team</p>
            </div>
          </div>
        </div>

        {/* Toast notifications */}
        <Toaster toasts={toasts} removeToast={removeToast} />
      </div>
    </ThemeProvider>
  )
}

export default App
