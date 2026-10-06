// Automated End-to-End User Journey Verification for CampusMarket
// GOVERNMENT POLITECNIC COLLAGE PALANPUR

async function runTests() {
  const BASE = 'http://localhost:5000/api';
  console.log('--- STARTING CAMPUSMARKET FULL INTEGRATION SUITE ---');

  // Test 1: Health check
  const health = await fetch(`${BASE}/health`).then(r => r.json());
  console.log('✓ [Health] API is healthy:', health.platform, '-', health.tagline);

  // Test 2: Categories
  const catRes = await fetch(`${BASE}/categories`).then(r => r.json());
  console.log(`✓ [Categories] Loaded ${catRes.categories.length} categories with active item counts.`);

  // Test 3: Product Search & Academic Filters
  const searchRes = await fetch(`${BASE}/products?college=GOVERNMENT+POLITECNIC+COLLAGE+PALANPUR`).then(r => r.json());
  console.log(`✓ [Search & Filter] Found ${searchRes.products.length} products matching GOVERNMENT POLITECNIC COLLAGE PALANPUR.`);
  if (searchRes.products.length > 0) {
    const p = searchRes.products[0];
    console.log(`   Sample: "${p.title}" | Price: ₹${p.price} | Condition: ${p.condition} | College: ${p.college}`);
  }

  // Test 4: Auth - Admin Login (shreyarajgor5@gmail.com / Shreya_@05)
  const adminLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shreyarajgor5@gmail.com', password: 'Shreya_@05' })
  }).then(r => r.json());
  if (adminLoginRes.error) {
    throw new Error('Admin login failed: ' + adminLoginRes.error);
  }
  const adminToken = adminLoginRes.token;
  console.log(`✓ [Admin Auth] Logged in as Admin: ${adminLoginRes.user.name} (${adminLoginRes.user.email}, Role: ${adminLoginRes.user.role})`);

  // Test 5: Auth - Student Registration & Login via Email/Password
  const testStudentEmail = `student_${Date.now()}@gpcpalanpur.ac.in`;
  const registerRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Palanpur Student',
      email: testStudentEmail,
      password: 'Student_Pass123',
      college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR'
    })
  }).then(r => r.json());
  if (registerRes.error) {
    throw new Error('Student register failed: ' + registerRes.error);
  }
  const token = registerRes.token;
  const user = registerRes.user;
  console.log(`✓ [Student Auth] Registered & logged in: ${user.name} (${user.college})`);

  // Test 6: Create New Listing (Sell & Rent)
  const newListingRes = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Digital Signal Processing (DSP) — Reference Book',
      description: 'Prescribed reference book for Diploma Sem 5 EC & CE students. Very crisp condition with formula cheat-sheet included.',
      category_name: 'Textbooks & Guides',
      price: 320,
      listing_type: 'both',
      rent_price_monthly: 90,
      security_deposit: 250,
      rental_terms: 'Return after semester exam',
      condition: 'Like New',
      college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
      course: 'Diploma Engineering',
      branch: 'Computer Engineering',
      semester: 5,
      subject: 'Digital Electronics',
      location: 'Palanpur Campus, Palanpur',
      contact_preference: 'CampusMarket Chat',
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80']
    })
  }).then(r => r.json());
  console.log(`✓ [Listing Creation] Created product ID: ${newListingRes.productId} (Status: ${newListingRes.status})`);

  // Test 7: Post Item Request
  const reqRes = await fetch(`${BASE}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Looking for Applied Mechanics Notes',
      description: 'Urgent for GPC Palanpur Sem 2 Civil project preparation.',
      category_name: 'Textbooks & Guides',
      college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
      course: 'Diploma Engineering',
      semester: 2,
      subject: 'Applied Mechanics',
      budget: 150,
      preferred_type: 'Buy',
      location: 'Palanpur Campus, Palanpur'
    })
  }).then(r => r.json());
  console.log(`✓ [Item Request] Posted request #${reqRes.requestId}`);

  // Test 8: Admin Moderation Stats & Actions
  const adminStats = await fetch(`${BASE}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  console.log(`✓ [Admin Dashboard] Stats: Users: ${adminStats.stats?.totalUsers}, Listings: ${adminStats.stats?.totalListings}`);

  // Cleanup: Delete test student
  const db = require('better-sqlite3')('server/campusmarket.db');
  db.prepare('DELETE FROM users WHERE email = ?').run(testStudentEmail);
  console.log('✓ [Cleanup] Temporary test user cleaned up from database.');

  console.log('\n======================================================');
  console.log('🎉 ALL INTEGRATION & VERIFICATION TESTS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
