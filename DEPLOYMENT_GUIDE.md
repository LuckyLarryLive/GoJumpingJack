# 🚀 Deployment Guide - Flight Offer Details Feature

## 📋 Pre-Deployment Checklist

### ✅ Code Quality Checks

- [x] Build successful (`npm run build`)
- [x] All tests passing (`npm test`)
- [x] TypeScript compilation clean
- [x] No linting errors
- [x] Components tested and working

### ✅ New Features Ready

- [x] Flight offer details page (`/flights/offer/[offer_id]`)
- [x] Offer details API (`/api/flights/offers/[offer_id]`)
- [x] Seat map API (`/api/flights/offers/[offer_id]/seat_map`)
- [x] Enhanced FlightCard navigation
- [x] Test endpoints for QA validation

## 🚀 Deployment Steps

### Option 1: Automatic Deployment (Recommended)

If you have Vercel connected to your GitHub repository:

1. **Commit and Push Changes**

   ```bash
   git add .
   git commit -m "feat: Add flight offer details page with seat selection"
   git push origin main
   ```

2. **Vercel Auto-Deploy**
   - Vercel will automatically detect the push
   - Build and deploy will start automatically
   - Check deployment status at
     [vercel.com/dashboard](https://vercel.com/dashboard)

### Option 2: Manual Deployment

If you need to deploy manually:

1. **Install Vercel CLI** (if not already installed)

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 🧪 QA Testing Guide

### 🎯 Test Scenarios

#### 1. **Basic Offer Details Page**

- **URL**: `https://www.gojumpingjack.com/test-offer`
- **Action**: Click "View Test Offer Details"
- **Expected**: Navigate to comprehensive offer details page

#### 2. **Flight Search Integration**

- **URL**: `https://www.gojumpingjack.com/flights`
- **Action**: Search for flights, click "View Full Details & Book" on any result
- **Expected**: Navigate to offer details with real flight data

#### 3. **API Endpoints Testing**

**Test Offer Details API:**

```
GET https://www.gojumpingjack.com/api/flights/offers/off_test_123456789
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "off_test_123456789",
    "total_amount": "299.99",
    "total_currency": "USD"
    // ... complete offer data
  }
}
```

**Test Seat Map API:**

```
GET https://www.gojumpingjack.com/api/flights/offers/off_test_123456789/seat_map
```

**Expected Response:**

```json
{
  "success": true,
  "available": false,
  "data": [],
  "message": "Online seat selection is not available for this airline..."
}
```

#### 4. **Offer Details Page Features**

**Test URL**: `https://www.gojumpingjack.com/flights/offer/off_test_123456789`

**Verify Display Elements:**

- [ ] Total price prominently displayed (USD 299.99)
- [ ] Airline information with logo (British Airways)
- [ ] Flight itinerary with outbound flight details
- [ ] Departure/arrival times and airports
- [ ] Flight duration (8h)
- [ ] Aircraft type (Boeing 777-300ER)
- [ ] Terminal information (Terminal 5 → Terminal 7)
- [ ] Baggage allowance section
- [ ] Fare conditions (changes allowed, non-refundable)

**Interactive Elements:**

- [ ] "Select Seats" button opens modal
- [ ] Modal shows "seat selection not available" message
- [ ] "Proceed to Purchase" button shows placeholder alert
- [ ] "Back to Search Results" navigation works

#### 5. **Responsive Design Testing**

Test on multiple screen sizes:

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Verify:**

- [ ] All content is readable
- [ ] Buttons are touch-friendly
- [ ] Layout adapts properly
- [ ] No horizontal scrolling

#### 6. **Error Handling Testing**

**Invalid Offer ID:**

```
https://www.gojumpingjack.com/flights/offer/invalid_offer_id
```

**Expected**: Error page with "Unable to Load Flight Details"

**Expired Offer Simulation:**

- Test with real Duffel offer IDs that may have expired
- **Expected**: Graceful error message about expired offers

### 🔍 Performance Testing

#### Load Time Expectations

- [ ] Initial page load < 3 seconds
- [ ] API responses < 2 seconds
- [ ] Seat map modal opens < 1 second

#### Bundle Size Verification

- [ ] New offer details page: ~5.33 kB (as shown in build)
- [ ] No significant increase in overall bundle size

### 🐛 Common Issues to Watch For

#### 1. **Environment Variables**

- Ensure all Duffel API tokens are properly set in Vercel
- Check that `DUFFEL_MODE` is set correctly for production

#### 2. **API Rate Limits**

- Monitor Duffel API usage
- Watch for rate limiting errors in production

#### 3. **Image Loading**

- Verify airline logos load correctly
- Check for broken image placeholders

#### 4. **Mobile Experience**

- Test touch interactions on seat map
- Verify modal behavior on mobile devices

### 📊 Success Metrics

#### Functional Requirements

- [ ] All new routes accessible
- [ ] API endpoints return correct data
- [ ] Error handling works as expected
- [ ] Navigation flows work properly

#### User Experience

- [ ] Page loads quickly
- [ ] Information is clearly displayed
- [ ] Interactive elements are responsive
- [ ] Mobile experience is smooth

#### Technical Requirements

- [ ] No console errors
- [ ] Proper TypeScript compilation
- [ ] SEO meta tags present
- [ ] Accessibility standards met

## 🔧 Rollback Plan

If issues are discovered:

1. **Quick Fix**: Deploy hotfix from feature branch
2. **Major Issues**: Revert to previous deployment
   ```bash
   vercel rollback [deployment-url]
   ```

## 📞 Support Contacts

- **Development Team**: [Your contact info]
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Deployment Logs**: Available in Vercel dashboard

## 🎉 Post-Deployment

After successful deployment:

1. **Verify Live Site**: Test all scenarios on production
2. **Monitor Logs**: Check for any runtime errors
3. **Performance Check**: Verify load times and responsiveness
4. **User Feedback**: Collect initial user feedback on new features

---

## 📋 QA Sign-off Checklist

- [ ] All test scenarios completed successfully
- [ ] Performance meets expectations
- [ ] No critical bugs identified
- [ ] Mobile experience verified
- [ ] Error handling tested
- [ ] Ready for user traffic

**QA Tester**: ******\_\_\_\_******  
**Date**: ******\_\_\_\_******  
**Approval**: ******\_\_\_\_******
