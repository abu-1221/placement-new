const express = require('express');
const { Sequelize, Op } = require('sequelize');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./database');
const User = require('./models/User');
const Test = require('./models/Test');
const Result = require('./models/Result');
const ActivityLog = require('./models/ActivityLog');
const TestAssignment = require('./models/TestAssignment');

// ═══════════════ MODEL ASSOCIATIONS ═══════════════
Test.hasMany(TestAssignment, { foreignKey: 'testId', onDelete: 'CASCADE' });
TestAssignment.belongsTo(Test, { foreignKey: 'testId' });
Test.hasMany(Result, { foreignKey: 'testId', onDelete: 'CASCADE' });
Result.belongsTo(Test, { foreignKey: 'testId' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the parent directory (root of the app)
app.use(express.static(path.join(__dirname, '..')));

// Helper: log an activity
async function logActivity(action, username, userType, details, req) {
  try {
    await ActivityLog.create({
      action,
      username,
      userType: userType || null,
      details: details || null,
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip) : null
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

// === AUTH ROUTES ===
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, type, name, details } = req.body;
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const user = await User.create({ username, password, type, name, details });
    await logActivity('register', username, type, { name, details }, req);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username, password } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Track last login
    await user.update({ lastLoginAt: new Date() });

    await logActivity('login', username, user.type, null, req);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === TEST ROUTES (STUDENT) ===
app.get('/api/tests/available', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json([]); // STRICT: No username, no tests

    // 1. Get all assignments for this student that are 'not_started'
    const assignments = await TestAssignment.findAll({
      where: {
        studentUsername: username,
        status: 'not_started'
      }
    });

    // 2. Cross-reference with Results table to ensure NO PREVIOUS ATTEMPT exists
    // This is the fail-safe to prevent duplicates
    const results = await Result.findAll({
      where: { username },
      attributes: ['testId']
    });
    const completedTestIds = results.map(r => String(r.testId));

    const assignedIds = assignments
      .map(a => String(a.testId))
      .filter(id => !completedTestIds.includes(id));

    if (assignedIds.length === 0) return res.json([]);

    const tests = await Test.findAll({
      where: {
        id: assignedIds,
        status: ['active', 'published']
      }
    });
    res.json(tests);
  } catch (err) {
    console.error('[Available Tests API] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// START ATTEMPT: Mark test as in_progress immediately
app.post('/api/tests/start-attempt', async (req, res) => {
  try {
    const { testId, username } = req.body;

    // 1. Check if Result already exists (Fail-safe: ABSOLUTELY NO re-entry after submission)
    const existingResult = await Result.findOne({ where: { testId, username } });
    if (existingResult) {
      return res.status(403).json({ error: 'This assessment has already been submitted. Re-entry is strictly prohibited.' });
    }

    // 2. Check assignment exists
    const assignment = await TestAssignment.findOne({
      where: { testId, studentUsername: username }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assessment assignment not found for your account.' });
    }

    // 3. Handle status transitions
    if (assignment.status === 'submitted') {
      return res.status(403).json({ error: 'This assessment was already submitted. You cannot retake it.' });
    }

    // Allow 'in_progress' to resume (browser refresh, connection lost) — but only if no Result exists (checked above)
    if (assignment.status === 'in_progress') {
      console.log(`[Start Attempt] Resuming in_progress test ${testId} for ${username}`);
      return res.json({ success: true, message: 'Resuming in-progress assessment.' });
    }

    // 4. First-time start: Update status to 'in_progress'
    await assignment.update({ status: 'in_progress', startedAt: new Date() });

    await logActivity('start_test', username, 'student', { testId }, req);

    res.json({ success: true, message: 'Attempt authorized and locked.' });
  } catch (err) {
    console.error('[Start Attempt API] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tests/:id', async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tests/submit', async (req, res) => {
  try {
    // 1. Create Result
    const result = await Result.create(req.body);

    // 2. Update Assignment status to submitted
    await TestAssignment.update(
      { status: 'submitted', submittedAt: new Date() },
      { where: { testId: req.body.testId, studentUsername: req.body.username } }
    );

    await logActivity('submit_test', req.body.username, 'student', {
      testId: req.body.testId,
      testName: req.body.testName,
      score: req.body.score
    }, req);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/results/student/:username', async (req, res) => {
  try {
    const username = req.params.username;

    // 1. Fetch official results
    const results = await Result.findAll({
      where: { username },
      order: [['date', 'DESC']]
    });

    // 2. Fetch all assignments where status is NOT 'not_started'
    // (This covers 'in_progress' and 'submitted')
    const attemptedAssignments = await TestAssignment.findAll({
      where: {
        studentUsername: username,
        status: { [Op.ne]: 'not_started' }
      }
    });

    // 3. Find assignments that don't have a Result record yet (e.g. abandoned midway)
    const resultTestIds = results.map(r => String(r.testId));
    const incompleteAssignments = attemptedAssignments.filter(a => !resultTestIds.includes(String(a.testId)));

    if (incompleteAssignments.length > 0) {
      const testIds = incompleteAssignments.map(a => a.testId);
      const tests = await Test.findAll({ where: { id: testIds } });

      const incompleteResults = incompleteAssignments.map(a => {
        const test = tests.find(t => String(t.id) === String(a.testId));
        return {
          id: `incomplete_${a.id}`,
          testId: a.testId,
          testName: test ? test.name : 'Unknown Assessment',
          company: test ? test.company : 'N/A',
          score: 0,
          status: a.status === 'in_progress' ? 'incomplete' : 'submitted',
          date: a.updatedAt || a.assignedAt,
          isIncomplete: true
        };
      });

      // Merge and sort
      const merged = [...results, ...incompleteResults].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
      });
      return res.json(merged);
    }

    res.json(results);
  } catch (err) {
    console.error('[Results API] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/staff/test-participation/:testId', async (req, res) => {
  try {
    const testId = req.params.testId;
    console.log(`[STMAI] Syncing participation for Test ID: ${testId}`);

    // 1. Fetch Test
    const test = await Test.findByPk(testId);
    if (!test) return res.status(404).json({ error: 'Assessment not found' });

    // 2. Fetch all explicit assignments for this test
    const assignments = await TestAssignment.findAll({ where: { testId } });
    const assignedUsernames = assignments.map(a => a.studentUsername);

    // 3. Fetch all students who have a Result record for this test
    const results = await Result.findAll({ where: { testId } });
    const resultUsernames = results.map(r => r.username);

    // 4. Get the union of all students who were either assigned or have results
    const unionUsernames = [...new Set([...assignedUsernames, ...resultUsernames])];

    let finalUsers = [];
    if (unionUsernames.length > 0) {
      finalUsers = await User.findAll({
        where: { username: { [Op.in]: unionUsernames } },
        attributes: ['username', 'name', 'details']
      });
    }

    const report = finalUsers.map(s => {
      const result = results.find(r => r.username === s.username);
      const assignment = assignments.find(a => a.studentUsername === s.username);
      const studentDetails = s.details || {};

      // Determine 'attended' status: true if they have a result OR if their assignment status is not 'not_started'
      const isAttended = !!result || (assignment && assignment.status !== 'not_started');

      // Determine display status
      let displayStatus = 'NOT STARTED';
      if (result) displayStatus = result.status.toUpperCase();
      else if (assignment && assignment.status === 'in_progress') displayStatus = 'IN PROGRESS';
      else if (assignment && assignment.status === 'submitted') displayStatus = 'SUBMITTED';

      return {
        username: s.username, // Acts as Register Number
        registerNumber: studentDetails.registerNumber || s.username,
        name: s.name || studentDetails.fullName || s.username,
        attended: isAttended,
        score: result ? result.score : (isAttended ? 0 : null),
        status: displayStatus,
        assignmentStatus: assignment ? assignment.status : 'not_assigned',
        section: studentDetails.section || 'N/A',
        department: studentDetails.department || 'N/A'
      };
    });

    console.log(`[STMAI] Sync Complete. Found ${report.length} participants.`);
    res.json(report);
  } catch (err) {
    console.error('[STMAI] API Error:', err);
    res.status(500).json({ error: err.message });
  }
});


// Real-time Update Handling (SSE)
let activeClients = [];

app.get('/api/realtime/updates', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  activeClients.push(newClient);

  req.on('close', () => {
    activeClients = activeClients.filter(c => c.id !== clientId);
  });
});

function notifyClients(data) {
  activeClients.forEach(c => c.res.write(`data: ${JSON.stringify(data)}\n\n`));
}

// === STAFF ROUTES ===
app.post('/api/staff/create-test', async (req, res) => {
  try {
    // 1. Create the base Test
    const test = await Test.create(req.body);

    // 2. Fetch ALL students
    const allStudents = await User.findAll({ where: { type: 'student' } });

    if (allStudents.length === 0) {
      await test.destroy();
      return res.status(400).json({ error: 'No students are registered in the system. Please register students first.' });
    }

    // 3. Parse target audience criteria
    const { departments = [], years = [], sections = [], genders = [] } = test.targetAudience || {};

    // Check if ANY filtering is applied — if all arrays are empty, assign to EVERYONE
    const hasFilters = departments.length > 0 || years.length > 0 || sections.length > 0 || genders.length > 0;

    let targetStudents;

    if (!hasFilters) {
      // No filters → assign to ALL students
      console.log(`[Create Test] No audience filters - assigning to ALL ${allStudents.length} students.`);
      targetStudents = allStudents;
    } else {
      // Filter students matching the criteria
      targetStudents = allStudents.filter(student => {
        const d = student.details || {};

        // Each criterion: if the filter array is non-empty, the student field must match
        // If the filter array is empty, that criterion is not applied (matches all)
        const deptMatch = departments.length === 0 || departments.includes(d.department);
        const yearMatch = years.length === 0 || years.includes(d.year) || years.includes(String(d.year));
        const sectionMatch = sections.length === 0 || sections.includes(d.section);
        const genderMatch = genders.length === 0 || genders.includes(d.gender);

        return deptMatch && yearMatch && sectionMatch && genderMatch;
      });

      console.log(`[Create Test] Filters applied: Depts=${departments}, Years=${years}, Sections=${sections}, Genders=${genders}`);
      console.log(`[Create Test] Matched ${targetStudents.length} of ${allStudents.length} students.`);
    }

    if (targetStudents.length === 0) {
      // Don't destroy the test — just inform staff with a helpful message
      // Assign to ALL students as fallback to avoid orphaned tests
      console.log('[Create Test] No students matched filters — falling back to ALL students.');
      targetStudents = allStudents;
    }

    // 4. Bulk insert assignments
    const assignments = targetStudents.map(s => ({
      testId: test.id,
      studentUsername: s.username
    }));
    await TestAssignment.bulkCreate(assignments);

    // Log the activity
    await logActivity('publish_test', req.body.createdBy || 'staff', 'staff', {
      testId: test.id, testName: test.name, company: test.company,
      questionCount: test.questions ? (typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions).length : 0,
      assignedCount: targetStudents.length
    }, req);

    // 5. Trigger real-time update
    notifyClients({ type: 'test_published', testName: test.name, company: test.company, assignedCount: targetStudents.length });

    res.json({ success: true, test, assignedCount: targetStudents.length });
  } catch (err) {
    console.error('[Create Test] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/results/all', async (req, res) => {
  try {
    const results = await Result.findAll();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/staff/students', async (req, res) => {
  try {
    const students = await User.findAll({
      where: { type: 'student' },
      attributes: { exclude: ['password'] }
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/staff/tests', async (req, res) => {
  try {
    const tests = await Test.findAll({ order: [['createdAt', 'DESC']] });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/tests/:id', async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    const testName = test ? test.name : 'Unknown';

    // Cascade: delete assignments and results for this test
    await TestAssignment.destroy({ where: { testId: req.params.id } });
    await Result.destroy({ where: { testId: req.params.id } });
    await Test.destroy({ where: { id: req.params.id } });

    await logActivity('delete_test', 'staff', 'staff', { testId: req.params.id, testName }, req);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/students/:username', async (req, res) => {
  try {
    const username = req.params.username;

    // Cascade: remove student's assignments and results
    await TestAssignment.destroy({ where: { studentUsername: username } });
    await Result.destroy({ where: { username } });
    await User.destroy({ where: { username, type: 'student' } });

    await logActivity('delete_student', 'staff', 'staff', { deletedUsername: username }, req);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === CODE EXECUTION ENGINE (Secure Backend VM) ===
const vm = require('vm');

app.post('/api/code/execute', async (req, res) => {
  const { code, language = 'javascript' } = req.body;

  if (language.toLowerCase() !== 'javascript') {
    return res.json({
      success: true,
      output: `[System] ${language.toUpperCase()} execution is currently in 'Simulation Mode'. \nTo enable full runtime, please integrate Judge0 or Docker on your server.\n\nCode detected: \n${code.substring(0, 50)}...`,
      simulated: true
    });
  }

  let output = [];
  const sandbox = {
    console: {
      log: (...args) => {
        output.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
      }
    }
  };

  try {
    const script = new vm.Script(code);
    const context = vm.createContext(sandbox);
    script.runInContext(context, { timeout: 2000 });

    res.json({
      success: true,
      output: output.join('\n'),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      output: output.join('\n')
    });
  }
});

// === ACTIVITY LOG ROUTES ===
app.get('/api/activity-logs', async (req, res) => {
  try {
    const { limit = 100, action, username } = req.query;
    const where = {};
    if (action) where.action = action;
    if (username) where.username = username;
    const logs = await ActivityLog.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit)
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export for Vercel serverless
module.exports = app;

if (require.main === module) {
  // Initialization for local/Render
  sequelize.sync().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(err => console.error('Database sync error:', err));
}
