# Deployment Instructions for mbkot7.github.io

## Prerequisites

1. GitHub account with permissions to create repositories
2. Git installed on your local machine

## Step-by-Step Deployment

### 1. Create GitHub Repository

1. Go to GitHub and create a new repository named `product-marks-service`
2. Make sure the repository is public
3. Don't initialize with README, .gitignore, or license (we already have these files)

### 2. Initialize and Push to GitHub

```bash
# Navigate to the project directory
cd product-marks-service

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Product Mark Details Service"

# Add GitHub remote (replace 'mbkot7' with your GitHub username)
git remote add origin https://github.com/mbkot7/product-marks-service.git

# Push to GitHub
git push -u origin main
```

### 3. Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "GitHub Actions"
5. The workflow will be automatically detected from `.github/workflows/deploy.yml`

### 4. Trigger Deployment

The deployment will automatically trigger when you push to the `main` branch. You can also manually trigger it:

1. Go to the "Actions" tab in your repository
2. Click on "Deploy to GitHub Pages"
3. Click "Run workflow" → "Run workflow"

### 5. Access Your Deployed Application

Once deployment is complete (usually takes 2-3 minutes), your application will be available at:

```
https://mbkot7.github.io/product-marks-service/
```

## Configuration Notes

### Base URL Configuration

The `vite.config.ts` is configured with:
```typescript
base: '/product-marks-service/'
```

This ensures all assets load correctly when deployed to GitHub Pages.

### Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file to the `public` directory with your domain name
2. Update the `cname` setting in `.github/workflows/deploy.yml`
3. Configure your domain's DNS to point to GitHub Pages

## Local Development

To run locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Build Fails
- Check that all dependencies are installed: `npm install`
- Verify TypeScript types: `npm run build`

### Deployment Fails
- Check Actions tab for error logs
- Ensure repository is public
- Verify GitHub Pages is enabled in repository settings

### Application Not Loading
- Check browser console for errors
- Verify base URL in `vite.config.ts` matches repository name
- Clear browser cache

## Data Persistence

- All data is stored in browser localStorage
- No backend server required
- Export data regularly for backup
- Data will persist across browser sessions on the same device

## Features Available

✅ Bulk import of product marks  
✅ Edit/delete individual marks  
✅ PDF export (summary and detailed)  
✅ QR/DataMatrix code generation  
✅ Local data storage  
✅ Responsive design  

The application is now ready for deployment to mbkot7.github.io!
