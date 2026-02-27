const sequelize = require('./database');
const User = require('./models/User');
const Test = require('./models/Test');
const Result = require('./models/Result');

async function viewData() {
    try {
        await sequelize.sync(); // Ensure DB is synced

        console.log("\n=== 👥 USERS ===");
        const users = await User.findAll();
        if (users.length === 0) console.log("No users found.");
        else users.forEach(u => console.log(`- [${u.type}] ${u.username} (${u.name})`));

        console.log("\n=== 📝 TESTS ===");
        const tests = await Test.findAll();
        if (tests.length === 0) console.log("No tests found.");
        else tests.forEach(t => console.log(`- ${t.name} by ${t.company} (${t.duration} mins)`));

        console.log("\n=== 📊 RESULTS ===");
        const results = await Result.findAll();
        if (results.length === 0) console.log("No results found.");
        else results.forEach(r => console.log(`- ${r.username} scored ${r.score}% in ${r.testName}`));

    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        await sequelize.close();
    }
}

viewData();
