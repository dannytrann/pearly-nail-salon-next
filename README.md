# Pearly Nails & Spa - Group Booking System

A modern, full-stack group booking application built with Next.js 14 for Pearly Nails & Spa nail salon in Comox, BC. This application allows customers to book appointments for multiple people simultaneously, with individual service selections for each guest.

## Features

- **Group Size Selection**: Book for 1-6+ people
- **Individual Service Selection**: Each guest can choose their own services
- **Technician Preferences**: Optional technician selection for each guest
- **Real-time Availability**: Check available time slots
- **Review System**: Review all selections before booking
- **Mobile Responsive**: Beautiful design on all devices
- **Progress Tracking**: Visual progress bar through booking flow

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript
- **Styling**: Tailwind CSS with custom orange theme
- **State Management**: Zustand
- **Fonts**: Playfair Display (headings), PT Serif (body)
- **API**: Next.js API Routes

## Project Structure

```
frontend/
├── app/
│   ├── page.jsx                 # Home - Group size selection
│   ├── services/
│   │   └── page.jsx            # Service selection for each guest
│   ├── review/
│   │   └── page.jsx            # Review all bookings
│   ├── datetime/
│   │   └── page.jsx            # Date and time selection
│   ├── contact/
│   │   └── page.jsx            # Contact form
│   ├── confirmation/
│   │   └── page.jsx            # Booking confirmation
│   ├── api/
│   │   ├── services/
│   │   │   └── route.js        # GET services data
│   │   ├── availability/
│   │   │   └── route.js        # POST check availability
│   │   └── bookings/
│   │       └── route.js        # POST create booking
│   ├── layout.jsx              # Root layout with header/footer
│   └── globals.css             # Tailwind + custom styles
├── components/
│   ├── ServiceCard.jsx         # Service selection card
│   ├── ProgressBar.jsx         # Booking flow progress
│   └── LoadingSpinner.jsx      # Loading indicator
├── lib/
│   ├── bookingStore.js         # Zustand state management
│   └── mockData.js             # Mock services and technicians
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.local
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Edit `.env.local` with your salon details and Square API credentials (for future integration)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Booking Flow

1. **Group Size Selection** (`/`)
   - Customer selects number of people (1-6+)
   - Creates guest entries in booking store

2. **Service Selection** (`/services`)
   - Iterates through each guest
   - Select multiple services per guest
   - Choose preferred technician (optional)
   - Shows running total for each guest

3. **Review Bookings** (`/review`)
   - Display all guests and their selections
   - Edit any guest's selections
   - Shows group total and estimated duration

4. **Date & Time** (`/datetime`)
   - Pick appointment date
   - Fetches available time slots from API
   - Select preferred time

5. **Contact Information** (`/contact`)
   - Enter name, phone, email
   - Add special requests
   - Form validation
   - Submit booking to API

6. **Confirmation** (`/confirmation`)
   - Display booking confirmation
   - Show all booking details
   - Next steps information
   - Option to book another group

## API Routes

### GET `/api/services`
Returns available services, categories, and technicians

**Response:**
```json
{
  "success": true,
  "services": [...],
  "categories": {...},
  "technicians": [...]
}
```

### POST `/api/availability`
Check available time slots for a date

**Request:**
```json
{
  "date": "2026-01-15",
  "guests": 3
}
```

**Response:**
```json
{
  "success": true,
  "date": "2026-01-15",
  "availableSlots": ["09:00", "10:00", ...],
  "message": "Found 12 available slots for 3 guests"
}
```

### POST `/api/bookings`
Create a new group booking

**Request:**
```json
{
  "groupSize": 2,
  "selectedDate": "2026-01-15",
  "selectedTime": "10:00",
  "guests": [...],
  "contactInfo": {...}
}
```

**Response:**
```json
{
  "success": true,
  "bookingIds": ["BK1234567890-1", "BK1234567890-2"],
  "message": "Successfully booked 2 appointments"
}
```

## Services & Pricing

### Head Spa
- **Mini Head Spa** - $45 (30 min)
- **Full Head Spa** - $60 (45 min)

### Hands
- **Manicure** - $30 (45 min)
- **Gel Manicure** - $45 (60 min)

### Feet
- **Pedicure** - $45 (60 min)
- **Signature Pedicure** - $65 (75 min)

### Technicians
- Kim
- Tan
- Mia

## Customization

### Theme Colors
Edit `tailwind.config.js` to customize colors:
```js
colors: {
  primary: '#e67e22',        // Orange
  'primary-dark': '#d35400',
  'primary-light': '#f39c12',
}
```

### Services & Pricing
Edit `lib/mockData.js` to update services, prices, or technicians

### Fonts
Edit `app/globals.css` to change Google Fonts import

## Future Enhancements

- [ ] Square API integration for real bookings
- [ ] Payment processing
- [ ] Email confirmations
- [ ] SMS notifications
- [ ] Admin dashboard
- [ ] Booking management (cancel/reschedule)
- [ ] Customer accounts
- [ ] Loyalty program
- [ ] Gift cards
- [ ] Reviews and ratings

## Square API Integration

To integrate with Square:

1. Create a Square developer account at https://developer.squareup.com/
2. Get your Access Token and Location ID
3. Update `.env.local` with credentials
4. Replace mock data in API routes with Square Bookings API calls
5. Implement payment processing with Square Payments API

## Support

For questions or issues:
- Email: info@pearlynails.com
- Phone: (250) XXX-XXXX
- Location: 23A-215 Port Augusta St, Comox, BC V9M 3M9

## License

Copyright © 2026 Pearly Nails & Spa. All rights reserved.
