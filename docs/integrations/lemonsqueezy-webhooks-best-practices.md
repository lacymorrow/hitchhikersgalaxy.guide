---
title: "Lemon Squeezy Webhook Best Practices"
description: "Best practices and guidelines for implementing secure and reliable Lemon Squeezy webhook handling in Shipkit applications."
---

# Lemon Squeezy Webhook Best Practices

This document outlines the best practices for implementing Lemon Squeezy webhooks securely and reliably in your Next.js application.

## Table of Contents

1. [Overview](#overview)
2. [Security Best Practices](#security-best-practices)
3. [Implementation Best Practices](#implementation-best-practices)
4. [Error Handling & Resilience](#error-handling--resilience)
5. [Webhook Events](#webhook-events)
6. [Testing & Debugging](#testing--debugging)
7. [Monitoring & Logging](#monitoring--logging)
8. [Common Pitfalls](#common-pitfalls)

## Overview

Webhooks are HTTP callbacks that Lemon Squeezy sends to your application when specific events occur in your store. They're crucial for:

- Real-time order processing
- Subscription management
- Payment status updates
- User access control
- Revenue tracking

**Why webhooks are better than polling APIs:**

- Real-time updates
- Reduced API calls and rate limiting
- Better user experience
- More reliable than periodic API polling

## Security Best Practices

### 1. Always Verify Webhook Signatures 🔒

**CRITICAL:** Never trust webhook data without verifying the signature. This prevents malicious actors from sending fake webhooks to your endpoint.

```typescript
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    logger.error("LEMONSQUEEZY_WEBHOOK_SECRET environment variable is not set");
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", env.LEMONSQUEEZY_WEBHOOK_SECRET);
    const digest = Buffer.from(
      hmac.update(rawBody, "utf8").digest("hex"),
      "hex",
    );
    const signatureBuffer = Buffer.from(signature, "hex");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(digest, signatureBuffer);
  } catch (error) {
    logger.error("Error verifying webhook signature", { error });
    return false;
  }
}
```

### 2. Use Environment Variables for Secrets

Store your webhook secret securely:

```bash
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Implement Request Validation

- Validate the request method (POST only)
- Check for required headers
- Validate JSON payload structure
- Verify the signature before processing

### 4. Rate Limiting (Recommended)

Implement rate limiting to prevent abuse:

```typescript
// Example using a simple in-memory store
const webhookRateLimit = new Map<
  string,
  { count: number; resetTime: number }
>();

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  const client = webhookRateLimit.get(clientIP) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > client.resetTime) {
    client.count = 1;
    client.resetTime = now + windowMs;
  } else {
    client.count++;
  }

  webhookRateLimit.set(clientIP, client);
  return client.count <= maxRequests;
}
```

## Implementation Best Practices

### 1. Idempotency - Prevent Duplicate Processing

Always check if an event has already been processed:

```typescript
async function isEventProcessed(
  eventId: string,
  eventName: string,
): Promise<boolean> {
  try {
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.orderId, eventId),
    });

    // For subscription events, also check by subscription ID
    if (!existingPayment && eventName.startsWith("subscription_")) {
      const existingSubscriptionPayment = await db.query.payments.findFirst({
        where: (payments, { like }) =>
          like(payments.metadata, `%"subscription_id":"${eventId}"%`),
      });
      return !!existingSubscriptionPayment;
    }

    return !!existingPayment;
  } catch (error) {
    logger.error("Error checking if event is processed", {
      eventId,
      eventName,
      error,
    });
    return false;
  }
}
```

### 2. Database Transactions for Consistency

Use database transactions to ensure data consistency:

```typescript
await db.transaction(async (tx) => {
  await tx.insert(payments).values({
    userId,
    orderId: data.id,
    amount: attributes.total_usd || attributes.total,
    status: "completed",
    processor: "lemonsqueezy",
    metadata: {
      /* ... */
    },
  });

  // Any related updates should be in the same transaction
  await tx
    .update(users)
    .set({
      hasActiveSubscription: true,
    })
    .where(eq(users.id, userId));
});
```

### 3. Comprehensive Event Handling

Support all critical webhook events:

```typescript
switch (eventName) {
  case "order_created":
    await handleOrderCreated(payload);
    break;
  case "order_refunded":
    await handleOrderRefunded(payload);
    break;
  case "subscription_created":
    await handleSubscriptionCreated(payload);
    break;
  case "subscription_updated":
  case "subscription_cancelled":
  case "subscription_resumed":
  case "subscription_expired":
  case "subscription_paused":
  case "subscription_unpaused":
    await handleSubscriptionStatusChange(payload, eventName);
    break;
  case "subscription_payment_success":
  case "subscription_payment_failed":
  case "subscription_payment_recovered":
    await handleSubscriptionPayment(payload, eventName);
    break;
  default:
    logger.info("Unhandled webhook event", { eventName });
    return new NextResponse("Event not handled", { status: 200 });
}
```

### 4. User Management Strategy

Implement flexible user lookup and creation:

```typescript
async function findOrCreateUser(
  userEmail: string,
  userName?: string | null,
  customData?: any,
): Promise<string> {
  // 1. Try to find by custom data user_id first (for logged-in purchases)
  if (customData?.user_id) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, customData.user_id),
    });
    if (existingUser) return existingUser.id;
  }

  // 2. Find by email
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, userEmail.toLowerCase()),
  });
  if (existingUser) return existingUser.id;

  // 3. Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      email: userEmail.toLowerCase(),
      name: userName || null,
      emailVerified: new Date(), // Verified since they made a purchase
    })
    .returning();

  return newUser.id;
}
```

## Error Handling & Resilience

### 1. Proper HTTP Status Codes

Return appropriate status codes for different scenarios:

- `200` - Success (webhook processed)
- `400` - Bad request (malformed payload)
- `401` - Unauthorized (invalid signature)
- `409` - Conflict (duplicate event)
- `500` - Server error (triggers Lemon Squeezy retry)

### 2. Comprehensive Error Logging

Log all errors with context for debugging:

```typescript
try {
  await handleOrderCreated(payload);
} catch (error) {
  logger.error("Failed to process order_created webhook", {
    requestId,
    orderId: data.id,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : String(error),
    payload: JSON.stringify(payload),
  });

  // Return 500 to trigger Lemon Squeezy retry
  throw error;
}
```

### 3. Graceful Degradation

Handle edge cases gracefully:

```typescript
// Handle missing user email
if (!attributes.user_email) {
  logger.warn("Order missing user email", { orderId: data.id });
  throw new Error("Order missing user email");
}

// Handle test mode appropriately
if (meta.test_mode && env.NODE_ENV === "production") {
  logger.info("Skipping test mode webhook in production", { orderId: data.id });
  return;
}
```

## Webhook Events

### Critical Events to Handle

1. **order_created** - New one-time purchase
2. **order_refunded** - Purchase refunded
3. **subscription_created** - New subscription
4. **subscription_updated** - Subscription modified
5. **subscription_cancelled** - Subscription cancelled
6. **subscription_resumed** - Subscription reactivated
7. **subscription_expired** - Subscription ended
8. **subscription_payment_success** - Recurring payment succeeded
9. **subscription_payment_failed** - Recurring payment failed

### Event Data Structure

Each webhook follows this structure:

```typescript
{
  "meta": {
    "event_name": "order_created",
    "test_mode": false,
    "custom_data": { "user_id": "123" }
  },
  "data": {
    "type": "orders",
    "id": "12345",
    "attributes": {
      "user_email": "user@example.com",
      "status": "paid",
      "total_usd": 2999,
      // ... more attributes
    }
  }
}
```

## Testing & Debugging

### 1. Local Testing with ngrok

Use ngrok to test webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose localhost
ngrok http 3000

# Use the ngrok URL for your webhook endpoint
# Example: https://abc123.ngrok.io/webhooks/lemonsqueezy
```

### 2. Test Mode

Always test in Lemon Squeezy test mode first:

- Create test products
- Use test credit cards
- Verify webhook behavior
- Check database records

### 3. Webhook Simulation

Use Lemon Squeezy's webhook simulation feature:

1. Go to your Lemon Squeezy dashboard
2. Navigate to Settings → Webhooks
3. Use "Simulate event" for testing specific scenarios

### 4. Debugging Tips

```typescript
// Add detailed logging for debugging
logger.debug("Webhook payload received", {
  headers: Object.fromEntries(request.headers.entries()),
  body: rawBody.substring(0, 500), // First 500 chars
  signature,
});

// Log processing steps
logger.debug("Processing webhook", {
  step: "user_lookup",
  userEmail: attributes.user_email,
  customData: meta.custom_data,
});
```

## Monitoring & Logging

### 1. Structured Logging

Use structured logging with context:

```typescript
logger.info("Webhook processed successfully", {
  requestId,
  eventName,
  dataId: data.id,
  processingTime: Date.now() - startTime,
  userId,
  amount: attributes.total_usd,
  testMode: meta.test_mode,
});
```

### 2. Metrics to Track

- Webhook processing time
- Success/failure rates
- Event types received
- Duplicate events detected
- Error types and frequencies

### 3. Alerting

Set up alerts for:

- High error rates
- Signature verification failures
- Unexpected event types
- Processing time spikes
- Missing webhook secrets

## Common Pitfalls

### ❌ Don't Do These

1. **Never skip signature verification** - Even in development
2. **Don't use the same endpoint for multiple stores** - Use separate endpoints or validate store_id
3. **Don't process webhooks synchronously** - Store and process asynchronously for better performance
4. **Don't trust event order** - Events may arrive out of order
5. **Don't ignore test_mode flag** - Handle test events appropriately
6. **Don't log sensitive data** - Avoid logging payment details or user data
7. **Don't use raw console.log** - Use structured logging

### ✅ Do These Instead

1. **Always verify signatures first**
2. **Use separate webhook endpoints per environment**
3. **Store webhook events and process asynchronously**
4. **Implement idempotency checks**
5. **Handle test mode appropriately**
6. **Use structured logging with request IDs**
7. **Implement proper error handling and retries**

## Production Checklist

Before going live, ensure:

- [ ] Webhook signature verification is enabled
- [ ] LEMONSQUEEZY_WEBHOOK_SECRET is set in production
- [ ] Proper error handling and logging is implemented
- [ ] Idempotency checks are in place
- [ ] Database transactions are used for consistency
- [ ] All critical webhook events are handled
- [ ] Test mode webhooks are handled appropriately
- [ ] Monitoring and alerting is set up
- [ ] Webhook endpoint is HTTPS only
- [ ] Rate limiting is implemented (optional but recommended)

## Resources

- [Lemon Squeezy Webhook Documentation](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks)
- [Webhook Security Best Practices](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks#signing-and-validating-webhook-requests)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [Webhook Testing Tools](https://webhook.site)

## Need Help?

If you encounter issues:

1. Check the Lemon Squeezy webhook logs in your dashboard
2. Review your application logs with request IDs
3. Verify your webhook secret is correct
4. Test with webhook simulation feature
5. Check our troubleshooting guide in the project docs
