// ============================================
// Database Seeder - Populate with Demo Data
// ============================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/database');
const { User, Home, Child, Donation, Sponsorship, Transaction, WelfareReport } = require('../models');

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Sync database (force recreate tables)
    await sequelize.sync({ force: true });
    console.log('📊 Tables created.\n');

    // ---- 1. Seed Users ----
    console.log('👤 Seeding users...');
    const admin = await User.create({
      name: 'Admin User', email: 'admin@hopehaven.org', password_hash: 'admin123', role: 'admin', phone: '+254700000000'
    });
    const donor1 = await User.create({
      name: 'Jane Smith', email: 'jane@example.com', password_hash: 'donor123', role: 'donor', phone: '+254712345678', preferred_type: 'Education', total_donated: 125000
    });
    const donor2 = await User.create({
      name: 'Michael Johnson', email: 'michael@example.com', password_hash: 'donor123', role: 'donor', phone: '+254723456789', preferred_type: 'Healthcare', total_donated: 89000
    });
    console.log(`   ✅ ${3} users created\n`);

    // ---- 2. Seed Homes ----
    console.log('🏠 Seeding homes...');
    const homesData = [
      { name: "Sunrise Children's Home", location: 'Nairobi, Kenya', latitude: -1.2921, longitude: 36.8219, capacity: 60, established: 2008, description: 'A loving home providing shelter, education and care for orphaned and vulnerable children in the heart of Nairobi.', needs: ['Food Supplies', 'School Fees', 'Medical Care'], image: 'home1', rating: 4.8 },
      { name: 'Happy Hearts Orphanage', location: 'Mombasa, Kenya', latitude: -4.0435, longitude: 39.6682, capacity: 40, established: 2012, description: 'Dedicated to nurturing children with love, providing quality education and holistic development programs.', needs: ['Clothing', 'Books', 'Toys'], image: 'home2', rating: 4.6 },
      { name: 'Bright Future Foundation', location: 'Kisumu, Kenya', latitude: -0.1022, longitude: 34.7617, capacity: 35, established: 2015, description: 'Empowering vulnerable children through education, nutrition and psychosocial support in a family setting.', needs: ['School Supplies', 'Food', 'Bedding'], image: 'home3', rating: 4.9 },
      { name: 'Little Angels Haven', location: 'Nakuru, Kenya', latitude: -0.3031, longitude: 36.0800, capacity: 30, established: 2010, description: 'A safe haven for abandoned and orphaned children, offering them hope and a chance for a brighter tomorrow.', needs: ['Medical Supplies', 'Clothing', 'School Fees'], image: 'home4', rating: 4.7 },
      { name: "Grace Children's Center", location: 'Eldoret, Kenya', latitude: 0.5143, longitude: 35.2698, capacity: 50, established: 2006, description: 'Providing comprehensive care including shelter, education, healthcare and spiritual guidance for children in need.', needs: ['Food', 'Uniforms', 'Recreational Items'], image: 'home5', rating: 4.5 },
      { name: 'New Hope Village', location: 'Thika, Kenya', latitude: -1.0396, longitude: 37.0900, capacity: 25, established: 2018, description: "A community-based children's home focused on family-style care and holistic child development.", needs: ['Building Materials', 'Food', 'School Fees'], image: 'home6', rating: 4.8 },
      { name: 'Cornerstone Kids Home', location: 'Nyeri, Kenya', latitude: -0.4197, longitude: 36.9511, capacity: 35, established: 2011, description: 'Raising children in a Christ-centered environment with focus on education, character development and self-reliance.', needs: ['Agricultural Inputs', 'Books', 'Clothing'], image: 'home7', rating: 4.6 },
      { name: "Rainbow Children's Home", location: 'Machakos, Kenya', latitude: -1.5177, longitude: 37.2634, capacity: 40, established: 2009, description: 'A multicultural haven where every child is valued, nurtured and empowered to reach their full potential.', needs: ['Medical Care', 'School Fees', 'Food'], image: 'home8', rating: 4.7 },
      { name: 'Peaceful Hearts Home', location: 'Naivasha, Kenya', latitude: -0.7172, longitude: 36.4310, capacity: 20, established: 2019, description: 'A small, family-oriented home offering personalized care and attention to every child in a peaceful lakeside setting.', needs: ['Furniture', 'Clothing', 'Toys'], image: 'home9', rating: 4.9 },
      { name: "Unity Children's Village", location: 'Malindi, Kenya', latitude: -3.2138, longitude: 40.1169, capacity: 45, established: 2007, description: 'Bringing together children from diverse backgrounds in a united community of love, learning and growth by the coast.', needs: ['Food', 'Water Purification', 'School Supplies'], image: 'home10', rating: 4.5 }
    ];
    const homes = await Home.bulkCreate(homesData);
    console.log(`   ✅ ${homes.length} homes created\n`);

    // ---- 3. Seed Children ----
    console.log('👧🏾 Seeding children...');
    const childrenData = [
      { name: 'Amani Wanjiku', age: 8, gender: 'Female', home_id: 1, education_level: 'Grade 3', health_status: 'Good', welfare_status: 'green', needs: 'School fees, uniform', join_date: '2022-03-15', photo: '👧🏾' },
      { name: 'Brian Ochieng', age: 12, gender: 'Male', home_id: 1, education_level: 'Grade 6', health_status: 'Good', welfare_status: 'green', needs: 'Books, school supplies', join_date: '2020-07-22', sponsor_id: donor1.user_id, sponsorship_status: 'sponsored', photo: '👦🏾' },
      { name: 'Charity Muthoni', age: 6, gender: 'Female', home_id: 1, education_level: 'Grade 1', health_status: 'Under Treatment', welfare_status: 'amber', needs: 'Medical care, nutrition', join_date: '2023-01-10', photo: '👧🏾' },
      { name: 'David Kiprop', age: 14, gender: 'Male', home_id: 2, education_level: 'Grade 8', health_status: 'Good', welfare_status: 'green', needs: 'High school preparation', join_date: '2019-05-08', sponsor_id: donor2.user_id, sponsorship_status: 'sponsored', photo: '👦🏾' },
      { name: 'Esther Akinyi', age: 10, gender: 'Female', home_id: 2, education_level: 'Grade 4', health_status: 'Good', welfare_status: 'green', needs: 'Clothing, shoes', join_date: '2021-09-14', photo: '👧🏾' },
      { name: 'Felix Mwangi', age: 7, gender: 'Male', home_id: 3, education_level: 'Grade 2', health_status: 'Recovering', welfare_status: 'amber', needs: 'Nutritional support', join_date: '2023-06-20', photo: '👦🏾' },
      { name: 'Grace Njeri', age: 11, gender: 'Female', home_id: 3, education_level: 'Grade 5', health_status: 'Good', welfare_status: 'green', needs: 'School fees', join_date: '2020-11-03', sponsor_id: donor1.user_id, sponsorship_status: 'sponsored', photo: '👧🏾' },
      { name: 'Hassan Omar', age: 9, gender: 'Male', home_id: 4, education_level: 'Grade 3', health_status: 'Good', welfare_status: 'green', needs: 'Books, uniform', join_date: '2022-08-17', photo: '👦🏾' },
      { name: 'Irene Wairimu', age: 13, gender: 'Female', home_id: 4, education_level: 'Grade 7', health_status: 'Good', welfare_status: 'green', needs: 'Career guidance', join_date: '2019-12-01', photo: '👧🏾' },
      { name: 'James Karanja', age: 5, gender: 'Male', home_id: 5, education_level: 'Kindergarten', health_status: 'Good', welfare_status: 'green', needs: 'Early education materials', join_date: '2024-01-15', photo: '👦🏾' },
      { name: 'Kezia Atieno', age: 15, gender: 'Female', home_id: 5, education_level: 'Form 1', health_status: 'Good', welfare_status: 'green', needs: 'Secondary school fees', join_date: '2018-04-22', sponsor_id: donor2.user_id, sponsorship_status: 'sponsored', photo: '👧🏾' },
      { name: 'Liam Mutua', age: 8, gender: 'Male', home_id: 6, education_level: 'Grade 3', health_status: 'Needs Checkup', welfare_status: 'red', needs: 'Urgent medical attention', join_date: '2023-03-08', photo: '👦🏾' },
      { name: 'Mary Wambui', age: 10, gender: 'Female', home_id: 6, education_level: 'Grade 4', health_status: 'Good', welfare_status: 'green', needs: 'School supplies', join_date: '2021-02-14', photo: '👧🏾' },
      { name: 'Nathan Korir', age: 12, gender: 'Male', home_id: 7, education_level: 'Grade 6', health_status: 'Good', welfare_status: 'green', needs: 'Sports equipment', join_date: '2020-06-30', photo: '👦🏾' },
      { name: 'Olive Chebet', age: 7, gender: 'Female', home_id: 7, education_level: 'Grade 1', health_status: 'Good', welfare_status: 'green', needs: 'Clothing, shoes', join_date: '2023-09-05', photo: '👧🏾' },
      { name: 'Peter Otieno', age: 16, gender: 'Male', home_id: 8, education_level: 'Form 2', health_status: 'Good', welfare_status: 'green', needs: 'Vocational training', join_date: '2017-08-12', sponsor_id: donor1.user_id, sponsorship_status: 'sponsored', photo: '👦🏾' },
      { name: 'Queen Nyambura', age: 9, gender: 'Female', home_id: 8, education_level: 'Grade 3', health_status: 'Under Treatment', welfare_status: 'amber', needs: 'Medication, nutrition', join_date: '2022-11-20', photo: '👧🏾' },
      { name: 'Ryan Kamau', age: 11, gender: 'Male', home_id: 9, education_level: 'Grade 5', health_status: 'Good', welfare_status: 'green', needs: 'Tuition support', join_date: '2021-05-25', photo: '👦🏾' },
      { name: 'Sarah Adhiambo', age: 6, gender: 'Female', home_id: 9, education_level: 'Grade 1', health_status: 'Good', welfare_status: 'green', needs: 'Learning materials', join_date: '2024-02-10', photo: '👧🏾' },
      { name: 'Timothy Njuguna', age: 13, gender: 'Male', home_id: 10, education_level: 'Grade 7', health_status: 'Good', welfare_status: 'green', needs: 'School fees, exam prep', join_date: '2019-10-18', photo: '👦🏾' },
      { name: 'Uma Wangari', age: 4, gender: 'Female', home_id: 10, education_level: 'Pre-school', health_status: 'Good', welfare_status: 'green', needs: 'Early childhood development', join_date: '2024-04-01', photo: '👧🏾' },
      { name: 'Victor Kimani', age: 10, gender: 'Male', home_id: 1, education_level: 'Grade 4', health_status: 'Good', welfare_status: 'green', needs: 'Mentorship program', join_date: '2021-07-14', photo: '👦🏾' },
      { name: 'Winnie Achieng', age: 8, gender: 'Female', home_id: 3, education_level: 'Grade 2', health_status: 'Good', welfare_status: 'green', needs: 'Art supplies, books', join_date: '2023-01-28', photo: '👧🏾' },
      { name: 'Xavier Omondi', age: 14, gender: 'Male', home_id: 5, education_level: 'Grade 8', health_status: 'Good', welfare_status: 'green', needs: 'High school prep, mentoring', join_date: '2018-11-05', photo: '👦🏾' },
      { name: 'Yusuf Ibrahim', age: 9, gender: 'Male', home_id: 8, education_level: 'Grade 3', health_status: 'Recovering', welfare_status: 'amber', needs: 'Counseling, nutrition', join_date: '2022-05-12', photo: '👦🏾' }
    ];
    const children = await Child.bulkCreate(childrenData);
    console.log(`   ✅ ${children.length} children created\n`);

    // ---- 4. Seed Donations ----
    console.log('💰 Seeding donations...');
    const donationsData = [
      { donor_id: donor1.user_id, home_id: 1, child_id: 2, amount: 15000, donation_type: 'Education', status: 'Completed', donation_date: '2025-12-15', message: 'Wishing you the best in school!' },
      { donor_id: donor1.user_id, home_id: 3, child_id: 7, amount: 25000, donation_type: 'Education', status: 'Completed', donation_date: '2025-11-20', message: 'Keep shining bright!' },
      { donor_id: donor2.user_id, home_id: 2, child_id: 4, amount: 20000, donation_type: 'Healthcare', status: 'Completed', donation_date: '2025-10-08', message: 'Stay healthy and strong!' },
      { donor_id: donor2.user_id, home_id: 5, child_id: 11, amount: 30000, donation_type: 'Education', status: 'Completed', donation_date: '2025-09-14', message: 'Education is the key!' },
      { donor_id: donor1.user_id, home_id: 8, child_id: 16, amount: 18000, donation_type: 'Vocational Training', status: 'Completed', donation_date: '2025-08-22', message: 'Invest in your skills!' },
      { donor_id: donor1.user_id, home_id: 1, child_id: null, amount: 50000, donation_type: 'General', status: 'Completed', donation_date: '2026-01-05', message: 'Happy New Year! For all the kids.' },
      { donor_id: donor2.user_id, home_id: 4, child_id: null, amount: 12000, donation_type: 'Food & Nutrition', status: 'Pending', donation_date: '2026-02-18', message: 'Nutritious meals for the children.' },
      { donor_id: donor1.user_id, home_id: 6, child_id: 12, amount: 35000, donation_type: 'Healthcare', status: 'Pending', donation_date: '2026-03-01', message: 'Hope this helps with treatment.' },
      { donor_id: donor2.user_id, home_id: 10, child_id: null, amount: 22000, donation_type: 'Infrastructure', status: 'Completed', donation_date: '2025-07-10', message: 'Building a better tomorrow.' },
      { donor_id: donor1.user_id, home_id: 9, child_id: null, amount: 10000, donation_type: 'General', status: 'Completed', donation_date: '2025-06-30', message: 'Small contribution with big love.' }
    ];
    const donations = await Donation.bulkCreate(donationsData);
    console.log(`   ✅ ${donations.length} donations created\n`);

    // ---- 5. Seed Transactions ----
    console.log('📋 Seeding transactions...');
    const txnData = donations.map((d, i) => ({
      donation_id: d.donation_id,
      amount: d.amount,
      payment_method: 'Online',
      payment_status: d.status === 'Completed' ? 'Completed' : 'Pending',
      reference_code: 'TXN' + (100000 + i).toString(),
      timestamp: d.donation_date
    }));
    await Transaction.bulkCreate(txnData);
    console.log(`   ✅ ${txnData.length} transactions created\n`);

    // ---- 6. Seed Sponsorships ----
    console.log('💝 Seeding sponsorships...');
    const sponsorshipsData = [
      { sponsor_id: donor1.user_id, child_id: 2, monthly_amount: 5000, start_date: '2024-01-01', status: 'Active' },
      { sponsor_id: donor2.user_id, child_id: 4, monthly_amount: 5000, start_date: '2024-03-01', status: 'Active' },
      { sponsor_id: donor1.user_id, child_id: 7, monthly_amount: 4000, start_date: '2024-06-01', status: 'Active' },
      { sponsor_id: donor2.user_id, child_id: 11, monthly_amount: 6000, start_date: '2024-02-01', status: 'Active' },
      { sponsor_id: donor1.user_id, child_id: 16, monthly_amount: 5000, start_date: '2023-09-01', status: 'Active' }
    ];
    await Sponsorship.bulkCreate(sponsorshipsData);
    console.log(`   ✅ ${sponsorshipsData.length} sponsorships created\n`);

    // ---- 7. Seed Welfare Reports ----
    console.log('🏥 Seeding welfare reports...');
    const welfareData = [
      { child_id: 1, report_type: 'Health Checkup', status: 'Good', report_date: '2026-02-20', notes: 'Routine checkup completed. All vitals normal. Weight and height within healthy range.', reported_by: admin.user_id },
      { child_id: 3, report_type: 'Medical Treatment', status: 'In Progress', report_date: '2026-03-01', notes: 'Ongoing treatment for respiratory condition. Responding well to medication.', reported_by: admin.user_id },
      { child_id: 6, report_type: 'Nutrition Assessment', status: 'Needs Attention', report_date: '2026-02-15', notes: 'Slightly underweight. Started on enhanced nutrition plan with vitamin supplements.', reported_by: admin.user_id },
      { child_id: 12, report_type: 'Emergency Medical', status: 'Critical', report_date: '2026-03-10', notes: 'Referred to Kenyatta National Hospital for specialist evaluation. Awaiting test results.', reported_by: admin.user_id },
      { child_id: 2, report_type: 'Education Progress', status: 'Good', report_date: '2026-02-28', notes: 'Top 5 in class. Excellent progress in mathematics and science. Recommended for scholarship.', reported_by: admin.user_id },
      { child_id: 7, report_type: 'Education Progress', status: 'Good', report_date: '2026-03-05', notes: 'Shows great artistic talent. Enrolled in after-school art program. Grades improving steadily.', reported_by: admin.user_id },
      { child_id: 17, report_type: 'Counseling Session', status: 'In Progress', report_date: '2026-03-08', notes: 'Weekly counseling sessions ongoing. Shows improvement in social interaction.', reported_by: admin.user_id },
      { child_id: 25, report_type: 'Health Checkup', status: 'Recovering', report_date: '2026-03-12', notes: 'Recovery from malaria progressing well. Follow-up in two weeks.', reported_by: admin.user_id },
      { child_id: 16, report_type: 'Skills Assessment', status: 'Good', report_date: '2026-02-25', notes: 'Excelling in carpentry vocational training. Ready for advanced modules.', reported_by: admin.user_id },
      { child_id: 4, report_type: 'Education Progress', status: 'Good', report_date: '2026-03-15', notes: 'Preparing well for KCPE. Mock exam score: 385/500.', reported_by: admin.user_id }
    ];
    await WelfareReport.bulkCreate(welfareData);
    console.log(`   ✅ ${welfareData.length} welfare reports created\n`);

    console.log('🎉 ============================================');
    console.log('   Database seeded successfully!');
    console.log('   ============================================');
    console.log(`   👤 Users:        3 (1 admin, 2 donors)`);
    console.log(`   🏠 Homes:        ${homes.length}`);
    console.log(`   👧🏾 Children:     ${children.length}`);
    console.log(`   💰 Donations:    ${donations.length}`);
    console.log(`   💝 Sponsorships: ${sponsorshipsData.length}`);
    console.log(`   🏥 Welfare:      ${welfareData.length}`);
    console.log('   ============================================');
    console.log('\n   Demo Credentials:');
    console.log('   Admin: admin@hopehaven.org / admin123');
    console.log('   Donor: jane@example.com / donor123');
    console.log('   Donor: michael@example.com / donor123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
