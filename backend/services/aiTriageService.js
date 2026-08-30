/**
 * Deterministic Rule-Based Local AI Triage Service
 * Analyzes ticket subject & description to predict category, priority, summary, and confidence score.
 * Purely local - NO external AI APIs, zero external keys needed.
 */

const CATEGORY_RULES = [
  {
    category: 'Urgent Support',
    keywords: ['outage', 'system down', 'production down', 'security breach', 'emergency', 'data loss', 'all users affected', 'blackout'],
    weight: 10,
  },
  {
    category: 'Billing',
    keywords: ['refund', 'invoice', 'charge', 'subscription', 'payment', 'credit card', 'bill', 'receipt', 'pricing', 'charged twice', 'overcharged'],
    weight: 8,
  },
  {
    category: 'Account',
    keywords: ['password', 'reset password', '2fa', 'two-factor', 'locked out', 'login failed', 'account locked', 'verify email', 'profile', 'sso'],
    weight: 7,
  },
  {
    category: 'Network',
    keywords: ['wifi', 'connection', 'latency', 'dns', 'timeout', 'packet loss', 'disconnect', 'vpn', 'slow internet', 'bandwidth'],
    weight: 7,
  },
  {
    category: 'Hardware',
    keywords: ['laptop', 'screen', 'battery', 'keyboard', 'overheating', 'cable', 'charger', 'motherboard', 'printer', 'hardware', 'usb', 'monitor'],
    weight: 7,
  },
  {
    category: 'Technical',
    keywords: ['bug', 'crash', 'error', 'exception', 'broken', 'failed to load', 'glitch', 'api error', 'blank page', '500 error', '404', 'not working'],
    weight: 6,
  },
];

const PRIORITY_RULES = [
  {
    priority: 'Urgent',
    keywords: ['outage', 'system down', 'production down', 'security breach', 'emergency', 'immediate', 'all users affected', 'catastrophic'],
    minMatches: 1,
  },
  {
    priority: 'Critical',
    keywords: ['data loss', 'payment failed', 'cannot access account', 'cannot work', 'blocking', 'severe', 'urgent', 'asap', 'production'],
    minMatches: 1,
  },
  {
    priority: 'High',
    keywords: ['crash', 'error', 'broken', 'failed', 'major', 'important', 'deadline', 'impacted', 'trouble'],
    minMatches: 1,
  },
  {
    priority: 'Low',
    keywords: ['minor', 'suggestion', 'typo', 'cosmetic', 'feature request', 'inquiry', 'how to', 'question', 'feedback', 'information'],
    minMatches: 1,
  },
];

const analyzeTicket = (subject = '', description = '') => {
  const text = `${subject} ${description}`.toLowerCase();
  
  // 1. Determine Category
  let bestCategory = 'General';
  let highestCategoryScore = 0;
  let matchedKeywords = [];

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    const matches = [];
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        score += rule.weight;
        matches.push(kw);
      }
    }
    if (score > highestCategoryScore) {
      highestCategoryScore = score;
      bestCategory = rule.category;
      matchedKeywords = matches;
    }
  }

  // 2. Determine Priority
  let assessedPriority = 'Medium'; // default baseline
  
  for (const pRule of PRIORITY_RULES) {
    const matches = pRule.keywords.filter(kw => text.includes(kw));
    if (matches.length >= pRule.minMatches) {
      assessedPriority = pRule.priority;
      break; // highest matching priority rule in order
    }
  }

  // 3. Compute Confidence
  let confidence = 0.75;
  if (matchedKeywords.length > 0) {
    confidence = Math.min(0.98, 0.80 + (matchedKeywords.length * 0.05));
  } else {
    confidence = 0.70;
  }

  // 4. Generate Summary
  const summary = matchedKeywords.length > 0
    ? `Rule-based triage categorized as ${bestCategory} (${assessedPriority} priority) based on identified key triggers: "${matchedKeywords.slice(0, 3).join(', ')}".`
    : `Standard triage categorized as ${bestCategory} with default ${assessedPriority} priority based on general inquiry patterns.`;

  return {
    category: bestCategory,
    priority: assessedPriority,
    summary,
    confidence: Number(confidence.toFixed(2)),
  };
};

module.exports = {
  analyzeTicket,
};
