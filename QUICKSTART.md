# Quick Start Guide

Get the Pearly Nails Group Booking System running in 3 minutes!

## Prerequisites

- Node.js 18+ installed
- npm installed

## Run the Application

### Option 1: Use the Startup Script (Easiest)

```bash
# Make script executable (first time only)
chmod +x start-frontend.sh

# Run the app
./start-frontend.sh
```

### Option 2: Manual Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

## Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## Test the Booking Flow

1. **Select Group Size**: Choose 2 people
2. **Guest 1 Services**:
   - Select "Gel Manicure" ($45)
   - Choose technician "Kim"
   - Click "Next Guest"
3. **Guest 2 Services**:
   - Select "Signature Pedicure" ($65)
   - Choose technician "Tan"
   - Click "Review Booking"
4. **Review**: Check all selections, click "Choose Date & Time"
5. **Date & Time**:
   - Pick tomorrow's date
   - Select an available time slot
   - Click "Continue to Contact Info"
6. **Contact Info**:
   - Name: John Doe
   - Phone: (250) 555-1234
   - Email: john@example.com
   - Click "Complete Booking"
7. **Confirmation**: See your booking confirmation!

## Default Configuration

- **Port**: 3000
- **Mock Data**: Using simulated services and availability
- **Salon**: Pearly Nails & Spa, Comox BC

## Common Commands

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run linter (if configured)
npm run lint
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

## File Structure

```
frontend/
├── app/              # Pages and API routes
├── components/       # Reusable React components
├── lib/             # Utilities and state management
└── public/          # Static files
```

## Next Steps

1. Customize services in `lib/mockData.js`
2. Update colors in `tailwind.config.js`
3. Configure Square API in `.env.local`
4. Deploy to Vercel, Netlify, or your hosting provider

## Support

Need help? Check the main README.md for detailed documentation!
