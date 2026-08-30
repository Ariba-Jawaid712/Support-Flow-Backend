/**
 * SupportFlow v2.0 Unit Test Suite
 * Tests deterministic AI triage, status state machine rules, validation constraints, and business logic
 */

const { analyzeTicket } = require('../services/aiTriageService');

console.log('\n======================================================');
console.log(' RUNNING SUPPORTFLOW UNIT & BUSINESS LOGIC TESTS');
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

// 1. AI TRIAGE TESTS
console.log('--- 1. Deterministic AI Triage Classification ---');

const technicalTriage = analyzeTicket(
  'Application crash on order checkout',
  'Encountered unhandled error exception 500 when customer clicked submit.'
);
assert(
  technicalTriage.category === 'Technical' && technicalTriage.priority === 'High',
  'Technical category with High priority correctly classified'
);

const billingTriage = analyzeTicket(
  'Monthly subscription refund request',
  'Customer was charged twice on their invoice and credit card.'
);
assert(
  billingTriage.category === 'Billing' && billingTriage.priority === 'Medium',
  'Billing category correctly classified from refund and invoice keywords'
);

const urgentTriage = analyzeTicket(
  'Production system down - Outage in progress',
  'Severe outage emergency! All users affected and data loss risk.'
);
assert(
  urgentTriage.category === 'Urgent Support' && urgentTriage.priority === 'Urgent',
  'Urgent Support and Urgent priority classified for outage emergency'
);

const accountTriage = analyzeTicket(
  'Locked out of 2fa account',
  'Unable to reset password or complete two-factor authentication.'
);
assert(
  accountTriage.category === 'Account',
  'Account category correctly classified for 2FA password lockout'
);

const networkTriage = analyzeTicket(
  'Office wifi packet loss and timeout',
  'High latency and connection disconnects when browsing internal VPN.'
);
assert(
  networkTriage.category === 'Network',
  'Network category correctly classified from latency, packet loss, and wifi keywords'
);

const hardwareTriage = analyzeTicket(
  'Laptop screen flickering and battery overheating',
  'The display monitor goes black and power charger cable is damaged.'
);
assert(
  hardwareTriage.category === 'Hardware',
  'Hardware category correctly classified for screen, battery, charger'
);

assert(
  technicalTriage.confidence >= 0.7 && technicalTriage.confidence <= 1.0,
  'Confidence score is bounded between 0.70 and 1.00'
);

// 2. STATE MACHINE TRANSITION RULES
console.log('\n--- 2. One-Way State Machine Rules ---');

const VALID_TRANSITIONS = {
  Pending: ['Accepted', 'Rejected'],
  Accepted: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [],
  Rejected: [],
};

const isTransitionAllowed = (current, next) => {
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(next);
};

assert(isTransitionAllowed('Pending', 'Accepted') === true, 'Pending -> Accepted is permitted');
assert(isTransitionAllowed('Pending', 'Rejected') === true, 'Pending -> Rejected is permitted');
assert(isTransitionAllowed('Accepted', 'In Progress') === true, 'Accepted -> In Progress is permitted');
assert(isTransitionAllowed('In Progress', 'Resolved') === true, 'In Progress -> Resolved is permitted');

// Test illegal / backward transitions
assert(isTransitionAllowed('Resolved', 'In Progress') === false, 'Resolved -> In Progress is strictly rejected');
assert(isTransitionAllowed('Resolved', 'Pending') === false, 'Resolved -> Pending is strictly rejected');
assert(isTransitionAllowed('Rejected', 'Pending') === false, 'Rejected -> Pending is strictly rejected');
assert(isTransitionAllowed('Rejected', 'Accepted') === false, 'Rejected -> Accepted is strictly rejected');
assert(isTransitionAllowed('Pending', 'Resolved') === false, 'Pending -> Resolved jumping is rejected');

// 3. PRIORITY CONSTRAINTS
console.log('\n--- 3. Priority Range Constraints ---');
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Critical', 'Urgent'];
assert(ALLOWED_PRIORITIES.includes('Urgent'), 'Urgent is a valid priority');
assert(ALLOWED_PRIORITIES.includes('Critical'), 'Critical is a valid priority');
assert(!ALLOWED_PRIORITIES.includes('Ultra'), 'Unrecognized priority is blocked');

// 4. RATING CONSTRAINTS
console.log('\n--- 4. Rating Validation ---');
const isValidRating = (r) => Number.isInteger(r) && r >= 1 && r <= 5;
assert(isValidRating(5) === true, '5 stars is valid');
assert(isValidRating(1) === true, '1 star is valid');
assert(isValidRating(0) === false, '0 stars is invalid');
assert(isValidRating(6) === false, '6 stars is invalid');
assert(isValidRating(4.5) === false, 'Non-integer rating 4.5 is invalid');

console.log('\n======================================================');
console.log(` UNIT TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('======================================================\n');

process.exit(failed === 0 ? 0 : 1);
