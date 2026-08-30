/**
 * SupportFlow v2.0 Comprehensive End-to-End Integration Test Suite
 * Tests all authentication, worker approval, AI triage, one-way state transitions,
 * priority management, messaging, notifications, and 5-star review workflows.
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { app, startServer } = require('../server');
const { disconnectDB } = require('../config/db');

let serverInstance;
let baseUrl = '';

// Helper to make HTTP requests
const request = async (method, endpoint, body = null, token = null) => {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log(' STARTING SUPPORTFLOW INTEGRATION & REGRESSION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - ${details}`);
      failed++;
    }
  };

  try {
    // Start local server on dynamic test port
    await startServer(5055);
    baseUrl = `http://localhost:5055/api`;

    // 1. HEALTH CHECK
    console.log('\n--- 1. Health Check ---');
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body.success === true, 'Health check endpoint returns operational');

    // 2. AUTHENTICATION & WORKER APPROVAL FLOW
    console.log('\n--- 2. Authentication & Worker Approval Workflow ---');

    // Customer Signup
    const custEmail = `customer_${Date.now()}@example.com`;
    const custSignup = await request('POST', '/auth/signup', {
      name: 'Alice Customer',
      email: custEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'customer',
    });
    assert(custSignup.status === 201 && custSignup.body.token, 'Customer signup succeeds and immediately returns token');
    const customerToken = custSignup.body.token;

    // Worker Signup
    const workerEmail = `worker_${Date.now()}@example.com`;
    const workerSignup = await request('POST', '/auth/signup', {
      name: 'Bob Worker',
      email: workerEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'worker',
      workerBio: 'Expert network and hardware technician',
      workerSkills: ['Hardware', 'Network', 'Troubleshooting'],
    });
    assert(
      workerSignup.status === 201 &&
      workerSignup.body.user.workerApprovalStatus === 'Pending Approval' &&
      !workerSignup.body.token,
      'Worker signup registers as Pending Approval without granting immediate login token'
    );
    const workerId = workerSignup.body.user._id;

    // Worker Login before approval -> must be rejected
    const workerLoginBeforeApproval = await request('POST', '/auth/login', {
      email: workerEmail,
      password: 'Password123!',
    });
    assert(
      workerLoginBeforeApproval.status === 403,
      'Worker login before Admin approval is rejected with 403 Forbidden'
    );

    // Admin Login
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@supportflow.com',
      password: 'AdminPassword123!',
    });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin logs in successfully');
    const adminToken = adminLogin.body.token;

    // Admin reviews and approves Worker
    const approveWorkerRes = await request('POST', `/admin/workers/${workerId}/approve`, {}, adminToken);
    assert(
      approveWorkerRes.status === 200 && approveWorkerRes.body.worker.workerApprovalStatus === 'Approved',
      'Admin approves worker registration request'
    );

    // Worker Login after approval -> must succeed
    const workerLoginAfterApproval = await request('POST', '/auth/login', {
      email: workerEmail,
      password: 'Password123!',
    });
    assert(
      workerLoginAfterApproval.status === 200 && workerLoginAfterApproval.body.token,
      'Approved worker logs in successfully and receives JWT'
    );
    const workerToken = workerLoginAfterApproval.body.token;

    // 3. TICKET CREATION & DETERMINISTIC AI TRIAGE
    console.log('\n--- 3. Ticket Creation & Deterministic AI Triage ---');
    const createTicketRes = await request(
      'POST',
      '/tickets',
      {
        subject: 'Database connection timeout and server crash error',
        description: 'Our team is seeing critical bug exceptions and blank page 500 error when submitting orders.',
      },
      customerToken
    );

    assert(createTicketRes.status === 201, 'Customer successfully creates ticket');
    const ticket = createTicketRes.body.ticket;
    assert(
      ticket.category === 'Technical' && ticket.priority === 'High' && ticket.aiTriage.confidence >= 0.8,
      'Deterministic rule-based AI triage correctly classifies Technical category and High priority'
    );
    const ticketId = ticket._id;

    // 4. WORKER ACCEPTANCE & IMMUTABILITY
    console.log('\n--- 4. Worker Acceptance & Multiple Worker Protection ---');

    // Worker views available tickets
    const availRes = await request('GET', '/workers/available', null, workerToken);
    assert(
      availRes.status === 200 && availRes.body.tickets.some((t) => t._id === ticketId),
      'Worker can list pending available requests'
    );

    // Worker accepts ticket
    const acceptRes = await request('POST', `/workers/requests/${ticketId}/accept`, {}, workerToken);
    assert(
      acceptRes.status === 200 && acceptRes.body.ticket.status === 'Accepted',
      'Worker successfully accepts pending request'
    );

    // Create a second worker and approve them
    const worker2Email = `worker2_${Date.now()}@example.com`;
    const w2Signup = await request('POST', '/auth/signup', {
      name: 'Charlie Worker',
      email: worker2Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'worker',
    });
    await request('POST', `/admin/workers/${w2Signup.body.user._id}/approve`, {}, adminToken);
    const w2Login = await request('POST', '/auth/login', { email: worker2Email, password: 'Password123!' });
    const worker2Token = w2Login.body.token;

    // Second worker attempts to accept already accepted ticket -> must be rejected
    const secondAcceptRes = await request('POST', `/workers/requests/${ticketId}/accept`, {}, worker2Token);
    assert(
      secondAcceptRes.status === 400,
      'Second worker is prevented from accepting an already accepted ticket'
    );

    // 5. PRIORITY MANAGEMENT
    console.log('\n--- 5. Worker Priority Management ---');
    // Assigned Worker updates priority to Urgent
    const updatePrioRes = await request('PUT', `/workers/requests/${ticketId}/priority`, { priority: 'Urgent' }, workerToken);
    assert(
      updatePrioRes.status === 200 && updatePrioRes.body.ticket.priority === 'Urgent',
      'Assigned worker updates operational priority to Urgent'
    );

    // Customer attempts to update priority -> must be rejected (Worker only)
    const custUpdatePrio = await request('PUT', `/workers/requests/${ticketId}/priority`, { priority: 'Low' }, customerToken);
    assert(
      custUpdatePrio.status === 403,
      'Customer cannot alter operational priority (Worker only guard)'
    );

    // 6. ONE-WAY STATE TRANSITIONS
    console.log('\n--- 6. One-Way State Transitions & Immutability ---');
    // Accepted -> In Progress
    const inProgressRes = await request(
      'PUT',
      `/workers/requests/${ticketId}/status`,
      { nextStatus: 'In Progress', note: 'Investigating database query latency' },
      workerToken
    );
    assert(
      inProgressRes.status === 200 && inProgressRes.body.ticket.status === 'In Progress',
      'Status transitions from Accepted -> In Progress'
    );

    // In Progress -> Resolved
    const resolvedRes = await request(
      'PUT',
      `/workers/requests/${ticketId}/status`,
      { nextStatus: 'Resolved', note: 'Fixed indexed query and restarted connection pool' },
      workerToken
    );
    assert(
      resolvedRes.status === 200 && resolvedRes.body.ticket.status === 'Resolved',
      'Status transitions from In Progress -> Resolved'
    );

    // Attempt illegal transition backwards (Resolved -> In Progress or Resolved -> Pending)
    const illegalTransition = await request(
      'PUT',
      `/workers/requests/${ticketId}/status`,
      { nextStatus: 'In Progress' },
      workerToken
    );
    assert(
      illegalTransition.status === 400,
      'Finalized Resolved state cannot transition backwards (One-way immutability enforced)'
    );

    // 7. REAL-TIME MESSAGING & CONVERSATION
    console.log('\n--- 7. Real-Time Conversation Messaging ---');
    const sendMsg1 = await request(
      'POST',
      `/messages/ticket/${ticketId}`,
      { message: 'Hi, thank you for looking into this!' },
      customerToken
    );
    assert(sendMsg1.status === 201, 'Customer posts message to ticket conversation');

    const sendMsg2 = await request(
      'POST',
      `/messages/ticket/${ticketId}`,
      { message: 'Glad to assist, the issue has been resolved.' },
      workerToken
    );
    assert(sendMsg2.status === 201, 'Assigned worker posts reply to ticket conversation');

    const getMsgs = await request('GET', `/messages/ticket/${ticketId}`, null, customerToken);
    assert(
      getMsgs.status === 200 && getMsgs.body.messages.length === 2,
      'Both conversation messages are persisted and retrieved'
    );

    // 8. 5-STAR CUSTOMER REVIEW SYSTEM
    console.log('\n--- 8. Customer Review & 5-Star Rating System ---');
    const reviewRes = await request(
      'POST',
      `/tickets/${ticketId}/review`,
      {
        rating: 5,
        comment: 'Outstanding and prompt support! Fixed the crash immediately.',
      },
      customerToken
    );
    assert(
      reviewRes.status === 201 && reviewRes.body.review.rating === 5,
      'Customer submits 5-star review for Resolved ticket'
    );

    // Attempt duplicate review for same ticket -> must be rejected
    const dupReviewRes = await request(
      'POST',
      `/tickets/${ticketId}/review`,
      {
        rating: 4,
        comment: 'Trying duplicate review',
      },
      customerToken
    );
    assert(
      dupReviewRes.status === 400,
      'Duplicate review by same customer on same ticket is strictly blocked'
    );

    // Worker profile calculation check
    const workerProfileRes = await request('GET', `/workers/${workerId}/profile`, null, workerToken);
    assert(
      workerProfileRes.status === 200 &&
      workerProfileRes.body.averageRating === 5 &&
      workerProfileRes.body.totalReviews === 1,
      'Worker profile dynamically calculates real average rating (5.0) and review counts from DB'
    );

    // 9. NOTIFICATION PERSISTENCE
    console.log('\n--- 9. Notification Persistence ---');
    const notifs = await request('GET', '/notifications', null, customerToken);
    assert(
      notifs.status === 200 && notifs.body.notifications.length > 0,
      'Customer notifications are persisted and retrievable'
    );

    // Mark as read
    const notifId = notifs.body.notifications[0]._id;
    const markReadRes = await request('PUT', `/notifications/${notifId}/read`, {}, customerToken);
    assert(markReadRes.status === 200, 'Notification marked as read');

    // 10. ADMIN DASHBOARD STATS
    console.log('\n--- 10. Admin Platform Statistics ---');
    const statsRes = await request('GET', '/admin/stats', null, adminToken);
    assert(
      statsRes.status === 200 &&
      statsRes.body.stats.totalRequests >= 1 &&
      statsRes.body.stats.resolvedRequests >= 1,
      'Admin statistics endpoint aggregates correct platform metrics'
    );

    console.log('\n======================================================');
    console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================\n');

    await disconnectDB();
    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test suite failed unexpectedly:', err);
    await disconnectDB();
    process.exit(1);
  }
};

runTests();
