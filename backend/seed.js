const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const Staff = require('./models/Staff');
const Academic = require('./models/Academic');
const Transaction = require('./models/Transaction');
const Fee = require('./models/Fee');
const User = require('./models/User');

dotenv.config();

const indianFirstNames = [
  'Rahul', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Karan', 'Sneha',
  'Rohan', 'Pooja', 'Ravi', 'Sonia', 'Arjun', 'Meera', 'Suresh', 'Kavita',
  'Deepak', 'Anita', 'Raj', 'Divya', 'Manish', 'Sunita', 'Arun', 'Rekha',
  'Vijay', 'Nisha', 'Sanjay', 'Rashmi', 'Manoj', 'Swati', 'Gaurav', 'Pallavi',
  'Nikhil', 'Simran', 'Harsh', 'Ritika', 'Tushar', 'Bhavna', 'Akash', 'Kriti',
  'Varun', 'Shruti', 'Pankaj', 'Tanya', 'Kunal',
];

const indianLastNames = [
  'Sharma', 'Singh', 'Kumar', 'Gupta', 'Patel', 'Desai', 'Malhotra', 'Reddy',
  'Mehta', 'Joshi', 'Verma', 'Gandhi', 'Iyer', 'Nair', 'Pillai', 'Rao',
  'Chauhan', 'Agarwal', 'Mishra', 'Pandey', 'Tiwari', 'Saxena', 'Kapoor', 'Bhatia',
  'Chopra',
];

const grades = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
const sections = ['A', 'B', 'C'];
const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'History', 'Geography', 'Computer Science', 'Physics', 'Chemistry', 'Biology'];
const departments = ['Science', 'Mathematics', 'Languages', 'Administration', 'Sports', 'Arts', 'Commerce'];

const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      Student.deleteMany({}),
      Staff.deleteMany({}),
      Academic.deleteMany({}),
      Transaction.deleteMany({}),
      Fee.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ─── Seed Students ───
    const students = [];
    for (let i = 0; i < 45; i++) {
      const firstName = randomPick(indianFirstNames);
      const lastName = randomPick(indianLastNames);
      const grade = randomPick(grades);
      const section = randomPick(sections);

      students.push({
        name: `${firstName} ${lastName}`,
        rollNo: `2023${String(i + 1).padStart(3, '0')}`,
        grade: `${grade} - ${section}`,
        section,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        parentName: `${randomPick(indianFirstNames)} ${lastName}`,
        parentContact: `98${randomBetween(10000000, 99999999)}`,
        attendance: randomBetween(75, 100),
        status: Math.random() > 0.1 ? 'Active' : 'Inactive',
        admissionDate: new Date(2023, randomBetween(0, 6), randomBetween(1, 28)),
      });
    }
    const savedStudents = await Student.insertMany(students);
    console.log(`👨‍🎓 Seeded ${savedStudents.length} students`);

    // ─── Seed Staff ───
    const staffMembers = [];
    const teacherNames = [
      'R. K. Sharma', 'Dr. Anita Desai', 'Sunil Verma', 'Pooja Iyer', 'Kavita Singh',
      'Ramesh Tiwari', 'Sunita Rao', 'Alok Pandey', 'Meera Nair', 'Deepa Pillai',
      'Suresh Mishra', 'Nandini Kapoor', 'Vikas Saxena', 'Geeta Bhatia', 'Rajesh Chauhan',
      'Priya Agarwal', 'Manish Chopra', 'Seema Joshi', 'Anil Mehta', 'Kamla Devi',
    ];

    for (let i = 0; i < 25; i++) {
      const isTeacher = i < 18;
      const role = isTeacher ? 'Teacher' : randomPick(['Administrator', 'Support Staff', 'Librarian', 'Accountant']);
      const name = i < teacherNames.length ? teacherNames[i] : `${randomPick(indianFirstNames)} ${randomPick(indianLastNames)}`;

      staffMembers.push({
        name,
        employeeId: `TCH-${String(i + 1).padStart(3, '0')}`,
        role,
        department: randomPick(departments),
        subjects: isTeacher ? [randomPick(subjects), randomPick(subjects)] : [],
        classes: isTeacher ? [randomPick(grades), randomPick(grades)] : [],
        phone: `98${randomBetween(10000000, 99999999)}`,
        salary: randomBetween(25000, 80000),
        workload: randomPick(['Low', 'Medium', 'High']),
        status: Math.random() > 0.15 ? 'Active' : 'On Leave',
        joiningDate: new Date(randomBetween(2015, 2023), randomBetween(0, 11), randomBetween(1, 28)),
      });
    }
    const savedStaff = await Staff.insertMany(staffMembers);
    console.log(`👩‍🏫 Seeded ${savedStaff.length} staff members`);

    // ─── Seed Academics ───
    const academics = [];
    for (let i = 0; i < 25; i++) {
      const subject = randomPick(subjects);
      const grade = randomPick(grades);

      academics.push({
        subject,
        gradeLevel: `${grade} Grade`,
        section: randomPick(sections),
        teacherName: randomPick(teacherNames),
        studentsEnrolled: randomBetween(20, 40),
        status: Math.random() > 0.1 ? 'Active' : 'Archived',
      });
    }
    const savedAcademics = await Academic.insertMany(academics);
    console.log(`📚 Seeded ${savedAcademics.length} academic records`);

    // ─── Seed Transactions ───
    const categories = ['Tuition', 'Transport', 'Salary', 'Maintenance', 'Library', 'Lab Fees', 'Sports'];
    const transactions = [];
    for (let i = 0; i < 45; i++) {
      const type = Math.random() > 0.4 ? 'Fee Collection' : 'Expense';

      transactions.push({
        refId: `TXN-2023-${String(randomBetween(1000, 9999))}`,
        type,
        category: randomPick(categories),
        amount: randomBetween(1000, 50000),
        date: new Date(2023, randomBetween(6, 8), randomBetween(1, 30)),
        studentName: type === 'Fee Collection' ? `${randomPick(indianFirstNames)} ${randomPick(indianLastNames)}` : undefined,
        description: type === 'Fee Collection' ? 'Term fee payment' : 'Monthly expense',
        paymentMethod: randomPick(['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online']),
        status: Math.random() > 0.1 ? 'Completed' : 'Pending',
      });
    }
    const savedTransactions = await Transaction.insertMany(transactions);
    console.log(`💰 Seeded ${savedTransactions.length} transactions`);

    // ─── Seed Pending Fees ───
    const feeStatuses = ['Collected', 'Due this month', 'Overdue'];
    const fees = [];
    for (let i = 0; i < 12; i++) {
      const student = savedStudents[i];
      fees.push({
        student: student._id,
        studentName: student.name,
        classSection: student.grade,
        parentContact: student.parentContact,
        amount: randomBetween(1000, 3500),
        dueDate: new Date(2023, 7, randomBetween(14, 18)),
        status: randomPick(feeStatuses),
      });
    }
    const savedFees = await Fee.insertMany(fees);
    console.log(`📋 Seeded ${savedFees.length} pending fee records`);

    // ─── Seed Users ───
    const usersToSeed = [
      { uniqueId: 'PRIN-001', password: 'password123', role: 'principal' },
      { uniqueId: 'ADM-001', password: 'password123', role: 'admin' },
      { uniqueId: 'TCH-001', password: 'password123', role: 'teacher' },
      { uniqueId: 'STU-001', password: 'password123', role: 'student' }
    ];
    const savedUsers = await User.insertMany(usersToSeed);
    console.log(`🔐 Seeded ${savedUsers.length} user accounts for testing`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

seed();
