const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'campusmarket.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'student', -- 'student' or 'admin'
      college TEXT,
      course TEXT,
      branch TEXT,
      semester INTEGER,
      location TEXT,
      bio TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active', -- 'active', 'suspended'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      description TEXT,
      item_count INTEGER DEFAULT 0
    );
  `);

  // 3. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      category_name TEXT,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      price REAL NOT NULL,
      listing_type TEXT NOT NULL DEFAULT 'sell', -- 'sell', 'rent', 'both'
      rent_price_monthly REAL,
      security_deposit REAL,
      rental_terms TEXT,
      condition TEXT NOT NULL, -- 'New', 'Like New', 'Good', 'Fair', 'Used'
      
      -- Academic metadata
      college TEXT,
      course TEXT,
      branch TEXT,
      semester INTEGER,
      subject TEXT,
      edition TEXT,
      isbn TEXT,
      author TEXT,

      location TEXT NOT NULL,
      availability TEXT DEFAULT 'available', -- 'available', 'sold', 'rented', 'reserved'
      contact_preference TEXT DEFAULT 'CampusMarket Chat', -- 'CampusMarket Chat', 'Phone', 'WhatsApp'
      status TEXT DEFAULT 'active', -- 'pending_approval', 'active', 'rejected'
      rejection_reason TEXT,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Product Images Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Wishlist Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );
  `);

  // 6. Item Requests Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category_name TEXT,
      college TEXT,
      course TEXT,
      semester INTEGER,
      subject TEXT,
      budget REAL,
      preferred_type TEXT DEFAULT 'Buy', -- 'Buy', 'Rent', 'Any'
      location TEXT NOT NULL,
      required_by_date TEXT,
      status TEXT DEFAULT 'open', -- 'open', 'fulfilled', 'cancelled'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(id),
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'UPI / CampusPay',
      payment_status TEXT DEFAULT 'paid', -- 'pending_pickup', 'paid', 'refunded'
      order_status TEXT DEFAULT 'confirmed', -- 'confirmed', 'pending_pickup', 'completed', 'cancelled'
      pickup_notes TEXT,
      transaction_id TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Rentals Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rental_number TEXT UNIQUE NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(id),
      renter_id INTEGER NOT NULL REFERENCES users(id),
      owner_id INTEGER NOT NULL REFERENCES users(id),
      monthly_rent REAL NOT NULL,
      security_deposit REAL NOT NULL,
      duration_months INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'UPI / CampusPay',
      payment_status TEXT DEFAULT 'paid', -- 'pending_pickup', 'paid', 'deposit_refunded'
      rental_status TEXT DEFAULT 'active', -- 'requested', 'confirmed', 'active', 'returned', 'completed', 'cancelled', 'pending_pickup'
      deposit_status TEXT DEFAULT 'held', -- 'held', 'refunded', 'claimed'
      pickup_notes TEXT,
      transaction_id TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Conversations & Messages Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      product_id INTEGER REFERENCES products(id),
      last_message TEXT,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(buyer_id, seller_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      recipient_id INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'message', 'order', 'rental', 'approval', 'review', 'system'
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. Reviews Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      product_id INTEGER REFERENCES products(id),
      order_id INTEGER REFERENCES orders(id),
      rental_id INTEGER REFERENCES rentals(id),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. Reports Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      target_type TEXT NOT NULL, -- 'product', 'user', 'message'
      target_id INTEGER NOT NULL,
      target_title TEXT,
      reason TEXT NOT NULL, -- 'Fake listing', 'Scam/fraud', 'Wrong information', 'Inappropriate content', 'Prohibited item', 'Duplicate listing', 'Harassment', 'Other'
      details TEXT,
      status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
      admin_action TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 13. System Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Safe migrations for student verification columns
  try {
    db.exec("ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'verified'");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN id_card_image TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN verification_reason TEXT DEFAULT ''");
  } catch (e) {}

  // Safe migrations for orders & rentals payment tracking & escrow
  try {
    db.exec("ALTER TABLE orders ADD COLUMN transaction_id TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE orders ADD COLUMN utr_number TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE orders ADD COLUMN escrow_status TEXT DEFAULT 'held'");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE rentals ADD COLUMN transaction_id TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE rentals ADD COLUMN utr_number TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE rentals ADD COLUMN escrow_status TEXT DEFAULT 'held'");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE rentals ADD COLUMN payment_method TEXT DEFAULT 'CampusMarket UPI QR'");
  } catch (e) {}

  // Seed default settings if not exists
  const existingApproval = db.prepare('SELECT value FROM settings WHERE key = ?').get('require_approval');
  if (!existingApproval) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('require_approval', 'false');
  }

  const existingUpi = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_upi_id');
  if (!existingUpi) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('admin_upi_id', 'campusmarket@upi');
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('admin_upi_name', 'CampusMarket Escrow Account');
  }

  // Ensure Admin account exists for Shreya Rajgor and purge legacy demo accounts
  let adminId = 1;
  try {
    const adminEmail = 'shreyarajgor5@gmail.com';
    const adminPasswordHash = bcrypt.hashSync('Shreya_@05', 10);
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!existingAdmin) {
      const ins = db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, college, course, branch, semester, location, bio, avatar, verification_status, status)
        VALUES ('Shreya Rajgor', ?, '+91 98765 43210', ?, 'admin', 'GOVERNMENT POLITECNIC COLLAGE PALANPUR', 'Polytechnic Engineering', 'All Branches', 0, 'Palanpur, Gujarat', 'Official Administrator - Government Polytechnic College Palanpur', 'https://api.dicebear.com/7.x/initials/svg?seed=Shreya%20Rajgor&backgroundColor=0f766e', 'verified', 'active')
      `).run(adminEmail, adminPasswordHash);
      adminId = ins.lastInsertRowid;
    } else {
      adminId = existingAdmin.id;
      db.prepare("UPDATE users SET password_hash = ?, role = 'admin', name = 'Shreya Rajgor', college = 'GOVERNMENT POLITECNIC COLLAGE PALANPUR', verification_status = 'verified', status = 'active' WHERE id = ?").run(adminPasswordHash, adminId);
    }

    // Purge legacy demo user accounts
    db.pragma('foreign_keys = OFF');
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM rentals').run();
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM reviews').run();
    db.prepare('DELETE FROM notifications WHERE user_id != ?').run(adminId);
    db.prepare('DELETE FROM wishlist WHERE user_id != ?').run(adminId);
    db.prepare('DELETE FROM users WHERE id != ?').run(adminId);
    db.pragma('foreign_keys = ON');
  } catch (e) {
    console.error('Admin sync notice:', e.message);
  }

  // Always seed products if missing
  seedInitialData(adminId);
}

function seedInitialData(adminId = 1) {
  // 1. Ensure categories exist
  const categories = [
    { name: 'Textbooks', slug: 'textbooks', icon: 'BookOpen', description: 'Academic books for all universities and semesters' },
    { name: 'Notes', slug: 'notes', icon: 'FileText', description: 'Handwritten notes, solved papers & question banks' },
    { name: 'Lab Equipment', slug: 'lab-equipment', icon: 'FlaskConical', description: 'Lab coats, dissection kits, breadboards & glassware' },
    { name: 'Calculators', slug: 'calculators', icon: 'Calculator', description: 'Scientific & graphic calculators for engineering & commerce' },
    { name: 'Electronics', slug: 'electronics', icon: 'Laptop', description: 'Monitors, mice, keyboards, Arduino kits & chargers' },
    { name: 'Furniture', slug: 'furniture', icon: 'Armchair', description: 'Study tables, ergonomic chairs & storage racks' },
    { name: 'Hostel Items', slug: 'hostel-items', icon: 'Home', description: 'Kettles, desk lamps, mattress toppers & iron boxes' },
    { name: 'Stationery', slug: 'stationery', icon: 'PenTool', description: 'Engineering drafter, drawing sheets & geometry sets' },
    { name: 'Project Materials', slug: 'project-materials', icon: 'Cpu', description: 'Sensors, motors, microcontrollers & 3D printed parts' }
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, slug, icon, description, item_count) VALUES (@name, @slug, @icon, @description, 0)
  `);
  categories.forEach(cat => insertCategory.run(cat));

  const activeProductCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'").get().count;
  if (activeProductCount < 10) {
    console.log('Seeding the 10 core student products for GOVERNMENT POLITECNIC COLLAGE PALANPUR...');

    db.pragma('foreign_keys = OFF');
    db.prepare('DELETE FROM product_images').run();
    db.prepare('DELETE FROM products').run();
    db.pragma('foreign_keys = ON');

    // 3. Seed Realistic Indian Student Products
    const products = [
      {
        title: 'Diploma Semester 3 Financial Accounting Textbook',
        description: 'Prescribed textbook for Financial Accounting Sem 3. Covers Company Accounts, Valuation of Goodwill, and Shares. Very neat condition, lightly underlined with pencil only. Includes solved exam papers from past 3 years at the back.',
        category_name: 'Textbooks',
        seller_id: Number(adminId),
        price: 320,
        listing_type: 'both',
        rent_price_monthly: 100,
        security_deposit: 300,
        rental_terms: 'Available for semester rental. Please return without water damage or pen markings.',
        condition: 'Good',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'Management & Commerce',
        semester: 3,
        subject: 'Financial Accounting',
        edition: '5th Revised Edition',
        author: 'Dr. P. C. Tulsian',
        isbn: '978-9352834567',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Higher Engineering Mathematics — B.S. Grewal (44th Edition)',
        description: 'Essential for all engineering mathematics (Sem 1, 2 & 3). Hardcover edition. No missing pages, binding is 100% solid.',
        category_name: 'Textbooks',
        seller_id: Number(adminId),
        price: 580,
        listing_type: 'sell',
        rent_price_monthly: 0,
        security_deposit: 0,
        rental_terms: '',
        condition: 'Like New',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'All Branches (Common)',
        semester: 1,
        subject: 'Engineering Mathematics',
        edition: '44th Edition',
        author: 'Dr. B.S. Grewal',
        isbn: '978-8193328491',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: '/uploads/bs_grewal_44th_edition.jpg'
      },
      {
        title: 'Casio FX-991EX Classwiz Scientific Calculator (552 Functions)',
        description: 'Original Casio fx-991EX Classwiz with high-resolution natural textbook display. Allowed in semester exams. Has solar backup + battery. Comes with protective slide-on hard case and user quick card.',
        category_name: 'Calculators',
        seller_id: Number(adminId),
        price: 1100,
        listing_type: 'both',
        rent_price_monthly: 250,
        security_deposit: 1000,
        rental_terms: 'Great if you only need it for final exams month! Fully tested and working.',
        condition: 'Like New',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'Engineering & Sciences',
        semester: 2,
        subject: 'Applied Mathematics & Statistics',
        edition: 'FX-991EX',
        author: 'Casio India',
        isbn: '',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Omega Engineering Mini Drafter + Drawing Board & Clips',
        description: 'Complete Engineering Drawing kit including heavy-duty mini drafter with steel rod, clamp, 360-degree protractor head, 0.5mm clutch pencil, set squares, and roll-up carrying case. Perfect for 1st Year Engineering Graphics / Drawing.',
        category_name: 'Stationery',
        seller_id: Number(adminId),
        price: 490,
        listing_type: 'both',
        rent_price_monthly: 150,
        security_deposit: 500,
        rental_terms: 'Can rent for the whole 1st semester. Save money compared to buying brand new at stationery shop.',
        condition: 'Good',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'Mechanical & Civil',
        semester: 1,
        subject: 'Engineering Graphics & Design (EGD)',
        edition: 'Standard Issue',
        author: 'Omega Stationery',
        isbn: '',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: '100% Cotton White Lab Coat (Size 38 / M) + Safety Goggles',
        description: 'Required for Chemistry Lab, Biology & Material Testing practicals. Thick premium cotton fabric with 3 utility pockets. Washed and sanitized. Free transparent safety goggles included.',
        category_name: 'Lab Equipment',
        seller_id: Number(adminId),
        price: 240,
        listing_type: 'sell',
        rent_price_monthly: 0,
        security_deposit: 0,
        rental_terms: '',
        condition: 'Good',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'Chemical / Mechanical / Civil',
        semester: 1,
        subject: 'Engineering Chemistry & Workshop Lab',
        edition: '',
        author: '',
        isbn: '',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Arduino Uno R3 Ultimate Starter Kit (Sensors, Motors, LCD)',
        description: 'Used for IoT / Embedded Systems mini project. Includes original Arduino Uno board, breadboard, 40+ jumper wires, ultrasonic sensor, IR sensor, 16x2 LCD display, servo motor, stepper motor, RFID reader with tags, and resistors kit in plastic organizer box.',
        category_name: 'Project Materials',
        seller_id: Number(adminId),
        price: 850,
        listing_type: 'both',
        rent_price_monthly: 300,
        security_deposit: 800,
        rental_terms: 'Ideal for semester project submissions! All components tested and working.',
        condition: 'Like New',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'Computer / IT / Electrical',
        semester: 5,
        subject: 'Microprocessors & IoT',
        edition: 'Rev 3',
        author: 'RoboCraze / Arduino',
        isbn: '',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Compact Wooden Study Table with Bookshelf for Hostel Room',
        description: 'Engineered wood study desk with 2-tier overhead bookshelf and bottom footrest. Very sturdy, perfect dimensions for hostel rooms. Easily fits a laptop, monitor and open notebooks.',
        category_name: 'Furniture',
        seller_id: Number(adminId),
        price: 1450,
        listing_type: 'both',
        rent_price_monthly: 400,
        security_deposit: 1200,
        rental_terms: 'Minimum 2 months rental. Buyer arranges self-pickup.',
        condition: 'Good',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'All Departments',
        semester: 3,
        subject: 'Hostel Accommodation',
        edition: '',
        author: '',
        isbn: '',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Wipro 10W LED Eye-Care Desk Lamp (Warm & Cool Light)',
        description: 'Rechargeable LED study lamp with 3 color temperatures (warm, natural, cool white) and dimmable touch control. Flexible gooseneck arm. Built-in 2000mAh battery provides backup during hostel power cuts.',
        category_name: 'Hostel Items',
        seller_id: Number(adminId),
        price: 420,
        listing_type: 'sell',
        rent_price_monthly: 0,
        security_deposit: 0,
        rental_terms: '',
        condition: 'Like New',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'All',
        semester: 2,
        subject: 'Hostel Essentials',
        edition: '',
        author: 'Wipro Smart',
        isbn: '',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Dell 22-inch Full HD IPS Monitor (HDMI + VGA with Stand)',
        description: 'Dell SE2219HX 21.5-inch 1080p 60Hz monitor. Ultra-thin bezel, IPS panel with great viewing angles. Perfect for coding, online classes, and lectures. Comes with HDMI cable and power cord.',
        category_name: 'Electronics',
        seller_id: Number(adminId),
        price: 3600,
        listing_type: 'both',
        rent_price_monthly: 600,
        security_deposit: 3000,
        rental_terms: 'Monthly rent for semester use. Zero dead pixels, inspected before handover.',
        condition: 'Like New',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'Computer / IT',
        semester: 6,
        subject: 'Practical Coding / Lab',
        edition: 'Dell SE Series',
        author: 'Dell India',
        isbn: '',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Diploma Semester 2 Hand-Written Topper Notes (All Subjects)',
        description: 'Spiral-bound high quality Xerox copies of verified topper notes. Includes diagrammatic charts, bullet summaries, and previous years solved questions.',
        category_name: 'Notes',
        seller_id: Number(adminId),
        price: 350,
        listing_type: 'sell',
        rent_price_monthly: 0,
        security_deposit: 0,
        rental_terms: '',
        condition: 'Like New',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        branch: 'All Branches',
        semester: 2,
        subject: 'Applied Sciences & Basic Engineering',
        edition: 'Exam Edition',
        author: 'GPC Palanpur Study Circle',
        isbn: '',
        location: 'Palanpur Campus, Palanpur',
        availability: 'available',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'
      }
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (
        title, description, category_name, seller_id, price, listing_type,
        rent_price_monthly, security_deposit, rental_terms, condition,
        college, course, branch, semester, subject, edition, author, isbn,
        location, availability, status
      ) VALUES (
        @title, @description, @category_name, @seller_id, @price, @listing_type,
        @rent_price_monthly, @security_deposit, @rental_terms, @condition,
        @college, @course, @branch, @semester, @subject, @edition, @author, @isbn,
        @location, @availability, @status
      )
    `);

    const insertImage = db.prepare(`
      INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)
    `);

    products.forEach(prod => {
      const img = prod.image;
      delete prod.image;
      const info = insertProduct.run(prod);
      insertImage.run(info.lastInsertRowid, img);
    });

    // 4. Seed Requests
    const requests = [
      {
        user_id: Number(adminId),
        title: 'Need Machine Learning & Data Mining Textbook',
        description: 'Looking for Machine Learning reference textbook or notes for upcoming semester exams.',
        category_name: 'Textbooks',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        semester: 6,
        subject: 'Machine Learning',
        budget: 350,
        preferred_type: 'Buy',
        location: 'Palanpur Campus, Palanpur',
        required_by_date: '2026-10-15',
        status: 'open'
      },
      {
        user_id: Number(adminId),
        title: 'Looking for ergonomic study chair on rent for 3 months',
        description: 'Preparing for exams in hostel room and need a comfortable back-support desk chair.',
        category_name: 'Furniture',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        semester: 4,
        subject: 'Hostel Study',
        budget: 900,
        preferred_type: 'Rent',
        location: 'Palanpur Campus, Palanpur',
        required_by_date: '2026-10-05',
        status: 'open'
      },
      {
        user_id: Number(adminId),
        title: 'Urgent: Casio FX-991ES or EX Calculator for semester exams',
        description: 'Lost my scientific calculator right before mid-sems. Need one urgently within 2 days on campus.',
        category_name: 'Calculators',
        college: 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
        course: 'Diploma Engineering',
        semester: 5,
        subject: 'Applied Mathematics',
        budget: 800,
        preferred_type: 'Buy',
        location: 'Palanpur Campus, Palanpur',
        required_by_date: '2026-10-02',
        status: 'open'
      }
    ];

    const insertRequest = db.prepare(`
      INSERT INTO requests (
        user_id, title, description, category_name, college, course, semester,
        subject, budget, preferred_type, location, required_by_date, status
      ) VALUES (
        @user_id, @title, @description, @category_name, @college, @course, @semester,
        @subject, @budget, @preferred_type, @location, @required_by_date, @status
      )
    `);
    requests.forEach(req => insertRequest.run(req));

    console.log('CampusMarket database seeded successfully for GOVERNMENT POLITECNIC COLLAGE PALANPUR!');
  }

  // Update categories item counts and prune categories that have 0 products
  db.prepare(`
    UPDATE categories SET item_count = (
      SELECT COUNT(*) FROM products WHERE category_name = categories.name AND status = 'active'
    )
  `).run();

  db.prepare(`
    DELETE FROM categories WHERE (
      SELECT COUNT(*) FROM products WHERE category_name = categories.name AND status = 'active'
    ) = 0
  `).run();
}

// Automatically ensure schema & safe migrations are applied
initDatabase();

module.exports = {
  db,
  initDatabase
};
