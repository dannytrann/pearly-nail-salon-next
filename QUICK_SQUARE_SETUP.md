# Quick Square Setup Guide

## The Problem
Your `.env.local` file still has placeholder values:
```
SQUARE_ACCESS_TOKEN=your_square_access_token_here  ❌
SQUARE_LOCATION_ID=your_square_location_id_here    ❌
```

## Solution: Get Your Real Credentials

### Step 1: Get Square Access Token

1. Go to https://developer.squareup.com/apps
2. Sign in with your Square account
3. Click on your application (or create one if you don't have one)
4. Click **"Credentials"** in the left sidebar
5. You'll see two environments:
   - **Sandbox** (for testing with fake data)
   - **Production** (for real bookings)

6. **For Testing First**: Copy the **Sandbox Access Token**
   - It looks like: `EAAAl...` (long string)

7. **For Going Live**: Copy the **Production Access Token**

### Step 2: Get Location ID

1. In the same Square Developer Dashboard
2. Click **"Locations"** in the left sidebar
3. Find "Pearly Nails & Spa" (or your location name)
4. Copy the **Location ID**
   - It looks like: `L123...` or similar

### Step 3: Update Your .env.local File

Open `frontend/.env.local` and replace:

```bash
# Replace these placeholder values:
SQUARE_ACCESS_TOKEN=EAAAl...your_actual_token_here...
SQUARE_LOCATION_ID=L123...your_actual_location_id...
SQUARE_ENVIRONMENT=sandbox

# Enable the features you want:
USE_SQUARE_SERVICES=true
USE_SQUARE_TECHNICIANS=true
USE_SQUARE_BOOKINGS=false  # Keep false for testing first
USE_SQUARE_BUSINESS_HOURS=true
```

### Step 4: Test Your Connection

Run the diagnostic:
```bash
cd frontend
node test-square.js
```

You should see:
```
✓ SQUARE_ACCESS_TOKEN: Set
✓ SQUARE_LOCATION_ID: Set
✓ Location: Pearly Nails & Spa
✓ Found X services/items
✓ Found X team members
```

### Step 5: Start Your Server

```bash
npm run dev
```

Visit http://localhost:3000 and you should see your real Square data!

---

## Common Issues

### Issue: "No services found"
**Solution**: Add services in Square Dashboard
1. Go to https://squareup.com/dashboard
2. Items & Orders > Items Library
3. Click "Create Item"
4. Add your nail services

### Issue: "No team members found"
**Solution**: Add team members in Square Dashboard
1. Go to https://squareup.com/dashboard
2. Team > Team Members
3. Click "Add Team Member"
4. Add your technicians (Kim, Tan, Mia, etc.)

### Issue: "API Error"
**Solutions**:
- Check your access token is correct
- Make sure you're using the right environment (sandbox vs production)
- Verify your location ID is correct

---

## Testing Checklist

After updating `.env.local`:

1. [ ] Run `node test-square.js` - should show ✓ for all tests
2. [ ] Restart dev server: `npm run dev`
3. [ ] Visit http://localhost:3000
4. [ ] Click through to services page
5. [ ] Verify you see your Square services (not mock data)
6. [ ] Check that technicians show your team members

---

## Quick Reference

**Sandbox vs Production:**
- **Sandbox**: Use for testing, won't create real bookings
- **Production**: Creates real bookings, charges real money

**Start with Sandbox**, then switch to Production when ready!

To switch to production:
```bash
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=your_production_token
```
