const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// 1. Initialize DB Connection matching existing setup
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'jmc_placement_portal.sqlite'),
    logging: false
});

// 2. Schema Design (Tables for Departments, Programmes, Categories, Administration, Facilities)

const Category = sequelize.define('Category', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g., "Govt. Aided Programmes – Men (UG & PG)"
    type: { type: DataTypes.STRING }, // e.g., "Aided" or "Self-Finance"
    gender: { type: DataTypes.STRING } // e.g., "Men", "Women", "Co-Ed"
});

const Department = sequelize.define('Department', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g., "Computer Science"
    description: { type: DataTypes.TEXT }
});

const Programme = sequelize.define('Programme', {
    name: { type: DataTypes.STRING, allowNull: false }, // e.g., "B.Sc. Computer Science"
    level: { type: DataTypes.STRING }, // e.g., "UG", "PG", "Ph.D"
});

// Relationships
Programme.belongsTo(Department);
Department.hasMany(Programme);

Programme.belongsTo(Category);
Category.hasMany(Programme);


const AdministrationDesk = sequelize.define('AdministrationDesk', {
    title: { type: DataTypes.STRING, allowNull: false }, // e.g., "Principal's Desk"
    occupant: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT }
});

const Facility = sequelize.define('Facility', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g., "Career Development Centre (CDC)"
    category: { type: DataTypes.STRING }, // e.g., "Infrastructure", "Student Support"
    description: { type: DataTypes.TEXT }
});

// 3. Execution function
async function seedDatabase() {
    try {
        console.log("Syncing database schema...");
        // This creates tables if they don't exist (and does nothing if they already exist, keeping old models safe)
        await sequelize.sync({ alter: true });

        console.log("Inserting Categories...");
        const aidedMen = await Category.upsert({ name: 'Govt. Aided Programmes – Men (UG & PG)', type: 'Aided', gender: 'Men' });
        const sfWomen = await Category.upsert({ name: 'Self Finance Programmes – Women (UG & PG)', type: 'Self-Finance', gender: 'Women' });
        const sfMen = await Category.upsert({ name: 'Self Finance Programmes – Men (UG & PG)', type: 'Self-Finance', gender: 'Men' });

        console.log("Inserting Departments...");
        const deps = [
            'Arabic', 'Business Administration', 'Bio Technology', 'Botany', 'Chemistry',
            'Commerce', 'Computer Science', 'Economics', 'English', 'Fashion Technology',
            'French', 'Hindi', 'History', 'Hotel Management', 'Information Technology',
            'Mathematics', 'Microbiology', 'Nutrition & Dietetics', 'Physics', 'Social Work',
            'Tamil', 'Urdu', 'Zoology', 'Physical Education', 'Visual Communication'
        ];

        for (const depName of deps) {
            await Department.upsert({ name: depName, description: `Department of ${depName}` });
        }

        console.log("Inserting Administration Desks...");
        await AdministrationDesk.upsert({ title: "Secretary’s Desk", occupant: "Secretary", description: "Oversight and management" });
        await AdministrationDesk.upsert({ title: "Principal’s Desk", occupant: "Principal", description: "Academic leadership" });
        await AdministrationDesk.upsert({ title: "Management Committee", occupant: "Various", description: "Governance" });

        console.log("Inserting Facilities...");
        await Facility.upsert({ name: 'Library', category: 'Infrastructure', description: 'Extensive research and learning resources' });
        await Facility.upsert({ name: 'Research Labs', category: 'Infrastructure', description: 'Advanced equipment for practical learning' });
        await Facility.upsert({ name: 'Placement Cell', category: 'Infrastructure', description: 'Student placement support' });
        await Facility.upsert({ name: 'Career Development Centre (CDC)', category: 'Student Support', description: 'Career guidance and skill development' });
        await Facility.upsert({ name: 'Grievance Cell', category: 'Student Support', description: 'Handling student concerns' });
        await Facility.upsert({ name: 'Anti-Ragging Cell', category: 'Student Support', description: 'Ensuring safe campus environment' });

        console.log("Indexing Strategy complete. Details in console.");
        console.log(`
        ============== AI INTEGRATION / INDEXING STRATEGY ==============
        To efficiently retrieve this data for the AI Assistant, you will 
        build an API route passing the query to standard SQL logic:

        Q: 'What are the Self Finance programmes for women?'
        SQL: 
          SELECT p.name, d.name 
          FROM Programmes p 
          JOIN Categories c ON p.CategoryId = c.id 
          JOIN Departments d ON p.DepartmentId = d.id
          WHERE c.type = 'Self-Finance' AND c.gender = 'Women';

        Using Sequelize: 
          Programme.findAll({
            include: [
                { model: Category, where: { type: 'Self-Finance', gender: 'Women' } },
                { model: Department }
            ]
          });
        ================================================================
        `);

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await sequelize.close();
    }
}

seedDatabase();
