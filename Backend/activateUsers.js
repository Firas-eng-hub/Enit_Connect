// Script to manually activate a pending user account
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./config/db.config');

const connectionString = `mongodb+srv://${dbConfig.user}:${dbConfig.pwd}@${dbConfig.domain}/${dbConfig.DB}?retryWrites=true&w=majority`;

mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');

    // Update all Pending students to Active
    const result = await mongoose.connection.db.collection('students').updateMany(
        { status: 'Pending' },
        { $set: { status: 'Active' } }
    );

    console.log(`Updated ${result.modifiedCount} accounts to Active status`);

    // Also update if status is undefined (older records)
    const result2 = await mongoose.connection.db.collection('students').updateMany(
        { status: { $exists: false } },
        { $set: { status: 'Active' } }
    );

    console.log(`Updated ${result2.modifiedCount} accounts without status to Active`);

    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
