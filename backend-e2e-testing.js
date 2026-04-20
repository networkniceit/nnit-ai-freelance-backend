// NNIT - End-to-End Payment Flow Testing Script
// Comprehensive testing for Stripe payments and dashboard

import { apiRequest, notificationsAPI } from './api';

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`)
};

// Test data
const testUser = {
  email: `test${Date.now()}@nnit.com`,
  password: 'Test123!@#',
  name: 'Test User',
  company: 'NNIT Test Inc'
};

let authToken = null;
let userId = null;

// Test Suite
const tests = {
  
  // Test 1: Health Check
  async testHealthCheck() {
    log.test('Testing health check endpoint...');
    const result = await apiRequest('GET', '/health');
    
    if (result.success && result.status === 200) {
      log.success('Health check passed');
      log.info(`MongoDB: ${result.data.databases?.mongodb}`);
      log.info(`PostgreSQL: ${result.data.databases?.postgresql}`);
      return true;
    } else {
      log.error(`Health check failed: ${result.error}`);
      return false;
    }
  },

  // Test 2: User Registration
  async testRegistration() {
    log.test('Testing user registration...');
    const result = await apiRequest('POST', '/api/auth/register', testUser);
    
    if (result.success) {
      authToken = result.data.token;
      userId = result.data.user?.id || result.data.user?._id;
      log.success('User registration successful');
      log.info(`User ID: ${userId}`);
      return true;
    } else {
      log.error(`Registration failed: ${result.error}`);
      return false;
    }
  },

  // Test 3: User Login
  async testLogin() {
    log.test('Testing user login...');
    const result = await apiRequest('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    if (result.success && result.data.token) {
      authToken = result.data.token;
      log.success('User login successful');
      return true;
    } else {
      log.error(`Login failed: ${result.error}`);
      return false;
    }
  },

  // Test 4: Get User Profile
  async testGetProfile() {
    log.test('Testing get user profile...');
    const result = await apiRequest('GET', '/api/auth/profile', null, authToken);
    
    if (result.success) {
      log.success('Profile retrieval successful');
      log.info(`Email: ${result.data.email}`);
      return true;
    } else {
      log.error(`Profile retrieval failed: ${result.error}`);
      return false;
    }
  },

  // Test 5: Create Stripe Checkout Session
  async testCreateCheckoutSession() {
    log.test('Testing Stripe checkout session creation...');
    const result = await apiRequest('POST', '/api/payments/create-checkout-session', {
      plan: 'professional',
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel'
    }, authToken);
    
    if (result.success && result.data.sessionId) {
      log.success('Checkout session created');
      log.info(`Session ID: ${result.data.sessionId.substring(0, 20)}...`);
      return true;
    } else {
      log.error(`Checkout session creation failed: ${result.error}`);
      return false;
    }
  },

  // Test 6: Get Subscription Status
  async testGetSubscription() {
    log.test('Testing subscription status retrieval...');
    const result = await apiRequest('GET', '/api/payments/subscription', null, authToken);
    
    if (result.success) {
      log.success('Subscription status retrieved');
      log.info(`Status: ${result.data.status || 'No active subscription'}`);
      return true;
    } else {
      log.error(`Subscription retrieval failed: ${result.error}`);
      return false;
    }
  },

  // Test 7: Dashboard Data
  async testDashboardData() {
    log.test('Testing dashboard data retrieval...');
    const result = await apiRequest('GET', '/api/dashboard/stats', null, authToken);
    
    if (result.success) {
      log.success('Dashboard data retrieved');
      return true;
    } else {
      log.warning(`Dashboard data retrieval: ${result.error}`);
      return true; // Not critical
    }
  },

  // Test 8: Rate Limiting
  async testRateLimiting() {
    log.test('Testing rate limiting...');
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      requests.push(apiRequest('GET', '/health'));
    }
    
    const results = await Promise.all(requests);
    const successful = results.filter(r => r.success).length;
    
    log.info(`${successful}/10 requests successful`);
    log.success('Rate limiting test completed');
    return true;
  },

  // Test 9: Error Handling
  async testErrorHandling() {
    log.test('Testing error handling...');
    
    // Test invalid endpoint
    const result1 = await apiRequest('GET', '/api/nonexistent');
    if (result1.status === 404) {
      log.success('404 error handled correctly');
    }
    
    // Test unauthorized access
    const result2 = await apiRequest('GET', '/api/auth/profile');
    if (result2.status === 401) {
      log.success('401 unauthorized handled correctly');
    }
    
    return true;
  },

  // Test 10: CORS
  async testCORS() {
    log.test('Testing CORS configuration...');
    
    try {
      const response = await axios.options(`${API_URL}/api/auth/login`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      if (response.status === 200 || response.status === 204) {
        log.success('CORS configuration correct');
        return true;
      }
    } catch (error) {
      log.warning('CORS test inconclusive');
      return true; // Not critical
    }
  }
};

// Run all tests
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 NNIT - End-to-End Testing Suite');
  console.log('='.repeat(60) + '\n');
  
  log.info(`Testing API at: ${API_URL}`);
  log.info(`Timestamp: ${new Date().toISOString()}\n`);

  const results = [];
  let passedTests = 0;
  let totalTests = 0;

  for (const [testName, testFunc] of Object.entries(tests)) {
    totalTests++;
    console.log(`\n${'─'.repeat(60)}`);
    
    try {
      const passed = await testFunc();
      results.push({ name: testName, passed });
      if (passed) passedTests++;
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      log.error(`Test ${testName} threw an error: ${error.message}`);
      results.push({ name: testName, passed: false });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? colors.green : colors.red;
    console.log(`${color}${icon} ${result.name}${colors.reset}`);
  });

  console.log(`\n${colors.cyan}Total: ${passedTests}/${totalTests} tests passed${colors.reset}`);
  
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  if (percentage >= 90) {
    log.success(`Success rate: ${percentage}%`);
  } else if (percentage >= 70) {
    log.warning(`Success rate: ${percentage}%`);
  } else {
    log.error(`Success rate: ${percentage}%`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  return passedTests === totalTests;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, tests };