require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

//Test query for Mongodb
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number
});

const User = mongoose.model('User', userSchema);

async function runTestQuery() {
    try {
        // Create a new user in memory
        const testUser = new User({
            name: "Luke",
            email: "luke@example.com",
            age: 25
        });


        const savedUser = await testUser.save();
        console.log("Success! Data saved to Atlas:", savedUser);


        const foundUser = await User.findOne({ name: "Luke" });
        console.log("Found user in DB:", foundUser);

    } catch (err) {
        console.error("Test query failed:", err);
    }


}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB!");
        runTestQuery();
    })
    .catch((err) => console.error("Connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

