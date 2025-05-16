const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/wordleTestDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Successfully connected to wordleTestDB');
    mongoose.connection.close(); // Close after connecting
}).catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
});