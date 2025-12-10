# Quick Testing Checklist ✅

## 🚀 Setup (5 minutes)

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Create database tables**:
   - Copy SQL from `/src/lib/database/schema.sql`  
   - Run it in your Supabase SQL editor
   - Or run: `/scripts/check-database.sql` to see what's missing

3. **Add test data** (optional):
   ```sql
   -- Run /scripts/setup-test-data.sql in Supabase
   ```

4. **Start dev server**:
   ```bash
   npm run dev
   ```

## 🧪 Basic Test (2 minutes)

1. **Test without QStash**:
   ```bash
   node scripts/test-queue-locally.js
   ```

2. **Check admin panel**:
   - Go to `http://localhost:3000/admin`
   - Should see queue stats in Overview tab
   - Should see test searches in Search Tickets tab

3. **Manual test in admin**:
   - Click on a search ticket with `payment_completed` status
   - Click "Start Calling Pharmacies" 
   - Should see success message (jobs created)

## 📊 Verify Results

**Database Check**:
```sql
SELECT pharmacy_name, status, created_at FROM queue_jobs ORDER BY created_at DESC LIMIT 5;
```

**Expected**: See job records with status `pending` or `retry_scheduled`

**Admin Panel Check**:
- Overview tab → Should show queue statistics
- Search Tickets → Select a search → Click "Show Queue Status"
- Should see individual job statuses

## 🎯 What Should Work

✅ **Job Creation**: Clicking "Start Calling" creates `queue_jobs` records  
✅ **Admin Monitoring**: Queue stats and job details display  
✅ **Mock Processing**: Local webhook processes jobs with mock results  
✅ **Business Hours**: Jobs scheduled for business hours if outside 9AM-7PM  
✅ **Rate Limiting**: Same pharmacy can't be called within 1 hour  

## ⚠️ What Needs QStash

❌ **Automatic Processing**: Jobs stay `pending` without QStash  
❌ **Retry Logic**: Failed jobs won't auto-retry without QStash  
❌ **Production Scale**: Real queue processing needs QStash  

## 🔧 Quick Fixes

**Issue**: No queue tables  
**Fix**: Run `/src/lib/database/schema.sql` in Supabase

**Issue**: No test data  
**Fix**: Run `/scripts/setup-test-data.sql`  

**Issue**: Admin panel shows errors  
**Fix**: Check browser console, verify API endpoints work

**Issue**: Jobs stay pending  
**Fix**: Either run local test script OR set up QStash

## 📈 Next Steps

1. **Basic testing works?** → Set up QStash for full automation
2. **QStash working?** → Move to Phase 2: AI Voice Integration  
3. **Need more test data?** → Modify `/scripts/setup-test-data.sql`
4. **Ready for production?** → Add comprehensive error handling

---

**🎉 Success Criteria**: You should see queue jobs being created and monitored in the admin panel, with mock call results appearing in the database.