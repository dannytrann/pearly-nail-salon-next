# Square API Integration Setup Guide

## Overview

Your booking system now supports Square API integration! You can:
- Fetch services from Square Catalog
- Check real-time availability from Square Bookings
- Create actual bookings in Square

The system uses **feature flags** so you can test with mock data first, then gradually enable Square features.

---

## Step 1: Get Your Square API Credentials

### 1.1 Create a Square Developer Account

1. Go to https://developer.squareup.com/
2. Sign in with your Square account (or create one)
3. Click "Create App" or select an existing app

### 1.2 Get Your Access Token

1. In your Square Developer Dashboard, select your application
2. Click on **"Credentials"** in the left sidebar
3. You'll see two environments:
   - **Sandbox** (for testing)
   - **Production** (for live bookings)

4. Copy your **Access Token**:
   - For testing: Use **Sandbox Access Token**
   - For live: Use **Production Access Token**

### 1.3 Get Your Location ID

1. In the Square Developer Dashboard, click **"Locations"**
2. Find your salon location
3. Copy the **Location ID**

---

## Step 2: Configure Your Application

### 2.1 Update `.env.local`

Open `frontend/.env.local` and update these values:

```bash
# Replace with your actual Square credentials
SQUARE_ACCESS_TOKEN=your_actual_access_token_here
SQUARE_LOCATION_ID=your_actual_location_id_here

# Set environment (sandbox for testing, production for live)
SQUARE_ENVIRONMENT=sandbox

# Feature flags (set to 'true' to enable)
USE_SQUARE_SERVICES=false
USE_SQUARE_BOOKINGS=false
USE_SQUARE_TECHNICIANS=false
USE_SQUARE_BUSINESS_HOURS=false
```

### What Each Feature Flag Does:

- **USE_SQUARE_SERVICES**: Fetches services, categories, and pricing from Square Catalog
- **USE_SQUARE_BOOKINGS**: Creates real bookings in Square and checks availability
- **USE_SQUARE_TECHNICIANS**: Fetches team members and checks their availability
- **USE_SQUARE_BUSINESS_HOURS**: Generates time slots from your actual Square location hours

---

## Step 3: Test Your Integration

### 3.1 Test with Mock Data First (Current Setup)

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 and complete a test booking. This uses mock data.

### 3.2 Enable Square Services

Update `.env.local`:
```bash
USE_SQUARE_SERVICES=true
```

Restart the server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

Now services will be fetched from your Square Catalog!

### 3.3 Enable Square Bookings

Update `.env.local`:
```bash
USE_SQUARE_BOOKINGS=true
```

Restart the server. Now:
- Availability checks real Square bookings
- New bookings are created in Square

---

## Step 4: Configure Square Services & Categories

### 4.1 Create Categories First

1. Log into https://squareup.com/dashboard
2. Go to **Items & Orders** > **Categories**
3. Click **Create Category**
4. Add these categories:
   - Nail Services
   - Manicures
   - Pedicures
   - Kids Services
   - Waxing

### 4.2 Add Services in Square Dashboard

1. Go to **Items & Orders** > **Items Library**
2. Click **Create Item**
3. Add your nail services:
   - Name: "Gel Spa Manicure"
   - Category: Select "Manicures"
   - Price: $38.00
   - Description: "Spa manicure with gel polish"

4. **Optional - Add Service Duration**:
   - Scroll to **Custom Attributes**
   - Add a custom attribute named "duration"
   - Set the value to the duration in minutes (e.g., 60)
   - This will be used for booking time calculations

5. Repeat for all your services from the screenshot

**Note**: The system will automatically fetch category names and organize services accordingly when `USE_SQUARE_SERVICES=true`

---

## Step 5: Set Up Square Bookings

### 5.1 Enable Bookings in Square

1. Log into https://squareup.com/dashboard
2. Go to **Appointments** > **Settings**
3. Enable **Online Booking**
4. Configure your business hours

### 5.2 Add Team Members

1. Go to **Team** > **Team Members**
2. Add your technicians:
   - Click **Add Team Member**
   - Enter their name (e.g., Kim, Tan, Mia)
   - Assign them to your location
   - Set status to **Active**
   - Give them **Appointments** permissions

3. Your team members will now show up as available technicians when `USE_SQUARE_TECHNICIANS=true`

### 5.3 Enable Square Technicians

Update `.env.local`:
```bash
USE_SQUARE_TECHNICIANS=true
```

This will:
- Fetch real technicians from Square Team Members
- Check their availability based on existing bookings
- Only show technicians who are not already booked for the selected time

### 5.4 Configure Business Hours

1. Go to **Settings** > **Business** > **Business Hours**
2. Set your operating hours for each day
3. The system will automatically generate time slots based on these hours

Example:
- Monday-Saturday: 9:00 AM - 6:00 PM
- Sunday: Closed

Enable this feature:
```bash
USE_SQUARE_BUSINESS_HOURS=true
```

This will:
- Fetch your actual business hours from Square
- Generate time slots automatically (30-minute intervals)
- Respect your closed days
- Use your location's timezone

---

## Testing Checklist

### With Mock Data (Current State)
- [x] Group size selection works
- [x] Service selection works
- [x] Date/time selection works
- [x] Booking confirmation works
- [x] Services match Square site design

### With Square Services Enabled
- [ ] Services load from Square Catalog
- [ ] Prices match Square
- [ ] Categories display correctly with real category names
- [ ] Service durations are accurate
- [ ] Fallback to mock data if Square fails

### With Square Bookings Enabled
- [ ] Availability reflects real bookings
- [ ] New bookings appear in Square Dashboard
- [ ] Customer info is saved to Square
- [ ] Booking IDs are returned correctly

### With Square Technicians Enabled
- [ ] Technicians load from Square Team Members
- [ ] Only active team members are shown
- [ ] Technician availability is checked correctly
- [ ] Booked technicians don't show as available
- [ ] Bookings are assigned to selected technician

### With Square Business Hours Enabled
- [ ] Time slots reflect actual business hours
- [ ] Closed days don't show any slots
- [ ] 30-minute intervals are generated correctly
- [ ] Timezone is respected
- [ ] Falls back to default hours if Square fails

---

## Troubleshooting

### Error: "Square Access Token not configured"

**Solution**: Make sure you've added your actual Square credentials to `.env.local`

### Services not loading from Square

**Check**:
1. Is `USE_SQUARE_SERVICES=true` in `.env.local`?
2. Did you restart the server after changing `.env.local`?
3. Do you have services in your Square Catalog?
4. Check the terminal for error messages

### Bookings not appearing in Square

**Check**:
1. Is `USE_SQUARE_BOOKINGS=true` in `.env.local`?
2. Is your `SQUARE_ACCESS_TOKEN` valid?
3. Is `SQUARE_ENVIRONMENT` set correctly (sandbox vs production)?
4. Do you have booking permissions enabled in Square?

### Fallback behavior

The system is designed to gracefully fall back to mock data if Square API fails. Check the terminal logs to see which data source is being used:
- `source: 'square'` = Using Square API
- `source: 'mock'` = Using mock data

---

## Going Live

### Before launching to production:

1. **Test thoroughly in Sandbox**
   ```bash
   SQUARE_ENVIRONMENT=sandbox
   ```

2. **Switch to Production**
   ```bash
   SQUARE_ENVIRONMENT=production
   SQUARE_ACCESS_TOKEN=your_production_access_token
   ```

3. **Enable all Square features**
   ```bash
   USE_SQUARE_SERVICES=true
   USE_SQUARE_BOOKINGS=true
   ```

4. **Deploy your app**
   - Build: `npm run build`
   - Deploy to your hosting platform (Vercel, Netlify, etc.)
   - Make sure environment variables are set in production

5. **Test a real booking** in your production environment

---

## Additional Resources

- [Square API Documentation](https://developer.squareup.com/docs)
- [Square Bookings API](https://developer.squareup.com/docs/bookings-api/what-it-does)
- [Square Catalog API](https://developer.squareup.com/docs/catalog-api/what-it-does)
- [Square Customers API](https://developer.squareup.com/docs/customers-api/what-it-does)

---

## Need Help?

If you run into issues:
1. Check the terminal logs for error messages
2. Verify your Square credentials
3. Make sure your Square account has Bookings enabled
4. Test with Sandbox environment first

The system will always fall back to mock data if Square API fails, so your booking system will never be completely down.
