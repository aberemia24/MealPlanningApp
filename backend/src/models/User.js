const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
    // Dacă parola este deja hash-ată, nu mai face nimic
    if (!this.isModified("password")) return next();

    if (this.password.startsWith("$2a$")) {
        console.log("Parola pare deja hash-ată. Sărim hashing-ul suplimentar.");
        return next();
    }

    console.log("Parola brută înainte de hash:", this.password);
    this.password = await bcrypt.hash(this.password, 10);
    console.log("Parola după hash:", this.password);
    next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    console.log("Parola introdusă:", enteredPassword);
    console.log("Hash-ul salvat:", this.password);
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
