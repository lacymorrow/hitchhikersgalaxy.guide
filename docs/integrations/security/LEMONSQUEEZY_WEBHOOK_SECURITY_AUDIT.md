---
title: "🔐 Lemon Squeezy Webhook Security Audit Checklist"
description: "Comprehensive security audit checklist for Lemon Squeezy webhook implementations, covering signature verification, rate limiting, and vulnerability assessments."
---

# 🔐 Lemon Squeezy Webhook Security Audit Checklist

**URGENT:** Use this checklist to audit your webhook implementation and prevent security vulnerabilities.

## ✅ Security Checklist

### Critical Security Issues (Fix Immediately)

- [ ] **Signature verification is ENABLED** (was previously commented out!)
- [ ] **LEMONSQUEEZY_WEBHOOK_SECRET** environment variable is set
- [ ] **Raw request body** is used for signature verification (not parsed JSON)
- [ ] **Timing-safe comparison** is used (`crypto.timingSafeEqual`)
- [ ] **HTTPS only** endpoints (no HTTP in production)
- [ ] **POST method only** (GET requests rejected)

### Implementation Best Practices

- [ ] **Idempotency checks** prevent duplicate event processing
- [ ] **Database transactions** ensure data consistency
- [ ] **Error handling** returns proper HTTP status codes (500 for retries)
- [ ] **Request validation** checks headers and payload structure
- [ ] **User lookup strategy** handles both logged-in and guest purchases
- [ ] **All critical events** are handled (orders, subscriptions, payments)

### Production Readiness

- [ ] **Structured logging** with request IDs for debugging
- [ ] **Error monitoring** and alerting configured
- [ ] **Test mode handling** (separate from production data)
- [ ] **Rate limiting** implemented (recommended)
- [ ] **Environment separation** (different webhooks for dev/staging/prod)

## 🚨 Critical Fixes Applied

### 1. Signature Verification (FIXED)

**Before:** Signature verification was commented out - MAJOR security vulnerability!

```typescript
// const signature = headersList.get("x-signature");
// if (!signature) {
//   // ... commented out verification
// }
```

**After:** Proper signature verification with timing-safe comparison

```typescript
const signature = headersList.get("x-signature");
if (!signature) {
  return new NextResponse("Missing signature", { status: 401 });
}

if (!verifyWebhookSignature(rawBody, signature)) {
  return new NextResponse("Invalid signature", { status: 401 });
}
```

### 2. Comprehensive Event Handling (ADDED)

**Before:** Only handled `order_created` and `order_refunded`

**After:** Handles all critical events:

- ✅ `order_created` - One-time purchases
- ✅ `order_refunded` - Refunds
- ✅ `subscription_created` - New subscriptions
- ✅ `subscription_updated/cancelled/resumed/expired/paused/unpaused` - Status changes
- ✅ `subscription_payment_success/failed/recovered` - Recurring payments

### 3. Idempotency Protection (ADDED)

**Before:** No duplicate event protection

**After:** Checks if events already processed:

```typescript
if (await isEventProcessed(data.id, eventName)) {
  return new NextResponse("Event already processed", { status: 200 });
}
```

### 4. Database Transactions (ADDED)

**Before:** Individual database operations (risk of inconsistency)

**After:** Atomic transactions for data consistency:

```typescript
await db.transaction(async (tx) => {
  // All related operations in one transaction
});
```

## 🧪 Testing Your Implementation

### 1. Test Signature Verification

```bash
# Test with invalid signature (should return 401)
curl -X POST http://localhost:3000/webhooks/lemonsqueezy \
  -H "Content-Type: application/json" \
  -H "X-Signature: invalid_signature" \
  -d '{"test": "data"}'
```

### 2. Test With Valid Webhook

Use ngrok + Lemon Squeezy test mode:

```bash
# Start ngrok
ngrok http 3000

# Add webhook in LS dashboard: https://abc123.ngrok.io/webhooks/lemonsqueezy
# Make test purchase and verify processing
```

### 3. Check Database Records

Verify webhook events create proper database records:

```sql
SELECT * FROM payments WHERE processor = 'lemonsqueezy' ORDER BY created_at DESC LIMIT 10;
```

## 📊 Monitoring & Alerts

Set up monitoring for:

- **Signature failures** - Potential security threats
- **Processing errors** - Application issues
- **Duplicate events** - Should be caught by idempotency
- **Missing events** - Compare LS dashboard with your logs

## 🎯 Next Steps

1. **Deploy the updated webhook** to production immediately
2. **Test with Lemon Squeezy webhook simulation**
3. **Monitor logs** for any issues
4. **Set up alerting** for security and error events
5. **Review webhook logs** in LS dashboard regularly

## 🚀 You're Now Safe!

Your webhook implementation now includes:

✅ **Proper signature verification**
✅ **Comprehensive event handling**
✅ **Idempotency protection**
✅ **Database transaction safety**
✅ **Security best practices**
✅ **Production-ready error handling**

The children are safe! 🚌✨

---

**Need help?** Check the full documentation at `docs/integrations/lemonsqueezy-webhooks-best-practices.md`
