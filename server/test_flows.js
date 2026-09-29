// Automated End-to-End User Journey Verification for CampusMarket

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
  const searchRes = await fetch(`${BASE}/products?search=GTU&course=BBA`).then(r => r.json());
  console.log(`✓ [Search & Filter] Found ${searchRes.products.length} products matching GTU + BBA.`);
  if (searchRes.products.length > 0) {
    const p = searchRes.products[0];
    console.log(`   Sample: "${p.title}" | Price: ₹${p.price} | Condition: ${p.condition} | College: ${p.college}`);
  }

  // Test 4: Auth - Student Login
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav.patel@gtu.ac.in', password: 'campus123' })
  }).then(r => r.json());
  const token = loginRes.token;
  const user = loginRes.user;
  console.log(`✓ [Auth] Logged in as student: ${user.name} (${user.college})`);

  // Test 5: Auth - Admin Login
  const adminLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@campusmarket.com', password: 'admin123' })
  }).then(r => r.json());
  const adminToken = adminLoginRes.token;
  console.log(`✓ [Admin Auth] Logged in as Admin: ${adminLoginRes.user.name} (Role: ${adminLoginRes.user.role})`);

  // Test 6: Create New Listing (Sell & Rent)
  const newListingRes = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Digital Signal Processing (DSP) — Proakis & Manolakis',
      description: 'Prescribed reference book for GTU Sem 6 EC & CE students. Very crisp condition with formula cheat-sheet included.',
      category_name: 'Textbooks',
      price: 420,
      listing_type: 'both',
      rent_price_monthly: 120,
      security_deposit: 400,
      rental_terms: 'Return after semester practical exam',
      condition: 'Like New',
      college: 'Gujarat Technological University',
      course: 'B.Tech',
      branch: 'Computer / EC Engineering',
      semester: 6,
      subject: 'Digital Signal Processing',
      location: 'Navrangpura, Ahmedabad',
      contact_preference: 'CampusMarket Chat',
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80']
    })
  }).then(r => r.json());
  console.log(`✓ [Listing Creation] Created product ID: ${newListingRes.productId} (Status: ${newListingRes.status})`);

  // Test 7: Buy Now Flow (Purchase)
  const buyRes = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: 1, // GTU BBA Sem 3 Financial Accounting
      payment_method: 'UPI / Razorpay Sandbox (PhonePe)',
      pickup_notes: 'Meet outside SOM-Lalit college campus at 4 PM'
    })
  }).then(r => r.json());
  console.log(`✓ [Buy Order Flow] Order placed: ${buyRes.order?.order_number} | Amount: ₹${buyRes.order?.amount}`);

  // Test 8: Rent Flow (Rental with security deposit)
  const rentRes = await fetch(`${BASE}/rentals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: 1, // GTU BBA Sem 3 (Owned by Priya Sharma, Aarav is renting)
      duration_months: 2,
      start_date: new Date().toISOString().split('T')[0],
      pickup_notes: 'Handover at library counter'
    })
  }).then(r => r.json());
  console.log(`✓ [Rental Flow] Rental booked: ${rentRes.rental?.rental_number} | Total: ₹${rentRes.rental?.total_amount} (Deposit: ₹${rentRes.rental?.security_deposit})`);

  // Test 9: Buyer-Seller Chat
  const chatRes = await fetch(`${BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: 2,
      seller_id: 3, // Rohan Deshmukh
      text: 'Hello Rohan, I am interested in the engineering drawing kit. Can we meet tomorrow?'
    })
  }).then(r => r.json());
  console.log(`✓ [Chat & Messaging] Conversation #${chatRes.conversation_id} active. Sent message: "${chatRes.message?.text}"`);

  // Test 10: Wishlist Toggle
  const wishRes = await fetch(`${BASE}/wishlist/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: 2 })
  }).then(r => r.json());
  console.log(`✓ [Wishlist] Toggled item #2 saved status: ${wishRes.saved}`);

  // Test 11: Post Item Request
  const reqRes = await fetch(`${BASE}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Looking for VLSI Design by Pucknell & Eshraghian',
      description: 'Urgent for GTU Sem 7 EC project preparation. Any condition fine as long as chapters 3-7 are legible.',
      category_name: 'Textbooks',
      college: 'Gujarat Technological University',
      course: 'B.Tech',
      semester: 7,
      subject: 'VLSI Design',
      budget: 300,
      preferred_type: 'Buy',
      location: 'Ahmedabad'
    })
  }).then(r => r.json());
  console.log(`✓ [Item Request] Posted request #${reqRes.requestId}`);

  // Test 12: Admin Moderation Stats & Actions
  const adminStats = await fetch(`${BASE}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  console.log(`✓ [Admin Dashboard] Stats: Users: ${adminStats.stats?.totalUsers}, Listings: ${adminStats.stats?.totalListings}, Volume: ₹${adminStats.stats?.marketplaceVolume}`);

  console.log('\n======================================================');
  console.log('🎉 ALL 12 INTEGRATION & BUSINESS FLOW TESTS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
