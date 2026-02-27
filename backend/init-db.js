/**
 * ═══════════════════════════════════════════════════════════════════
 *  JMC Placement Portal — Database Initialization & Seed Script
 *  Jamal Mohamed College (Autonomous), Tiruchirappalli
 * ═══════════════════════════════════════════════════════════════════
 *
 *  This script:
 *    1. Drops all existing tables (force: true)
 *    2. Creates fresh tables with proper schema
 *    3. Defines model associations
 *    4. Seeds realistic demo data
 *
 *  Run: node init-db.js
 * ═══════════════════════════════════════════════════════════════════
 */

const sequelize = require('./database');
const User = require('./models/User');
const Test = require('./models/Test');
const Result = require('./models/Result');
const ActivityLog = require('./models/ActivityLog');
const TestAssignment = require('./models/TestAssignment');

// ═══════════════ MODEL ASSOCIATIONS ═══════════════
// Test → TestAssignment (One-to-Many)
Test.hasMany(TestAssignment, { foreignKey: 'testId', onDelete: 'CASCADE' });
TestAssignment.belongsTo(Test, { foreignKey: 'testId' });

// Test → Result (One-to-Many)
Test.hasMany(Result, { foreignKey: 'testId', onDelete: 'CASCADE' });
Result.belongsTo(Test, { foreignKey: 'testId' });

async function init() {
    try {
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║   JMC Placement Portal — Database Initializer   ║');
        console.log('╚══════════════════════════════════════════════════╝');
        console.log();

        // 1. Force sync — drops and recreates all tables
        await sequelize.sync({ force: true });
        console.log('✓ Database purged and schema created.\n');

        // ═══════════════ STAFF ACCOUNTS ═══════════════
        console.log('── Creating Staff Accounts ──');

        const staff1 = await User.create({
            username: 'STF001',
            password: 'password123',
            name: 'Dr. Iqbal Ahmed',
            type: 'staff',
            email: 'iqbal.ahmed@jmc.edu',
            details: {
                staffCode: 'STF001',
                department: 'Computer Science',
                designation: 'HOD & Associate Professor'
            }
        });

        const staff2 = await User.create({
            username: 'STF002',
            password: 'password123',
            name: 'Prof. Meera Krishnan',
            type: 'staff',
            email: 'meera.k@jmc.edu',
            details: {
                staffCode: 'STF002',
                department: 'Information Technology',
                designation: 'Assistant Professor'
            }
        });

        console.log(`  ✓ ${staff1.name} (${staff1.username})`);
        console.log(`  ✓ ${staff2.name} (${staff2.username})`);

        // ═══════════════ STUDENT ACCOUNTS ═══════════════
        console.log('\n── Creating Student Accounts ──');

        const students = await User.bulkCreate([
            {
                username: '2024CSE001',
                password: '24052006', // DOB: 24-05-2006
                name: 'Abu Bakar S',
                type: 'student',
                email: 'abubakar@student.jmc.edu',
                details: {
                    registerNumber: '2024CSE001',
                    department: 'Computer Science',
                    year: '4',
                    section: 'A',
                    gender: 'Male',
                    batch: '2022-2026',
                    streamType: 'UG',
                    dob: '2006-05-24'
                }
            },
            {
                username: '2024CSE002',
                password: '15031005', // DOB: 15-03-2005
                name: 'Priya Dharshini R',
                type: 'student',
                email: 'priya.d@student.jmc.edu',
                details: {
                    registerNumber: '2024CSE002',
                    department: 'Computer Science',
                    year: '4',
                    section: 'A',
                    gender: 'Female',
                    batch: '2022-2026',
                    streamType: 'UG',
                    dob: '2005-03-15'
                }
            },
            {
                username: '2024CSE003',
                password: '22072005', // DOB: 22-07-2005
                name: 'Mohammed Farhan K',
                type: 'student',
                email: 'farhan.k@student.jmc.edu',
                details: {
                    registerNumber: '2024CSE003',
                    department: 'Computer Science',
                    year: '3',
                    section: 'B',
                    gender: 'Male',
                    batch: '2023-2026',
                    streamType: 'UG',
                    dob: '2005-07-22'
                }
            },
            {
                username: '2024IT001',
                password: '10112004', // DOB: 10-11-2004
                name: 'Kavitha Lakshmi M',
                type: 'student',
                email: 'kavitha.l@student.jmc.edu',
                details: {
                    registerNumber: '2024IT001',
                    department: 'Information Technology',
                    year: '4',
                    section: 'A',
                    gender: 'Female',
                    batch: '2022-2026',
                    streamType: 'UG',
                    dob: '2004-11-10'
                }
            },
            {
                username: '2024IT002',
                password: '05062005', // DOB: 05-06-2005
                name: 'Rajesh Kumar S',
                type: 'student',
                email: 'rajesh.k@student.jmc.edu',
                details: {
                    registerNumber: '2024IT002',
                    department: 'Information Technology',
                    year: '3',
                    section: 'A',
                    gender: 'Male',
                    batch: '2023-2026',
                    streamType: 'UG',
                    dob: '2005-06-05'
                }
            },
            {
                username: '2024MATH001',
                password: '18091005', // DOB: 18-09-2005
                name: 'Aishwarya V',
                type: 'student',
                email: 'aishwarya.v@student.jmc.edu',
                details: {
                    registerNumber: '2024MATH001',
                    department: 'Mathematics',
                    year: '2',
                    section: 'A',
                    gender: 'Female',
                    batch: '2024-2027',
                    streamType: 'UG',
                    dob: '2005-09-18'
                }
            },
            {
                username: '2024COM001',
                password: '30012005', // DOB: 30-01-2005
                name: 'Suresh Babu T',
                type: 'student',
                email: 'suresh.b@student.jmc.edu',
                details: {
                    registerNumber: '2024COM001',
                    department: 'Commerce',
                    year: '3',
                    section: 'B',
                    gender: 'Male',
                    batch: '2023-2026',
                    streamType: 'UG',
                    dob: '2005-01-30'
                }
            },
            {
                username: '2024ENG001',
                password: '12042005', // DOB: 12-04-2005
                name: 'Fathima Zahra N',
                type: 'student',
                email: 'fathima.z@student.jmc.edu',
                details: {
                    registerNumber: '2024ENG001',
                    department: 'English',
                    year: '2',
                    section: 'A',
                    gender: 'Female',
                    batch: '2024-2027',
                    streamType: 'UG',
                    dob: '2005-04-12'
                }
            },
            {
                username: '2024PHY001',
                password: '25082004', // DOB: 25-08-2004
                name: 'Karthik Rajan P',
                type: 'student',
                email: 'karthik.r@student.jmc.edu',
                details: {
                    registerNumber: '2024PHY001',
                    department: 'Physics',
                    year: '4',
                    section: 'A',
                    gender: 'Male',
                    batch: '2022-2026',
                    streamType: 'UG',
                    dob: '2004-08-25'
                }
            },
            {
                username: 'student_demo_01',
                password: '123456',
                name: 'Demo Student',
                type: 'student',
                email: 'demo@student.jmc.edu',
                details: {
                    registerNumber: 'student_demo_01',
                    department: 'Computer Science',
                    year: '4',
                    section: 'A',
                    gender: 'Male',
                    batch: '2022-2026',
                    streamType: 'UG',
                    dob: '2000-01-01'
                }
            }
        ]);

        students.forEach(s => console.log(`  ✓ ${s.name} (${s.username}) — ${s.details.department}, Year ${s.details.year}`));

        // ═══════════════ TESTS ═══════════════
        console.log('\n── Creating Tests ──');

        const test1 = await Test.create({
            name: 'Aptitude & Technical Assessment',
            company: 'Google',
            duration: 30,
            description: 'Phase 1 screening for Software Engineering roles. Covers data structures, algorithms, and problem-solving.',
            date: '2026-03-05',
            questions: [
                {
                    question: 'What is the time complexity of searching in a Hash Map (average case)?',
                    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
                    answer: 'A'
                },
                {
                    question: 'Which HTTP method is considered idempotent?',
                    options: ['POST', 'GET', 'PATCH', 'CONNECT'],
                    answer: 'B'
                },
                {
                    question: 'In SQL, which clause is used to filter groups?',
                    options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'],
                    answer: 'C'
                },
                {
                    question: 'What does CSS stand for?',
                    options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
                    answer: 'B'
                },
                {
                    question: 'Which data structure uses LIFO (Last In, First Out) principle?',
                    options: ['Queue', 'Stack', 'Linked List', 'Array'],
                    answer: 'B'
                }
            ],
            createdBy: 'STF001',
            status: 'published',
            passingPercentage: 50,
            targetAudience: {
                departments: ['Computer Science', 'Information Technology'],
                years: [],
                sections: [],
                genders: []
            }
        });

        const test2 = await Test.create({
            name: 'Quantitative Aptitude Round',
            company: 'TCS',
            duration: 45,
            description: 'TCS National Qualifier Test — Quantitative Aptitude and Logical Reasoning section for all streams.',
            date: '2026-03-10',
            questions: [
                {
                    question: 'If 3x + 7 = 22, what is the value of x?',
                    options: ['3', '5', '7', '15'],
                    answer: 'B'
                },
                {
                    question: 'A train travels 120 km in 2 hours. What is its speed?',
                    options: ['40 km/h', '50 km/h', '60 km/h', '80 km/h'],
                    answer: 'C'
                },
                {
                    question: 'What comes next in the series: 2, 6, 12, 20, ?',
                    options: ['28', '30', '32', '36'],
                    answer: 'B'
                },
                {
                    question: 'If a product costs ₹800 after a 20% discount, what was the original price?',
                    options: ['₹960', '₹1000', '₹1100', '₹1200'],
                    answer: 'B'
                },
                {
                    question: 'What is 15% of 240?',
                    options: ['32', '34', '36', '38'],
                    answer: 'C'
                },
                {
                    question: 'Simplify: (25 × 4) ÷ 10 + 3²',
                    options: ['17', '19', '21', '23'],
                    answer: 'B'
                }
            ],
            createdBy: 'STF001',
            status: 'published',
            passingPercentage: 40,
            targetAudience: {
                departments: [],
                years: ['3', '4'],
                sections: [],
                genders: []
            }
        });

        const test3 = await Test.create({
            name: 'Full Stack Developer Assessment',
            company: 'Infosys',
            duration: 60,
            description: 'InfyTQ assessment for Full Stack Developer roles. Covers HTML, CSS, JavaScript, React, Node.js, and databases.',
            date: '2026-03-15',
            questions: [
                {
                    question: 'Which tag is used to define an unordered list in HTML?',
                    options: ['<ol>', '<ul>', '<li>', '<list>'],
                    answer: 'B'
                },
                {
                    question: 'What is the default position value in CSS?',
                    options: ['relative', 'absolute', 'static', 'fixed'],
                    answer: 'C'
                },
                {
                    question: 'Which method is used to add an element at the end of an array in JavaScript?',
                    options: ['push()', 'append()', 'add()', 'insert()'],
                    answer: 'A'
                },
                {
                    question: 'In React, what hook is used to manage state in functional components?',
                    options: ['useEffect', 'useState', 'useContext', 'useReducer'],
                    answer: 'B'
                },
                {
                    question: 'Which Node.js module is used to create a web server?',
                    options: ['fs', 'http', 'path', 'url'],
                    answer: 'B'
                },
                {
                    question: 'What does REST stand for?',
                    options: [
                        'Representational State Transfer',
                        'Remote Execution Service Technology',
                        'Request-Entry Secure Transmission',
                        'Resource Endpoint Standard Type'
                    ],
                    answer: 'A'
                },
                {
                    question: 'Which SQL statement is used to insert new data?',
                    options: ['ADD', 'INSERT INTO', 'UPDATE', 'CREATE'],
                    answer: 'B'
                }
            ],
            createdBy: 'STF002',
            status: 'published',
            passingPercentage: 50,
            targetAudience: {
                departments: ['Computer Science', 'Information Technology'],
                years: ['4'],
                sections: [],
                genders: []
            }
        });

        const test4 = await Test.create({
            name: 'Communication & Soft Skills',
            company: 'Wipro',
            duration: 20,
            description: 'Wipro Elite NLTH — English communication, grammar, and professional soft skills evaluation.',
            date: '2026-03-20',
            questions: [
                {
                    question: 'Choose the correct spelling:',
                    options: ['Accomodation', 'Accommodation', 'Acommodation', 'Acomodation'],
                    answer: 'B'
                },
                {
                    question: '"She has been working here _____ 2019." Fill in the blank:',
                    options: ['for', 'since', 'from', 'by'],
                    answer: 'B'
                },
                {
                    question: 'What is the passive voice of: "The teacher taught the lesson"?',
                    options: [
                        'The lesson was taught by the teacher',
                        'The lesson is taught by the teacher',
                        'The lesson has been taught by the teacher',
                        'The lesson will be taught by the teacher'
                    ],
                    answer: 'A'
                },
                {
                    question: 'Which is an example of a closed-ended question?',
                    options: [
                        'How do you feel about this?',
                        'What are your suggestions?',
                        'Did you finish the report?',
                        'Why do you think so?'
                    ],
                    answer: 'C'
                }
            ],
            createdBy: 'STF002',
            status: 'published',
            passingPercentage: 50,
            targetAudience: {
                departments: [],
                years: [],
                sections: [],
                genders: []
            }
        });

        console.log(`  ✓ ${test1.name} — ${test1.company} (${test1.questions.length} questions, ${test1.duration}min)`);
        console.log(`  ✓ ${test2.name} — ${test2.company} (${test2.questions.length} questions, ${test2.duration}min)`);
        console.log(`  ✓ ${test3.name} — ${test3.company} (${test3.questions.length} questions, ${test3.duration}min)`);
        console.log(`  ✓ ${test4.name} — ${test4.company} (${test4.questions.length} questions, ${test4.duration}min)`);

        // ═══════════════ TEST ASSIGNMENTS ═══════════════
        console.log('\n── Creating Test Assignments ──');

        // Test 1 (Google) — CS & IT students
        const csItStudents = students.filter(s => ['Computer Science', 'Information Technology'].includes(s.details.department));
        const test1Assignments = csItStudents.map(s => ({
            testId: test1.id,
            studentUsername: s.username,
            status: 'not_started'
        }));
        await TestAssignment.bulkCreate(test1Assignments);
        console.log(`  ✓ ${test1.name} → Assigned to ${test1Assignments.length} CS/IT students`);

        // Test 2 (TCS) — All 3rd & 4th year students
        const senior = students.filter(s => ['3', '4'].includes(s.details.year));
        const test2Assignments = senior.map(s => ({
            testId: test2.id,
            studentUsername: s.username,
            status: 'not_started'
        }));
        await TestAssignment.bulkCreate(test2Assignments);
        console.log(`  ✓ ${test2.name} → Assigned to ${test2Assignments.length} senior students`);

        // Test 3 (Infosys) — 4th year CS & IT
        const finalYear = csItStudents.filter(s => s.details.year === '4');
        const test3Assignments = finalYear.map(s => ({
            testId: test3.id,
            studentUsername: s.username,
            status: 'not_started'
        }));
        await TestAssignment.bulkCreate(test3Assignments);
        console.log(`  ✓ ${test3.name} → Assigned to ${test3Assignments.length} final-year CS/IT students`);

        // Test 4 (Wipro) — ALL students
        const test4Assignments = students.map(s => ({
            testId: test4.id,
            studentUsername: s.username,
            status: 'not_started'
        }));
        await TestAssignment.bulkCreate(test4Assignments);
        console.log(`  ✓ ${test4.name} → Assigned to ${test4Assignments.length} students (ALL)`);

        // ═══════════════ SAMPLE RESULTS (Pre-completed tests) ═══════════════
        console.log('\n── Creating Sample Results ──');

        // Priya completed Test 2 (TCS)
        await Result.create({
            username: '2024CSE002',
            testId: test2.id,
            testName: test2.name,
            company: test2.company,
            score: 83,
            correctCount: 5,
            totalQuestions: 6,
            status: 'passed',
            answers: { 0: 'B', 1: 'C', 2: 'B', 3: 'B', 4: 'C', 5: 'A' },
            questions: test2.questions,
            timeTaken: 1250,
            date: new Date()
        });
        await TestAssignment.update(
            { status: 'submitted', submittedAt: new Date() },
            { where: { testId: test2.id, studentUsername: '2024CSE002' } }
        );
        console.log('  ✓ Priya Dharshini → TCS (83% — Passed)');

        // Rajesh completed Test 2 (TCS)
        await Result.create({
            username: '2024IT002',
            testId: test2.id,
            testName: test2.name,
            company: test2.company,
            score: 50,
            correctCount: 3,
            totalQuestions: 6,
            status: 'passed',
            answers: { 0: 'B', 1: 'A', 2: 'B', 3: 'C', 4: 'A', 5: 'B' },
            questions: test2.questions,
            timeTaken: 2100,
            date: new Date()
        });
        await TestAssignment.update(
            { status: 'submitted', submittedAt: new Date() },
            { where: { testId: test2.id, studentUsername: '2024IT002' } }
        );
        console.log('  ✓ Rajesh Kumar → TCS (50% — Passed)');

        // Karthik completed Test 4 (Wipro)
        await Result.create({
            username: '2024PHY001',
            testId: test4.id,
            testName: test4.name,
            company: test4.company,
            score: 25,
            correctCount: 1,
            totalQuestions: 4,
            status: 'failed',
            answers: { 0: 'A', 1: 'A', 2: 'C', 3: 'B' },
            questions: test4.questions,
            timeTaken: 600,
            date: new Date()
        });
        await TestAssignment.update(
            { status: 'submitted', submittedAt: new Date() },
            { where: { testId: test4.id, studentUsername: '2024PHY001' } }
        );
        console.log('  ✓ Karthik Rajan → Wipro (25% — Failed)');

        // ═══════════════ ACTIVITY LOGS ═══════════════
        console.log('\n── Seeding Activity Logs ──');

        await ActivityLog.bulkCreate([
            { action: 'register', username: 'STF001', userType: 'staff', details: { name: 'Dr. Iqbal Ahmed' }, timestamp: new Date(Date.now() - 86400000 * 7) },
            { action: 'register', username: 'STF002', userType: 'staff', details: { name: 'Prof. Meera Krishnan' }, timestamp: new Date(Date.now() - 86400000 * 6) },
            { action: 'register', username: '2024CSE001', userType: 'student', details: { name: 'Abu Bakar S' }, timestamp: new Date(Date.now() - 86400000 * 5) },
            { action: 'register', username: '2024CSE002', userType: 'student', details: { name: 'Priya Dharshini R' }, timestamp: new Date(Date.now() - 86400000 * 5) },
            { action: 'register', username: 'student_demo_01', userType: 'student', details: { name: 'Demo Student' }, timestamp: new Date(Date.now() - 86400000 * 4) },
            { action: 'publish_test', username: 'STF001', userType: 'staff', details: { testName: test1.name, company: test1.company, assignedCount: test1Assignments.length }, timestamp: new Date(Date.now() - 86400000 * 3) },
            { action: 'publish_test', username: 'STF001', userType: 'staff', details: { testName: test2.name, company: test2.company, assignedCount: test2Assignments.length }, timestamp: new Date(Date.now() - 86400000 * 2) },
            { action: 'publish_test', username: 'STF002', userType: 'staff', details: { testName: test3.name, company: test3.company, assignedCount: test3Assignments.length }, timestamp: new Date(Date.now() - 86400000 * 1) },
            { action: 'publish_test', username: 'STF002', userType: 'staff', details: { testName: test4.name, company: test4.company, assignedCount: test4Assignments.length }, timestamp: new Date(Date.now() - 86400000 * 1) },
            { action: 'login', username: 'STF001', userType: 'staff', timestamp: new Date(Date.now() - 3600000) },
            { action: 'submit_test', username: '2024CSE002', userType: 'student', details: { testName: test2.name, score: 83 }, timestamp: new Date(Date.now() - 7200000) },
            { action: 'submit_test', username: '2024IT002', userType: 'student', details: { testName: test2.name, score: 50 }, timestamp: new Date(Date.now() - 5400000) },
            { action: 'submit_test', username: '2024PHY001', userType: 'student', details: { testName: test4.name, score: 25 }, timestamp: new Date(Date.now() - 3000000) },
        ]);
        console.log('  ✓ 13 activity log entries created');

        // ═══════════════ FINAL SUMMARY ═══════════════
        const totalUsers = await User.count();
        const totalStudents = await User.count({ where: { type: 'student' } });
        const totalStaff = await User.count({ where: { type: 'staff' } });
        const totalTests = await Test.count();
        const totalAssign = await TestAssignment.count();
        const totalResults = await Result.count();
        const totalLogs = await ActivityLog.count();

        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║              DATABASE SUMMARY                    ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log(`║  Users:           ${String(totalUsers).padStart(3)} (${totalStaff} staff, ${totalStudents} students)  ║`);
        console.log(`║  Tests:           ${String(totalTests).padStart(3)}                            ║`);
        console.log(`║  Assignments:     ${String(totalAssign).padStart(3)}                            ║`);
        console.log(`║  Results:         ${String(totalResults).padStart(3)}                            ║`);
        console.log(`║  Activity Logs:   ${String(totalLogs).padStart(3)}                            ║`);
        console.log('╠══════════════════════════════════════════════════╣');
        console.log('║  LOGIN CREDENTIALS                               ║');
        console.log('║──────────────────────────────────────────────────║');
        console.log('║  STAFF:                                          ║');
        console.log('║    STF001 / password123  (Dr. Iqbal — CS HOD)    ║');
        console.log('║    STF002 / password123  (Prof. Meera — IT)      ║');
        console.log('║  STUDENTS:                                       ║');
        console.log('║    student_demo_01 / 123456  (Demo)              ║');
        console.log('║    2024CSE001 / DOB: 2006-05-24 (Abu Bakar)      ║');
        console.log('║    2024CSE002 / DOB: 2005-03-15 (Priya)          ║');
        console.log('║    2024CSE003 / DOB: 2005-07-22 (Farhan)         ║');
        console.log('║    2024IT001  / DOB: 2004-11-10 (Kavitha)        ║');
        console.log('║    2024IT002  / DOB: 2005-06-05 (Rajesh)         ║');
        console.log('╚══════════════════════════════════════════════════╝');

        process.exit(0);
    } catch (err) {
        console.error('\n✗ Initialization FAILED:', err);
        process.exit(1);
    }
}

init();
