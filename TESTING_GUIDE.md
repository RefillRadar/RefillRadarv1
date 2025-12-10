# RefillRadar Queue System Testing Guide

## Prerequisites

### 1. Database Setup
First, you need to run the database migrations to create the queue tables:

```sql
-- Run this in your Supabase SQL editor or database client
-- Copy the contents from /src/lib/database/schema.sql

-- Queue Jobs Table
CREATE TABLE IF NOT EXISTS queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  -- ... rest of the schema from schema.sql
);

-- Calls Table  
CREATE TABLE IF NOT EXISTS calls (
  -- ... copy complete schema from schema.sql
);

-- Indexes and Views
-- ... copy all indexes and views from schema.sql
```

### 2. Environment Variables
Add these to your `.env.local` file:

```bash
# For testing without real QStash (optional)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=test_token_for_local_development
QSTASH_CURRENT_SIGNING_KEY=test_key

# Your app URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Note**: For initial testing, the system works without real QStash credentials since it includes mock simulation.

## Testing Scenarios

### Test 1: Basic Queue Job Creation ✅ **START HERE**

**Goal**: Verify that clicking "Start Calling" creates queue jobs

**Steps**:
1. Start your development server: `npm run dev`
2. Go to `/admin` (make sure you have admin access)
3. Go to the "Search Tickets" tab
4. Create a test search ticket with selected pharmacies (or use existing one)
5. Click "Start Calling Pharmacies" button
6. Check the database:
   ```sql
   SELECT * FROM queue_jobs ORDER BY created_at DESC LIMIT 10;
   ```

**Expected Result**: 
- You should see one `queue_jobs` record per selected pharmacy
- Status should be `pending` or `retry_scheduled` (if outside business hours)
- `search_id` should match your test search

---

### Test 2: Queue Job Processing ⚠️ **REQUIRES QSTASH**

**Goal**: Verify that QStash processes jobs and calls the webhook

**Setup**:
1. Sign up for [Upstash QStash](https://console.upstash.com/qstash) (free tier available)
2. Get your credentials:
   - QStash Token
   - Current Signing Key  
3. Add real credentials to `.env.local`

**Steps**:
1. Create a test search and start calling (Test 1)
2. Check QStash console for queued messages
3. Wait for jobs to process (should be immediate during business hours)
4. Check database for job updates:
   ```sql
   SELECT 
     pharmacy_name,
     status,
     attempt,
     started_at,
     completed_at,
     result_data,
     error_message
   FROM queue_jobs 
   WHERE search_id = 'your_search_id'
   ORDER BY created_at;
   ```

**Expected Result**:
- Jobs should move from `pending` → `processing` → `completed`/`failed`
- `calls` table should have corresponding records
- Mock results should show availability/pricing data

---

### Test 3: Admin Panel Monitoring 📊

**Goal**: Verify real-time monitoring in admin panel

**Steps**:
1. Go to `/admin` → "Overview" tab
2. Check "Queue Stats Cards" showing:
   - Active Jobs
   - Success Rate  
   - Avg Call Time
   - Confidence Score
   - Retries
3. Go to "Search Tickets" tab
4. Select a search with `calling_in_progress` status
5. Click "Show Queue Status" button
6. Verify you see individual job details

**Expected Result**:
- Queue stats show real numbers from database
- Job details show status, timing, results, errors
- Real-time updates as jobs complete

---

### Test 4: Business Hours Scheduling 🕘

**Goal**: Test automatic scheduling for business hours

**Setup**: 
Temporarily modify business hours in `/src/lib/qstash.ts`:
```typescript
// Test outside hours - modify line ~24
return day >= 1 && day <= 5 && hour >= 8 && hour < 9  // Very narrow window
```

**Steps**:
1. Start calling during "off hours" 
2. Check job status:
   ```sql
   SELECT status, scheduled_for FROM queue_jobs WHERE status = 'retry_scheduled';
   ```

**Expected Result**:
- Jobs should be `retry_scheduled` with `scheduled_for` set to next business day 9AM
- No immediate processing should occur

**Cleanup**: Revert business hours change after testing

---

### Test 5: Rate Limiting 🚫

**Goal**: Verify 1-hour rate limiting works

**Steps**:
1. Create search with same pharmacy used recently
2. Start calling
3. Check for rate limited jobs:
   ```sql
   SELECT * FROM queue_jobs 
   WHERE status = 'failed' 
   AND error_message LIKE '%rate limited%';
   ```

**Expected Result**:
- If pharmacy was called within last hour, job should fail with "Rate limited" error

---

### Test 6: Retry Logic 🔄

**Goal**: Test exponential backoff retries

**Setup**: 
Temporarily break something to force failures:
```typescript
// In /src/app/api/process-pharmacy-call/route.ts
// Force failures for testing - modify the mock simulation:
const success = false  // Force all calls to fail
```

**Steps**:
1. Start calling
2. Watch jobs in database:
   ```sql
   SELECT pharmacy_name, attempt, status, scheduled_for, error_message
   FROM queue_jobs 
   WHERE search_id = 'your_search_id'
   ORDER BY attempt, created_at;
   ```

**Expected Result**:
- Jobs should retry 3 times total
- Delays: 5 min → 30 min → 2 hours between attempts
- After 3 failures, status should be `failed`

**Cleanup**: Revert the forced failure after testing

---

## Quick Database Queries for Testing

```sql
-- Check queue job status
SELECT 
  pharmacy_name,
  status,
  attempt,
  created_at,
  started_at,
  completed_at,
  result_data->>'availability' as has_stock,
  result_data->>'price' as price
FROM queue_jobs 
ORDER BY created_at DESC 
LIMIT 20;

-- Check call records
SELECT 
  pharmacy_phone,
  status,
  duration_seconds,
  extracted_data,
  confidence_score
FROM calls 
ORDER BY initiated_at DESC 
LIMIT 10;

-- Queue statistics
SELECT * FROM queue_stats;

-- Recent activity summary
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM queue_jobs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;
```

## Troubleshooting Common Issues

### Issue: Jobs stay in `pending` status
**Likely Cause**: QStash not configured or webhook not reachable
**Solution**: 
1. Check QStash credentials in `.env.local`
2. Verify webhook URL is accessible: `http://localhost:3000/api/process-pharmacy-call`
3. Check QStash dashboard for failed deliveries

### Issue: `queue_jobs` table doesn't exist
**Likely Cause**: Database migrations not run
**Solution**: Run the SQL schema from `/src/lib/database/schema.sql` in Supabase

### Issue: Admin panel doesn't show queue stats
**Likely Cause**: No jobs processed yet or API error
**Solution**: 
1. Check browser console for API errors
2. Verify `/api/admin/queue-stats` endpoint works
3. Process at least one job to populate stats

### Issue: Search tickets have no selected pharmacies
**Likely Cause**: Mock search data doesn't include `metadata.selected_pharmacies`
**Solution**: Create a real search through the dashboard, or manually add pharmacy data to search metadata

## Testing Without QStash (Local Development)

If you want to test the logic without setting up QStash:

1. **Manual Job Processing**: Call the webhook directly:
   ```bash
   curl -X POST http://localhost:3000/api/process-pharmacy-call \
     -H "Content-Type: application/json" \
     -d '{
       "searchId": "your_search_id",
       "pharmacyId": "test_pharmacy",
       "pharmacyName": "Test Pharmacy",
       "pharmacyPhone": "555-0123",
       "pharmacyAddress": "123 Main St",
       "medicationName": "Test Med",
       "dosage": "10mg",
       "userId": "user_id",
       "attempt": 1
     }'
   ```

2. **Skip Signature Verification**: Comment out the signature check in the webhook for local testing:
   ```typescript
   // Comment out these lines in /src/app/api/process-pharmacy-call/route.ts
   // const isValid = await verifySignature({...})
   // if (!isValid) { return NextResponse.json({...}) }
   ```

Remember to re-enable signature verification for production!

---

## Next Steps After Testing

Once the queue system is working:
1. **Set up production QStash** with real credentials
2. **Implement Vapi.ai integration** for actual pharmacy calling
3. **Add comprehensive error handling** for production edge cases
4. **Set up monitoring alerts** for queue failures
5. **Performance testing** with larger job volumes