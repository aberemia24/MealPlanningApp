const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['user', 'nutritionist', 'chef'],
        default: 'user'
    },
    preferences: {
        menuType: { 
            type: String,
            enum: ['vegetarian', 'omnivor'],
            required: function() { 
                return this.role === 'user'; 
            }
        },
        numberOfPeople: { 
            type: Number,
            min: 1,
            required: function() { 
                return this.role === 'user'; 
            }
        }
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    passwordChangedAt: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    if (this.password.startsWith("$2a$")) {
        console.log("Password already hashed. Skipping hashing.");
        return next();
    }

    console.log("Raw password before hash:", this.password);
    this.password = await bcrypt.hash(this.password, 10);
    console.log("Password after hash:", this.password);
    next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    console.log("Entered password:", enteredPassword);
    console.log("Stored hash:", this.password);
    return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user is nutritionist or chef
userSchema.methods.isNutritionistOrChef = function() {
    return ['nutritionist', 'chef'].includes(this.role);
};

// Check if user has specific role
userSchema.methods.hasRole = function(role) {
    return this.role === role;
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;