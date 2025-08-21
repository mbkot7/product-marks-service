# Product Mark Details Service

A standalone web application for managing product marks with bulk import, editing capabilities, and PDF export functionality. This service replicates the Product Mark Details functionality from UTA as a standalone application that can be deployed to GitHub Pages.

## Features

- 📊 **Product Mark Management**: Add, edit, and delete product marks
- 📥 **Bulk Import**: Import multiple product marks at once from text input
- 🏷️ **Brand Type Support**: Support for КМДМ and КМЧЗ brand types
- 📱 **QR/DataMatrix Codes**: Automatic generation and display of codes
- 📄 **PDF Export**: Export data in summary or detailed format
- 💾 **Local Storage**: All data stored locally in browser (no backend required)

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

### Data Management

- All data is stored in your browser's local storage
- Use "Clear All" to reset all data
- Export regularly to backup your data

## Browser Compatibility

- Chrome/Edge
- Opera
- Yandex
- Firefox 
- Safari 

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
