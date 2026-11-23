const { db, initSchema } = require('./db');

function seedDatabase() {
  console.log('Initializing database schema...');
  initSchema();

  // Clear existing data for fresh seed
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM reminders;
    DELETE FROM split_items;
    DELETE FROM split_groups;
    DELETE FROM subscriptions;
    DELETE FROM budgets;
    DELETE FROM transactions;
    DELETE FROM accounts;
  `);

  console.log('Seeding demo accounts...');
  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, name, account_number, type, bank_name, balance, is_primary, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAccount.run('acc_hdfc', 'HDFC Salary Account', '••••4821', 'SALARY', 'HDFC Bank', 142500.00, 1, 'INR');
  insertAccount.run('acc_icici', 'ICICI Savings Account', '••••9034', 'SAVINGS', 'ICICI Bank', 35000.00, 0, 'INR');
  insertAccount.run('acc_zerodha', 'Zerodha Investment Wallet', '••••1180', 'WALLET', 'Zerodha', 15000.00, 0, 'INR');

  console.log('Seeding budgets for November 2026...');
  const insertBudget = db.prepare(`
    INSERT INTO budgets (id, category, monthly_limit, month)
    VALUES (?, ?, ?, ?)
  `);

  insertBudget.run('bgt_food', 'Food & Dining', 10000.00, '2026-11');
  insertBudget.run('bgt_shopping', 'Shopping', 15000.00, '2026-11');
  insertBudget.run('bgt_groceries', 'Groceries', 8000.00, '2026-11');
  insertBudget.run('bgt_utilities', 'Utilities', 7000.00, '2026-11');
  insertBudget.run('bgt_travel', 'Travel & Commute', 5000.00, '2026-11');
  insertBudget.run('bgt_entertainment', 'Entertainment', 4000.00, '2026-11');

  console.log('Seeding subscriptions...');
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (id, name, merchant, amount, billing_cycle, category, renewal_date, status, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSub.run('sub_netflix', 'Netflix Premium 4K', 'Netflix India', 649.00, 'monthly', 'Entertainment', '2026-12-14', 'active', 'HDFC Credit Card');
  insertSub.run('sub_spotify', 'Spotify Premium Individual', 'Spotify', 119.00, 'monthly', 'Entertainment', '2026-12-08', 'active', 'UPI AutoPay');
  insertSub.run('sub_cultfit', 'Cult.fit Elite Pass', 'Cult.fit', 2500.00, 'monthly', 'Health & Fitness', '2026-12-01', 'active', 'HDFC Debit Card');
  insertSub.run('sub_airtel', 'Airtel Fiber 200Mbps', 'Airtel Broadband', 999.00, 'monthly', 'Utilities', '2026-12-20', 'active', 'ICICI Net Banking');
  insertSub.run('sub_googleone', 'Google One 200GB Storage', 'Google India', 130.00, 'monthly', 'Utilities', '2026-12-27', 'active', 'Google Play UPI');
  insertSub.run('sub_prime', 'Amazon Prime Annual', 'Amazon Pay', 1499.00, 'yearly', 'Shopping', '2027-04-15', 'active', 'Amazon Pay ICICI');

  console.log('Seeding 3-month realistic transactions...');
  const insertTx = db.prepare(`
    INSERT INTO transactions (id, account_id, merchant, amount, type, category, payment_method, date, notes, is_recurring)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // --- SEPTEMBER 2026 ---
  insertTx.run('tx_sep_01', 'acc_hdfc', 'TechCorp India Ltd', 120000.00, 'CREDIT', 'Salary', 'IMPS', '2026-09-01', 'Monthly Salary Credit', 1);
  insertTx.run('tx_sep_02', 'acc_hdfc', 'Suresh Kumar (Landlord)', 32000.00, 'DEBIT', 'Housing', 'UPI', '2026-09-01', 'Flat Rent Koramangala', 1);
  insertTx.run('tx_sep_03', 'acc_hdfc', 'Swiggy', 3200.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-09-05', 'Weekend Food Order', 0);
  insertTx.run('tx_sep_04', 'acc_hdfc', 'Zomato', 4100.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-09-12', 'Team Dinner Treat', 0);
  insertTx.run('tx_sep_05', 'acc_hdfc', 'Amazon India', 8500.00, 'DEBIT', 'Shopping', 'Credit Card', '2026-09-15', 'Home Décor & Books', 0);
  insertTx.run('tx_sep_06', 'acc_icici', 'Blinkit', 3400.00, 'DEBIT', 'Groceries', 'UPI', '2026-09-18', 'Weekly Grocery Supplies', 0);
  insertTx.run('tx_sep_07', 'acc_hdfc', 'Tata Power - Electricity', 2850.00, 'DEBIT', 'Utilities', 'Net Banking', '2026-09-20', 'Electricity Bill Sept', 1);
  insertTx.run('tx_sep_08', 'acc_hdfc', 'Uber India', 1850.00, 'DEBIT', 'Travel & Commute', 'UPI', '2026-09-22', 'Airport Cabs', 0);
  insertTx.run('tx_sep_09', 'acc_hdfc', 'Netflix India', 649.00, 'DEBIT', 'Entertainment', 'Credit Card', '2026-09-14', 'Monthly Subscription', 1);
  insertTx.run('tx_sep_10', 'acc_hdfc', 'Cult.fit', 2500.00, 'DEBIT', 'Health & Fitness', 'Debit Card', '2026-09-01', 'Gym Membership', 1);

  // --- OCTOBER 2026 ---
  insertTx.run('tx_oct_01', 'acc_hdfc', 'TechCorp India Ltd', 120000.00, 'CREDIT', 'Salary', 'IMPS', '2026-10-01', 'Monthly Salary Credit', 1);
  insertTx.run('tx_oct_02', 'acc_hdfc', 'Suresh Kumar (Landlord)', 32000.00, 'DEBIT', 'Housing', 'UPI', '2026-10-01', 'Flat Rent Koramangala', 1);
  insertTx.run('tx_oct_03', 'acc_hdfc', 'Swiggy', 2400.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-10-04', 'Dinner with Friends', 0);
  insertTx.run('tx_oct_04', 'acc_hdfc', 'Swiggy', 1950.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-10-10', 'Meghana Biryani Feast', 0);
  insertTx.run('tx_oct_05', 'acc_hdfc', 'Swiggy', 1450.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-10-18', 'Weekend Gourmet Pizza', 0);
  insertTx.run('tx_oct_06', 'acc_hdfc', 'Zomato', 3600.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-10-14', 'Office Party Food Order', 0);
  // Total Food in Oct = 2400 + 1950 + 1450 + 3600 = 9400 (Swiggy: 5800, Zomato: 3600)
  insertTx.run('tx_oct_07', 'acc_hdfc', 'Amazon India', 12400.00, 'DEBIT', 'Shopping', 'Credit Card', '2026-10-12', 'Great Indian Festival Sale', 0);
  insertTx.run('tx_oct_08', 'acc_icici', 'Zepto', 4200.00, 'DEBIT', 'Groceries', 'UPI', '2026-10-15', 'Monthly Pantry Restock', 0);
  insertTx.run('tx_oct_09', 'acc_hdfc', 'Tata Power - Electricity', 3100.00, 'DEBIT', 'Utilities', 'Net Banking', '2026-10-08', 'Electricity Bill Oct', 1);
  insertTx.run('tx_oct_10', 'acc_hdfc', 'Uber India', 2100.00, 'DEBIT', 'Travel & Commute', 'UPI', '2026-10-19', 'Client Meeting Rides', 0);
  insertTx.run('tx_oct_11', 'acc_hdfc', 'Netflix India', 649.00, 'DEBIT', 'Entertainment', 'Credit Card', '2026-10-14', 'Monthly Subscription', 1);
  insertTx.run('tx_oct_12', 'acc_hdfc', 'Spotify', 119.00, 'DEBIT', 'Entertainment', 'UPI', '2026-10-08', 'Monthly Subscription', 1);
  insertTx.run('tx_oct_13', 'acc_hdfc', 'Cult.fit', 2500.00, 'DEBIT', 'Health & Fitness', 'Debit Card', '2026-10-01', 'Gym Membership', 1);
  insertTx.run('tx_oct_14', 'acc_icici', 'Airtel Broadband', 999.00, 'DEBIT', 'Utilities', 'Net Banking', '2026-10-20', 'Fiber Broadband Bill', 1);
  insertTx.run('tx_oct_15', 'acc_hdfc', 'Google India', 130.00, 'DEBIT', 'Utilities', 'UPI', '2026-10-27', 'Google One Cloud Storage', 1);

  // --- NOVEMBER 2026 (Current Month - up to Nov 24, 2026) ---
  insertTx.run('tx_nov_01', 'acc_hdfc', 'TechCorp India Ltd', 120000.00, 'CREDIT', 'Salary', 'IMPS', '2026-11-01', 'Monthly Salary Credit', 1);
  insertTx.run('tx_nov_02', 'acc_hdfc', 'Suresh Kumar (Landlord)', 32000.00, 'DEBIT', 'Housing', 'UPI', '2026-11-01', 'Monthly Rent Koramangala 2BHK', 1);
  insertTx.run('tx_nov_03', 'acc_hdfc', 'Cult.fit', 2500.00, 'DEBIT', 'Health & Fitness', 'Debit Card', '2026-11-01', 'Cult.fit Elite Pass Gym', 1);
  
  // Swiggy Nov transactions (Total Swiggy: ₹3,850)
  insertTx.run('tx_nov_04', 'acc_hdfc', 'Swiggy', 650.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-11-03', 'Meghana Foods Biryani', 0);
  insertTx.run('tx_nov_05', 'acc_hdfc', 'Amazon India', 7999.00, 'DEBIT', 'Shopping', 'Credit Card', '2026-11-04', 'Noise ColorFit Smartwatch & ANC Buds', 0);
  insertTx.run('tx_nov_06', 'acc_hdfc', 'Zomato', 580.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-11-05', 'Lunch - Salad Days', 0);
  insertTx.run('tx_nov_07', 'acc_hdfc', 'Tata Power - Electricity', 3800.00, 'DEBIT', 'Utilities', 'Net Banking', '2026-11-06', 'Electricity Bill Nov (Summer AC adjustment)', 1);
  insertTx.run('tx_nov_08', 'acc_hdfc', 'Spotify', 119.00, 'DEBIT', 'Entertainment', 'UPI', '2026-11-08', 'Spotify Premium Individual', 1);
  insertTx.run('tx_nov_09', 'acc_hdfc', 'Swiggy', 820.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-11-08', 'Truffles Koramangala Burgers', 0);
  insertTx.run('tx_nov_10', 'acc_icici', 'Blinkit', 2850.00, 'DEBIT', 'Groceries', 'UPI', '2026-11-09', 'Weekly Dairy, Fruits & Snacks', 0);
  insertTx.run('tx_nov_11', 'acc_hdfc', 'Flipkart', 4500.00, 'DEBIT', 'Shopping', 'Credit Card', '2026-11-11', 'Philips Digital Air Fryer', 0);
  insertTx.run('tx_nov_12', 'acc_hdfc', 'Swiggy', 740.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-11-12', 'Chai Point & Evening Samosas', 0);
  insertTx.run('tx_nov_13', 'acc_hdfc', 'Uber India', 1250.00, 'DEBIT', 'Travel & Commute', 'UPI', '2026-11-13', 'Uber Premier to Electronic City', 0);
  insertTx.run('tx_nov_14', 'acc_hdfc', 'Netflix India', 649.00, 'DEBIT', 'Entertainment', 'Credit Card', '2026-11-14', 'Netflix Premium 4K Auto-Renew', 1);
  insertTx.run('tx_nov_15', 'acc_hdfc', 'Zomato', 1150.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-11-15', 'Sunday Brunch - Toit Brewpub', 0);
  insertTx.run('tx_nov_16', 'acc_icici', 'Zepto', 2150.00, 'DEBIT', 'Groceries', 'UPI', '2026-11-16', 'Fresh Vegetables & Organic Essentials', 0);
  insertTx.run('tx_nov_17', 'acc_hdfc', 'Swiggy', 920.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-11-18', 'Empire Restaurant Indiranagar', 0);
  insertTx.run('tx_nov_18', 'acc_hdfc', 'Myntra', 1701.00, 'DEBIT', 'Shopping', 'Credit Card', '2026-11-19', 'Allen Solly Casual Shirts', 0);
  // Total Shopping Nov: 7999 + 4500 + 1701 = 14200 (Budget is 15000, 94.7% used in 24 days!)
  insertTx.run('tx_nov_19', 'acc_hdfc', 'Zomato', 620.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-11-20', 'Dinner - Third Wave Coffee Roasters', 0);
  // Total Food Nov: Swiggy (650+820+740+920+720 = 3850) + Zomato (580+1150+620 = 2350) = 6200
  insertTx.run('tx_nov_20', 'acc_icici', 'Airtel Broadband', 999.00, 'DEBIT', 'Utilities', 'Net Banking', '2026-11-20', 'Airtel Fiber 200Mbps Monthly Bill', 1);
  insertTx.run('tx_nov_21', 'acc_hdfc', 'Uber India', 850.00, 'DEBIT', 'Travel & Commute', 'UPI', '2026-11-21', 'Auto and Cab to Indiranagar Metro', 0);
  insertTx.run('tx_nov_22', 'acc_hdfc', 'Swiggy', 720.00, 'DEBIT', 'Food & Dining', 'UPI', '2026-11-22', 'Leon\'s Burgers HSR Layout', 0);
  insertTx.run('tx_nov_23', 'acc_hdfc', 'Apollo Pharmacy', 940.00, 'DEBIT', 'Health & Fitness', 'UPI', '2026-11-23', 'Multivitamins & First Aid', 0);
  insertTx.run('tx_nov_24', 'acc_hdfc', 'Indian Oil Fuel Station', 2200.00, 'DEBIT', 'Travel & Commute', 'Debit Card', '2026-11-24', 'Petrol Refill - Car', 0);

  console.log('Seeding split groups and items...');
  const insertGroup = db.prepare(`
    INSERT INTO split_groups (id, title, total_amount, created_by, date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertGroup.run('grp_dinner_01', 'Dinner at Social, Koramangala', 2000.00, 'Aarav Sharma', '2026-11-23', 'active');

  const insertSplitItem = db.prepare(`
    INSERT INTO split_items (id, group_id, friend_name, friend_upi, amount, status, upi_link, settled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSplitItem.run('item_01', 'grp_dinner_01', 'Aarav Sharma (You)', 'aarav.sharma@okaxis', 500.00, 'PAID', null, '2026-11-23 21:30:00');
  insertSplitItem.run('item_02', 'grp_dinner_01', 'Rahul Verma', 'rahul.verma@okhdfcbank', 500.00, 'PAID', 'upi://pay?pa=aarav.sharma@okaxis&pn=Aarav%20Sharma&am=500.00&cu=INR&tn=Dinner%20at%20Social%20Split', '2026-11-23 22:15:00');
  insertSplitItem.run('item_03', 'grp_dinner_01', 'Priya Patel', 'priya.patel@okicici', 500.00, 'PENDING', 'upi://pay?pa=aarav.sharma@okaxis&pn=Aarav%20Sharma&am=500.00&cu=INR&tn=Dinner%20at%20Social%20Split', null);
  insertSplitItem.run('item_04', 'grp_dinner_01', 'Rohan Das', 'rohan.das@oksbi', 500.00, 'PENDING', 'upi://pay?pa=aarav.sharma@okaxis&pn=Aarav%20Sharma&am=500.00&cu=INR&tn=Dinner%20at%20Social%20Split', null);

  console.log('Seeding reminders...');
  const insertReminder = db.prepare(`
    INSERT INTO reminders (id, title, amount, due_date, category, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertReminder.run('rem_01', 'Electricity Bill Payment - Tata Power', 3800.00, '2026-11-25', 'Utilities', 'PENDING');
  insertReminder.run('rem_02', 'Airtel Fiber Broadband Bill', 999.00, '2026-11-28', 'Utilities', 'PENDING');
  insertReminder.run('rem_03', 'Cult.fit Gym Monthly Renewal', 2500.00, '2026-12-01', 'Health & Fitness', 'PENDING');
  insertReminder.run('rem_04', 'HDFC Credit Card Bill Payment', 18450.00, '2026-12-05', 'Banking', 'PENDING');

  console.log('Seeding initial audit logs...');
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, session_id, action_type, server_name, tool_name, input_arguments, output_result, requires_approval, approval_status, approval_details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(
    'audit_init_01',
    'system_boot',
    'TOOL_EXECUTION',
    'banking-mcp-server',
    'get_balance',
    JSON.stringify({}),
    JSON.stringify({ total_balance: 192500.00, status: 'SUCCESS' }),
    0,
    'NOT_REQUIRED',
    null
  );

  console.log('✅ Database seeded successfully with realistic Indian demo financial data!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
