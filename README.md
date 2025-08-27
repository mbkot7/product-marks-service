# Product Marks Service

A React-based web application for managing product marks with bulk import, editing capabilities, and PDF export functionality. All data is stored locally in your browser.

## Features

- **Product Mark Management**: Add, edit, and manage product marks with detailed information
- **Bulk Import**: Import multiple product marks at once
- **PDF Export**: Export your product marks to PDF with QR codes and DataMatrix codes
- **GitHub Gist Sharing**: Share unlimited product marks via GitHub Gist links
- **Local Storage**: All data is stored locally in your browser
- **Responsive Design**: Works on desktop and mobile devices

## GitHub Gist Integration

The application uses GitHub Gist for sharing product marks. This allows you to share unlimited amounts of data through short, shareable links.

### Setup

1. Create a GitHub Personal Access Token:
   - Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Give it a name like "Product Marks Service"
   - Select the `gist` scope
   - Copy the generated token

2. Create a `.env` file in the project root:
   ```bash
   VITE_GITHUB_TOKEN=your_github_token_here
   ```

3. The token will be used for all users of the application.

### Sharing

- Click "Create Gist Link" to share your product marks
- The data will be uploaded to a public GitHub Gist
- Share the generated link with others
- Recipients can open the link to load all your product marks

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mbkot7/product-marks-service.git
   cd product-marks-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your GitHub token (see Setup section above)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Add Product Marks**: Use the "Add Mark" button to add individual marks or use bulk import
2. **Edit Marks**: Click on any mark to edit its details
3. **Export PDF**: Click "Export PDF" to generate a PDF report
4. **Share**: Click "Create Gist Link" to share your marks via GitHub Gist
5. **Import from Link**: Open a shared Gist link to load marks from others

## Data Structure

Each product mark contains:
- Product name
- Product code
- QR code data
- DataMatrix code data
- Status (Active, Retired, Broken)
- Creation timestamp

## Technologies Used

- React 18
- TypeScript
- Vite
- Tailwind CSS
- jsPDF
- QRCode library
- GitHub Gist API

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
# Test commit
