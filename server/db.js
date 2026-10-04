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
      payment_method TEXT DEFAULT 'UPI / Razorpay Sandbox',
      payment_status TEXT DEFAULT 'paid', -- 'pending', 'paid', 'refunded'
      order_status TEXT DEFAULT 'confirmed', -- 'confirmed', 'pending_pickup', 'completed', 'cancelled'
      pickup_notes TEXT,
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
      payment_status TEXT DEFAULT 'paid', -- 'pending', 'paid', 'deposit_refunded'
      rental_status TEXT DEFAULT 'active', -- 'requested', 'confirmed', 'active', 'returned', 'completed', 'cancelled'
      deposit_status TEXT DEFAULT 'held', -- 'held', 'refunded', 'claimed'
      pickup_notes TEXT,
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

  // Seed default settings if not exists
  const existingApproval = db.prepare('SELECT value FROM settings WHERE key = ?').get('require_approval');
  if (!existingApproval) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('require_approval', 'false'); // Default false so demo is immediately accessible, but admin can toggle anytime
  }

  // Seed database if users count is 0
  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial CampusMarket database...');

  // 1. Seed Categories
  const categories = [
    { name: 'Textbooks', slug: 'textbooks', icon: 'BookOpen', description: 'Academic books for all universities and semesters' },
    { name: 'Notes', slug: 'notes', icon: 'FileText', description: 'Handwritten notes, solved papers & question banks' },
    { name: 'Lab Equipment', slug: 'lab-equipment', icon: 'FlaskConical', description: 'Lab coats, dissection kits, breadboards & glassware' },
    { name: 'Calculators', slug: 'calculators', icon: 'Calculator', description: 'Scientific & graphic calculators for engineering & commerce' },
    { name: 'Electronics', slug: 'electronics', icon: 'Laptop', description: 'Monitors, mice, keyboards, Arduino kits & chargers' },
    { name: 'Furniture', slug: 'furniture', icon: 'Armchair', description: 'Study tables, ergonomic chairs & storage racks' },
    { name: 'Hostel Items', slug: 'hostel-items', icon: 'Home', description: 'Kettles, desk lamps, mattress toppers & iron boxes' },
    { name: 'Stationery', slug: 'stationery', icon: 'PenTool', description: 'Engineering drafter, drawing sheets & geometry sets' },
    { name: 'Bags', slug: 'bags', icon: 'Briefcase', description: 'College backpacks, laptop bags & gym sacks' },
    { name: 'Clothing / Accessories', slug: 'clothing', icon: 'Shirt', description: 'College blazers, aprons, lab coats & formal wear' },
    { name: 'Project Materials', slug: 'project-materials', icon: 'Cpu', description: 'Sensors, motors, microcontrollers & 3D printed parts' },
    { name: 'Sports Equipment', slug: 'sports', icon: 'Trophy', description: 'Badminton rackets, cricket bats & football gear' },
    { name: 'Other Student Items', slug: 'other', icon: 'Package', description: 'Bicycles, musical instruments & miscellaneous items' }
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, icon, description) VALUES (@name, @slug, @icon, @description)
  `);
  categories.forEach(cat => insertCategory.run(cat));

  // 2. Seed Users (Admin & Students)
  const passwordHash = bcrypt.hashSync('campus123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, college, course, branch, semester, location, bio, avatar)
    VALUES (@name, @email, @phone, @password_hash, @role, @college, @course, @branch, @semester, @location, @bio, @avatar)
  `);

  insertUser.run({
    name: 'CampusMarket Admin',
    email: 'admin@campusmarket.com',
    phone: '+91 98765 43210',
    password_hash: adminPasswordHash,
    role: 'admin',
    college: 'Gujarat Technological University',
    course: 'Administration',
    branch: 'Management',
    semester: 0,
    location: 'Ahmedabad, Gujarat',
    bio: 'Official CampusMarket platform administrator and student safety moderator.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  });

  const student1 = insertUser.run({
    name: 'Aarav Patel',
    email: 'aarav.patel@gtu.ac.in',
    phone: '+91 98250 11223',
    password_hash: passwordHash,
    role: 'student',
    college: 'Gujarat Technological University (LD College of Engg)',
    course: 'B.Tech',
    branch: 'Computer Engineering',
    semester: 6,
    location: 'Navrangpura, Ahmedabad',
    bio: 'Final year CE student at LDCE. Selling clean textbooks and electronics before moving for internship.',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80'
  });

  const student2 = insertUser.run({
    name: 'Priya Sharma',
    email: 'priya.sharma@bba.gtu.ac.in',
    phone: '+91 97120 44556',
    password_hash: passwordHash,
    role: 'student',
    college: 'Som-Lalit Institute of Business Administration',
    course: 'BBA',
    branch: 'Finance & Accounts',
    semester: 4,
    location: 'Ellisbridge, Ahmedabad',
    bio: 'BBA semester 4 student. Love keeping my books crisp with sticky notes. Happy to lend or sell!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
  });

  const student3 = insertUser.run({
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@mu.ac.in',
    phone: '+91 98331 77889',
    password_hash: passwordHash,
    role: 'student',
    college: 'VJTI Mumbai (Mumbai University)',
    course: 'B.Tech',
    branch: 'Mechanical Engineering',
    semester: 5,
    location: 'Matunga, Mumbai',
    bio: 'Mechanical engineering enthusiast. Have drafters, lab equipment, and textbooks for junior semesters.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  });

  const student4 = insertUser.run({
    name: 'Ananya Verma',
    email: 'ananya.verma@du.ac.in',
    phone: '+91 98110 33445',
    password_hash: passwordHash,
    role: 'student',
    college: 'SRCC (Delhi University)',
    course: 'B.Com (Hons)',
    branch: 'Commerce',
    semester: 3,
    location: 'North Campus, Delhi',
    bio: 'SRCC 2nd year. Offering topper notes and reference textbooks at student-friendly prices.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
  });

  // 3. Seed Realistic Indian Student Products
  const products = [
    {
      title: 'GTU BBA Semester 3 Financial Accounting Textbook',
      description: 'Standard prescribed textbook for GTU BBA Sem 3. Covers Company Accounts, Valuation of Goodwill, and Shares. Very neat condition, lightly underlined with pencil only. Includes solved university exam papers from past 3 years at the back.',
      category_name: 'Textbooks',
      seller_id: Number(student2.lastInsertRowid),
      price: 320,
      listing_type: 'both',
      rent_price_monthly: 100,
      security_deposit: 300,
      rental_terms: 'Available for semester rental. Please return without water damage or pen markings.',
      condition: 'Good',
      college: 'Gujarat Technological University',
      course: 'BBA',
      branch: 'Management & Finance',
      semester: 3,
      subject: 'Financial Accounting',
      edition: '5th Revised Edition (2023)',
      author: 'Dr. P. C. Tulsian',
      isbn: '978-9352834567',
      location: 'Ellisbridge / Navrangpura, Ahmedabad',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Higher Engineering Mathematics — B.S. Grewal (44th Edition)',
      description: 'The holy grail for all engineering mathematics (Sem 1, 2 & 3). Hardcover edition. No missing pages, binding is 100% solid. Essential for GTU, Mumbai Univ, and VTU engineering students.',
      category_name: 'Textbooks',
      seller_id: Number(student1.lastInsertRowid),
      price: 580,
      listing_type: 'sell',
      rent_price_monthly: 0,
      security_deposit: 0,
      rental_terms: '',
      condition: 'Like New',
      college: 'Gujarat Technological University (GTU)',
      course: 'B.Tech / BE',
      branch: 'All Branches (Common)',
      semester: 1,
      subject: 'Engineering Mathematics',
      edition: '44th Edition',
      author: 'Dr. B.S. Grewal',
      isbn: '978-8193328491',
      location: 'LD College Campus / Navrangpura, Ahmedabad',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Casio FX-991EX Classwiz Scientific Calculator (552 Functions)',
      description: 'Original Casio fx-991EX Classwiz with high-resolution natural textbook display. Allowed in GTU, MU, and Anna University semester exams. Has solar backup + battery. Comes with protective slide-on hard case and user quick card.',
      category_name: 'Calculators',
      seller_id: Number(student1.lastInsertRowid),
      price: 1100,
      listing_type: 'both',
      rent_price_monthly: 250,
      security_deposit: 1000,
      rental_terms: 'Great if you only need it for final exams month! Fully tested and working.',
      condition: 'Like New',
      college: 'Gujarat Technological University',
      course: 'B.Tech / Diploma',
      branch: 'Engineering & Sciences',
      semester: 2,
      subject: 'Applied Mathematics & Statistics',
      edition: 'FX-991EX',
      author: 'Casio India',
      isbn: '',
      location: 'Navrangpura, Ahmedabad',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Omega Engineering Mini Drafter + Drawing Board & Clips',
      description: 'Complete Engineering Drawing kit including heavy-duty mini drafter with steel rod, clamp, 360-degree protractor head, 0.5mm clutch pencil, set squares, and roll-up carrying case. Perfect for 1st Year Engineering Graphics / Drawing.',
      category_name: 'Stationery',
      seller_id: Number(student3.lastInsertRowid),
      price: 490,
      listing_type: 'both',
      rent_price_monthly: 150,
      security_deposit: 500,
      rental_terms: 'Can rent for the whole 1st semester. Save ₹1000 compared to buying brand new at stationery shop.',
      condition: 'Good',
      college: 'Mumbai University (VJTI)',
      course: 'B.Tech / BE',
      branch: 'Mechanical & Civil',
      semester: 1,
      subject: 'Engineering Graphics & Design (EGD)',
      edition: 'Standard Issue',
      author: 'Omega Stationery',
      isbn: '',
      location: 'Matunga / Dadar, Mumbai',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: '100% Cotton White Lab Coat (Size 38 / M) + Safety Goggles',
      description: 'Required for Chemistry Lab, Biology & Material Testing practicals. Thick premium cotton fabric with 3 utility pockets. Washed and sanitized. Will throw in anti-fog transparent safety goggles for free.',
      category_name: 'Lab Equipment',
      seller_id: Number(student3.lastInsertRowid),
      price: 240,
      listing_type: 'sell',
      rent_price_monthly: 0,
      security_deposit: 0,
      rental_terms: '',
      condition: 'Good',
      college: 'VJTI / Mumbai University',
      course: 'B.Tech / Pharmacy',
      branch: 'Chemical / Mechanical / Biotech',
      semester: 1,
      subject: 'Engineering Chemistry & Workshop Lab',
      edition: '',
      author: '',
      isbn: '',
      location: 'VJTI Hostel, Matunga, Mumbai',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Arduino Uno R3 Ultimate Starter Kit (Sensors, Motors, LCD)',
      description: 'Used for Sem 5 IoT / Embedded Systems mini project. Includes original Arduino Uno board, breadboard, 40+ jumper wires, ultrasonic sensor, IR sensor, 16x2 LCD display, servo motor, stepper motor, RFID reader with tags, and resistors kit in plastic organizer box.',
      category_name: 'Project Materials',
      seller_id: Number(student1.lastInsertRowid),
      price: 850,
      listing_type: 'both',
      rent_price_monthly: 300,
      security_deposit: 800,
      rental_terms: 'Ideal for semester project submissions! All components tested and working.',
      condition: 'Like New',
      college: 'Gujarat Technological University',
      course: 'B.Tech',
      branch: 'Computer / IT / Electronics',
      semester: 5,
      subject: 'Microprocessors & IoT',
      edition: 'Rev 3',
      author: 'RoboCraze / Arduino',
      isbn: '',
      location: 'Ahmedabad (Near LDCE)',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Compact Wooden Study Table with Bookshelf for Hostel Room',
      description: 'Engineered wood study desk with 2-tier overhead bookshelf and bottom footrest. Very sturdy, perfect dimensions for single or twin sharing hostel rooms. Easily fits a laptop, monitor and open notebooks. Minor scratches on base, top is clean.',
      category_name: 'Furniture',
      seller_id: Number(student4.lastInsertRowid),
      price: 1450,
      listing_type: 'both',
      rent_price_monthly: 400,
      security_deposit: 1200,
      rental_terms: 'Minimum 2 months rental. Buyer arranges self-pickup or shared auto.',
      condition: 'Good',
      college: 'Delhi University (DU)',
      course: 'General',
      branch: 'All Departments',
      semester: 3,
      subject: 'Hostel Accommodation',
      edition: '',
      author: '',
      isbn: '',
      location: 'Vijay Nagar / North Campus, Delhi',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Wipro 10W LED Eye-Care Desk Lamp (Warm & Cool Light)',
      description: 'Rechargeable LED study lamp with 3 color temperatures (warm, natural, cool white) and dimmable touch control. Flexible gooseneck arm. Built-in 2000mAh battery provides 4 hours of backup during hostel power cuts.',
      category_name: 'Hostel Items',
      seller_id: Number(student2.lastInsertRowid),
      price: 420,
      listing_type: 'sell',
      rent_price_monthly: 0,
      security_deposit: 0,
      rental_terms: '',
      condition: 'Like New',
      college: 'Gujarat Technological University',
      course: 'All Courses',
      branch: 'All',
      semester: 2,
      subject: 'Hostel Essentials',
      edition: '',
      author: 'Wipro Smart',
      isbn: '',
      location: 'Vastrapur / Bodakdev, Ahmedabad',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Dell 22-inch Full HD IPS Monitor (HDMI + VGA with Stand)',
      description: 'Dell SE2219HX 21.5-inch 1080p 60Hz monitor. Ultra-thin bezel, IPS panel with great viewing angles. Perfect for coding, online classes, and watching lectures. Comes with HDMI cable and power cord.',
      category_name: 'Electronics',
      seller_id: Number(student1.lastInsertRowid),
      price: 3600,
      listing_type: 'both',
      rent_price_monthly: 600,
      security_deposit: 3000,
      rental_terms: 'Monthly rent for semester use. Zero dead pixels, inspected before handover.',
      condition: 'Like New',
      college: 'Gujarat Technological University',
      course: 'B.Tech',
      branch: 'Computer / IT',
      semester: 6,
      subject: 'Practical Coding / Lab',
      edition: 'Dell SE Series',
      author: 'Dell India',
      isbn: '',
      location: 'Navrangpura, Ahmedabad',
      availability: 'available',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'SRCC B.Com Semester 2 Hand-Written Topper Notes (All Subjects)',
      description: 'Spiral-bound high quality Xerox copies of verified topper notes for Business Law, Corporate Accounting, and Business Mathematics. Includes diagrammatic charts, bullet summaries, and previous 5 years solved questions.',
      category_name: 'Notes',
      seller_id: Number(student4.lastInsertRowid),
      price: 350,
      listing_type: 'sell',
      rent_price_monthly: 0,
      security_deposit: 0,
      rental_terms: '',
      condition: 'Like New',
      college: 'Delhi University (SRCC)',
      course: 'B.Com (Hons)',
      branch: 'Commerce',
      semester: 2,
      subject: 'Business Law & Corporate Accounting',
      edition: '2024 Exam Edition',
      author: 'SRCC Study Circle',
      isbn: '',
      location: 'North Campus / Kamla Nagar, Delhi',
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
      user_id: Number(student1.lastInsertRowid),
      title: 'Need GTU B.Tech Sem 6 Machine Learning & Data Mining Textbook',
      description: 'Looking for Tan, Steinbach & Kumar or Jiawei Han textbook for GTU Sem 6 CE syllabus. Solved question bank or notes also welcome.',
      category_name: 'Textbooks',
      college: 'Gujarat Technological University',
      course: 'B.Tech',
      semester: 6,
      subject: 'Machine Learning',
      budget: 350,
      preferred_type: 'Buy',
      location: 'Ahmedabad (LDCE / Gujarat College area)',
      required_by_date: '2026-10-15',
      status: 'open'
    },
    {
      user_id: Number(student2.lastInsertRowid),
      title: 'Looking for ergonomic study chair on rent for 3 months',
      description: 'Preparing for CAT exam in my hostel room and need a comfortable back-support desk chair. Willing to pay ₹250-₹350/month with reasonable deposit.',
      category_name: 'Furniture',
      college: 'Som-Lalit Institute (GTU)',
      course: 'BBA',
      semester: 4,
      subject: 'CAT Prep',
      budget: 900,
      preferred_type: 'Rent',
      location: 'Navrangpura / Vastrapur, Ahmedabad',
      required_by_date: '2026-10-05',
      status: 'open'
    },
    {
      user_id: Number(student3.lastInsertRowid),
      title: 'Urgent: Casio FX-991ES or EX Calculator for Sem 5 exams',
      description: 'Lost my scientific calculator right before mid-sems. Need one urgently within 2 days near Matunga/Dadar.',
      category_name: 'Calculators',
      college: 'Mumbai University (VJTI)',
      course: 'B.Tech',
      semester: 5,
      subject: 'Heat & Mass Transfer',
      budget: 800,
      preferred_type: 'Buy',
      location: 'Matunga, Mumbai',
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

  // 5. Seed Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (reviewer_id, seller_id, rating, comment)
    VALUES (@reviewer_id, @seller_id, @rating, @comment)
  `);

  insertReview.run({
    reviewer_id: Number(student2.lastInsertRowid),
    seller_id: Number(student1.lastInsertRowid),
    rating: 5,
    comment: 'Super polite senior! Met directly at the college canteen. The book was exactly as described with clean pages. Highly recommend!'
  });

  insertReview.run({
    reviewer_id: Number(student3.lastInsertRowid),
    seller_id: Number(student2.lastInsertRowid),
    rating: 5,
    comment: 'Priya was very quick to respond on chat. Textbook was wrapped in a neat plastic cover. Great experience on CampusMarket!'
  });

  // 6. Seed Conversations & Messages
  const insertConv = db.prepare(`
    INSERT INTO conversations (buyer_id, seller_id, product_id, last_message)
    VALUES (?, ?, 1, 'Yes, I am free today at 4:30 PM near the library.')
  `);
  const convInfo = insertConv.run(Number(student1.lastInsertRowid), Number(student2.lastInsertRowid));

  const insertMsg = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, recipient_id, text, is_read)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertMsg.run(
    convInfo.lastInsertRowid,
    Number(student1.lastInsertRowid),
    Number(student2.lastInsertRowid),
    'Hey Priya! Is the Financial Accounting book still available for Sem 3?',
    1
  );

  insertMsg.run(
    convInfo.lastInsertRowid,
    Number(student2.lastInsertRowid),
    Number(student1.lastInsertRowid),
    'Hi Aarav, yes it is available! Are you looking to buy or rent it?',
    1
  );

  insertMsg.run(
    convInfo.lastInsertRowid,
    Number(student1.lastInsertRowid),
    Number(student2.lastInsertRowid),
    'I want to buy it outright. Can we meet on campus after 4 PM?',
    1
  );

  insertMsg.run(
    convInfo.lastInsertRowid,
    Number(student2.lastInsertRowid),
    Number(student1.lastInsertRowid),
    'Yes, I am free today at 4:30 PM near the library.',
    0
  );

  // 7. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link, is_read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(
    Number(student1.lastInsertRowid),
    'New message from Priya Sharma',
    'Priya: "Yes, I am free today at 4:30 PM near the library."',
    'message',
    '/messages',
    0
  );

  insertNotif.run(
    Number(student1.lastInsertRowid),
    'Listing Approved!',
    'Your listing "Higher Engineering Mathematics — B.S. Grewal" is now live on CampusMarket.',
    'approval',
    '/products/2',
    1
  );

  console.log('CampusMarket database seeded successfully with realistic student data!');
}

module.exports = {
  db,
  initDatabase
};
