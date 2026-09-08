import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { calculateCommission } from '@/lib/utils';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface CreateOrderParams {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
  const order = await razorpay.orders.create({
    amount: params.amount,
    currency: params.currency || 'INR',
    receipt: params.receipt || `rcpt_${Date.now()}`,
    notes: params.notes || {},
  });

  return {
    id: order.id,
    amount: typeof order.amount === 'string' ? parseInt(order.amount) : order.amount,
    currency: order.currency,
    receipt: order.receipt || '',
    status: order.status,
  };
}

export async function createSubscriptionOrder(
  studentId: string,
  subscriptionData: {
    planType: 'MONTHLY' | 'WEEKLY' | 'PER_CLASS' | 'PACKAGE';
    subject: string;
    classesPerWeek: number;
    durationMinutes: number;
    price: number; // in INR
    commissionPercent: number;
    teacherId?: string;
  }
): Promise<{ orderId: string; subscriptionId: string }> {
  const teacherAmount = calculateCommission(subscriptionData.price, subscriptionData.commissionPercent).teacherAmount;
  const commissionAmount = subscriptionData.price - teacherAmount;

  // Create subscription record
  const subscription = await prisma.subscription.create({
    data: {
      studentId,
      teacherId: subscriptionData.teacherId,
      planType: subscriptionData.planType,
      subject: subscriptionData.subject,
      classesPerWeek: subscriptionData.classesPerWeek,
      durationMinutes: subscriptionData.durationMinutes,
      price: subscriptionData.price,
      commissionPercent: subscriptionData.commissionPercent,
      teacherEarning: teacherAmount,
      currentPeriodStart: new Date(),
      currentPeriodEnd: calculatePeriodEnd(subscriptionData.planType, new Date()),
      nextBillingDate: calculatePeriodEnd(subscriptionData.planType, new Date()),
      status: 'ACTIVE',
    },
  });

  // Create Razorpay order
  const order = await createOrder({
    amount: Math.round(subscriptionData.price * 100), // Convert to paise
    currency: 'INR',
    receipt: `sub_${subscription.id}`,
    notes: {
      subscriptionId: subscription.id,
      studentId,
      planType: subscriptionData.planType,
    },
  });

  // Update subscription with Razorpay order ID
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { razorpayPlanId: order.id },
  });

  return { orderId: order.id, subscriptionId: subscription.id };
}

function calculatePeriodEnd(planType: string, startDate: Date): Date {
  const endDate = new Date(startDate);
  switch (planType) {
    case 'WEEKLY':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'MONTHLY':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'PER_CLASS':
    case 'PACKAGE':
      endDate.setFullYear(endDate.getFullYear() + 1); // Long expiry for packages
      break;
  }
  return endDate;
}

export async function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<boolean> {
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === razorpaySignature;
}

export async function capturePayment(
  paymentId: string,
  amount: number
): Promise<any> {
  return (razorpay.payments as any).capture(paymentId, { amount });
}

export async function refundPayment(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
): Promise<any> {
  const params: any = { notes };
  if (amount) params.amount = Math.round(amount * 100); // Convert to paise

  return razorpay.payments.refund(paymentId, params);
}

export async function createRazorpayPlan(
  subscriptionData: {
    planType: string;
    subject: string;
    price: number;
    interval: number;
    period: 'weekly' | 'monthly';
  }
): Promise<string> {
  const plan = await razorpay.plans.create({
    period: subscriptionData.period,
    interval: subscriptionData.interval,
    item: {
      name: `${subscriptionData.subject} - ${subscriptionData.planType}`,
      amount: Math.round(subscriptionData.price * 100),
      currency: 'INR',
      description: `${subscriptionData.planType} tutoring for ${subscriptionData.subject}`,
    },
    notes: {
      planType: subscriptionData.planType,
      subject: subscriptionData.subject,
    },
  });

  return plan.id;
}

export async function createRazorpaySubscription(
  planId: string,
  customerId: string,
  totalCount?: number,
  quantity = 1
): Promise<string> {
  const params: any = {
    plan_id: planId,
    customer_id: customerId,
    quantity,
    customer_notify: 1,
    notes: {},
  };
  if (totalCount !== undefined) {
    params.total_count = totalCount;
  }

  const subscription = await razorpay.subscriptions.create(params);

  return subscription.id;
}

export async function createRazorpayCustomer(
  email: string,
  name: string,
  contact: string,
  notes?: Record<string, string>
): Promise<string> {
  const customer = await razorpay.customers.create({
    email,
    name,
    contact,
    notes,
  });

  return customer.id;
}

export async function createPayout(
  teacherId: string,
  amount: number,
  bankDetails: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  }
): Promise<{ payoutId: string; status: string }> {
  const payout = await (razorpay as any).payouts.create({
    account_number: '2323230000000001', // Your RazorpayX account
    fund_account_id: await getOrCreateFundAccount(teacherId, bankDetails),
    amount: Math.round(amount * 100),
    currency: 'INR',
    mode: 'IMPS',
    purpose: 'payout',
    narration: `TutorConnect payout for teacher ${teacherId}`,
    notes: { teacherId },
  });

  return { payoutId: payout.id, status: payout.status };
}

async function getOrCreateFundAccount(
  teacherId: string,
  bankDetails: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  }
): Promise<string> {
  // Check if fund account already exists
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { userId: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: teacher!.userId },
    select: { id: true, email: true, phone: true },
  });

  // In a real implementation, you'd store the fund_account_id in the teacher profile
  // For now, create a new one each time (Razorpay allows this)
  const fundAccount = await (razorpay as any).fundAccounts.create({
    contact: {
      name: bankDetails.accountHolderName,
      email: user!.email,
      contact: user!.phone || '',
      type: 'vendor',
      reference_id: teacherId,
    },
    account: {
      type: 'bank_account',
      bank_account: {
        account_number: bankDetails.accountNumber,
        ifsc: bankDetails.ifsc,
        beneficiary_name: bankDetails.accountHolderName,
      },
    },
  });

  return fundAccount.id;
}

export async function handleWebhook(event: any): Promise<void> {
  const { event: eventType, payload } = event;

  switch (eventType) {
    case 'payment.captured':
      await handlePaymentCaptured(payload.payment.entity);
      break;
    case 'payment.failed':
      await handlePaymentFailed(payload.payment.entity);
      break;
    case 'refund.created':
      await handleRefundCreated(payload.refund.entity);
      break;
    case 'subscription.charged':
      await handleSubscriptionCharged(payload.subscription.entity);
      break;
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(payload.subscription.entity);
      break;
    case 'payout.processed':
      await handlePayoutProcessed(payload.payout.entity);
      break;
    case 'payout.failed':
      await handlePayoutFailed(payload.payout.entity);
      break;
  }
}

async function handlePaymentCaptured(payment: any): Promise<void> {
  const orderId = payment.order_id;
  const subscription = await prisma.subscription.findFirst({
    where: { razorpayPlanId: orderId },
  });

  if (subscription) {
    // Update subscription with payment details
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        razorpaySubscriptionId: payment.subscription_id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: calculatePeriodEnd(subscription.planType, new Date()),
        nextBillingDate: calculatePeriodEnd(subscription.planType, new Date()),
      },
    });

    // Create payment record
    const commission = calculateCommission(Number(subscription.price), Number(subscription.commissionPercent));

    await prisma.payment.create({
      data: {
        studentId: subscription.studentId,
        subscriptionId: subscription.id,
        amount: subscription.price,
        commissionAmount: commission.platformAmount,
        teacherAmount: commission.teacherAmount,
        commissionPercent: subscription.commissionPercent,
        currency: 'INR',
        status: 'COMPLETED',
        paymentMethod: payment.method,
        razorpayOrderId: orderId,
        razorpayPaymentId: payment.id,
        razorpaySignature: payment.signature,
        paidAt: new Date(),
      },
    });

    // Create teacher earning record
    if (subscription.teacherId) {
      await prisma.teacherEarning.create({
        data: {
          teacherId: subscription.teacherId,
          subscriptionId: subscription.id,
          paymentId: (await prisma.payment.findFirst({
            where: { razorpayPaymentId: payment.id },
            select: { id: true },
          }))!.id,
          grossAmount: subscription.price,
          commissionAmount: commission.platformAmount,
          netAmount: commission.teacherAmount,
          commissionPercent: subscription.commissionPercent,
          status: 'AVAILABLE',
          earnedAt: new Date(),
        },
      });

      // Update teacher stats
      await prisma.teacher.update({
        where: { id: subscription.teacherId },
        data: { totalStudents: { increment: 1 }, activeStudents: { increment: 1 } },
      });
    }
  } else {
    // One-time payment (demo, package, etc.)
    await handleOneTimePayment(payment);
  }
}

async function handleOneTimePayment(payment: any): Promise<void> {
  const existingPayment = await prisma.payment.findUnique({
    where: { razorpayPaymentId: payment.id },
  });

  if (existingPayment) return;

  const commissionPercent = Number(process.env.PLATFORM_COMMISSION_PERCENT || 15);
  const commission = calculateCommission(Number(payment.amount) / 100, commissionPercent);

  await prisma.payment.create({
    data: {
      studentId: payment.notes?.studentId || '',
      amount: Number(payment.amount) / 100,
      commissionAmount: commission.platformAmount,
      teacherAmount: commission.teacherAmount,
      commissionPercent,
      currency: 'INR',
      status: 'COMPLETED',
      paymentMethod: payment.method,
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      razorpaySignature: payment.signature,
      paidAt: new Date(),
    },
  });
}

async function handlePaymentFailed(payment: any): Promise<void> {
  await prisma.payment.updateMany({
    where: { razorpayOrderId: payment.order_id },
    data: { status: 'FAILED' },
  });
}

async function handleRefundCreated(refund: any): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { razorpayPaymentId: refund.payment_id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundAmount: Number(refund.amount) / 100,
        refundedAt: new Date(),
        refundReason: refund.notes?.reason,
      },
    });

    // Update teacher earnings
    await prisma.teacherEarning.updateMany({
      where: { paymentId: payment.id },
      data: { status: 'PENDING' }, // Will be recalculated
    });
  }
}

async function handleSubscriptionCharged(subscription: any): Promise<void> {
  // Recurring subscription payment
  const existingPayment = await prisma.payment.findUnique({
    where: { razorpayPaymentId: subscription.payment_id },
  });

  if (existingPayment) return;

  const sub = await prisma.subscription.findFirst({
    where: { razorpaySubscriptionId: subscription.id },
  });

  if (!sub) return;

  const commission = calculateCommission(Number(sub.price), Number(sub.commissionPercent));

  const newPayment = await prisma.payment.create({
    data: {
      studentId: sub.studentId,
      subscriptionId: sub.id,
      amount: sub.price,
      commissionAmount: commission.platformAmount,
      teacherAmount: commission.teacherAmount,
      commissionPercent: sub.commissionPercent,
      currency: 'INR',
      status: 'COMPLETED',
      paymentMethod: subscription.payment_method,
      razorpayOrderId: subscription.invoice_id,
      razorpayPaymentId: subscription.payment_id,
      razorpaySignature: subscription.signature,
      paidAt: new Date(),
    },
  });

  // Create teacher earning
  if (sub.teacherId) {
    await prisma.teacherEarning.create({
      data: {
        teacherId: sub.teacherId,
        subscriptionId: sub.id,
        paymentId: newPayment.id,
        grossAmount: sub.price,
        commissionAmount: commission.platformAmount,
        netAmount: commission.teacherAmount,
        commissionPercent: sub.commissionPercent,
        status: 'AVAILABLE',
        earnedAt: new Date(),
      },
    });
  }

  // Update subscription period
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      currentPeriodStart: new Date(subscription.current_start * 1000),
      currentPeriodEnd: new Date(subscription.current_end * 1000),
      nextBillingDate: new Date(subscription.next_billing_date * 1000),
    },
  });
}

async function handleSubscriptionCancelled(subscription: any): Promise<void> {
  const sub = await prisma.subscription.findFirst({
    where: { razorpaySubscriptionId: subscription.id },
  });

  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
}

async function handlePayoutProcessed(payout: any): Promise<void> {
  const payoutRecord = await prisma.teacherPayout.findUnique({
    where: { razorpayPayoutId: payout.id },
  });

  if (payoutRecord) {
    await prisma.teacherPayout.update({
      where: { id: payoutRecord.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    await prisma.teacherEarning.updateMany({
      where: { payoutId: payoutRecord.id },
      data: { status: 'PAID_OUT', paidOutAt: new Date() },
    });
  }
}

async function handlePayoutFailed(payout: any): Promise<void> {
  const payoutRecord = await prisma.teacherPayout.findUnique({
    where: { razorpayPayoutId: payout.id },
  });

  if (payoutRecord) {
    await prisma.teacherPayout.update({
      where: { id: payoutRecord.id },
      data: { status: 'FAILED', failureReason: payout.failure_reason },
    });
  }
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}