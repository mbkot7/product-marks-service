# Product Mark Details Service

A standalone web application for managing product marks with bulk import, editing capabilities, and PDF export functionality. This service replicates the Product Mark Details functionality from UTA as a standalone application that can be deployed to GitHub Pages.

## Features

- 📊 **Product Mark Management**: Add, edit, and delete product marks
- 📥 **Bulk Import**: Import multiple product marks at once from text input
- 🏷️ **Brand Type Support**: Support for КМДМ and КМЧЗ brand types
- 📱 **QR/DataMatrix Codes**: Automatic generation and display of codes
- 📄 **PDF Export**: Export data in summary or detailed format
- 💾 **Local Storage**: All data stored locally in browser (no backend required)
- 🎨 **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Deployment to GitHub Pages

1. Fork this repository to your GitHub account
2. Enable GitHub Pages in repository settings
3. Push changes to the `main` branch
4. The application will be automatically deployed via GitHub Actions

## Usage

### Adding Product Marks

1. Click "Bulk Add Marks" button
2. Paste your datamatrix codes (one per line)
3. Click "Parse Data" to preview
4. Click "Add All" to import the marks

### Editing Marks

- Click the edit button (pencil icon) on any row
- Modify the fields as needed
- Click save (checkmark) to confirm or cancel (X) to discard

### Exporting Data

- **Summary PDF**: Compact table format with key information
- **Detailed PDF**: Expanded format including full datamatrix codes

### Data Management

- All data is stored in your browser's local storage
- Use "Clear All" to reset all data
- Export regularly to backup your data

## Technical Details

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **PDF Generation**: jsPDF + html2canvas
- **Code Generation**: External APIs for QR/DataMatrix codes
- **Storage**: Browser localStorage (no backend required)

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## Data Format

Product marks include the following fields:
- Product name
- Barcode
- Supplier code
- Brand type (КМДМ/КМЧЗ)
- Brand code
- Datamatrix code
- Status (В обороте/Выбыла/Сломана)

## License

This project is licensed under the MIT License.
