const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require("bcrypt");

// 1) MEMBUAT SCHEMA

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is a required field"],
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, "Email is required field"],
    unique: true,
    trim: true,
    lowercase: true, // not a validator, changing input to lower
    validate: [validator.isEmail, "Invalid email adress"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["admin", "lead-guide", "guide", "user"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "User password is a required field"],
    minlength: [8, "minimum 8 character"],
    select: false, // agar password tidak terlihat in any output tapi tetap tersimpan di DB
  },
  confirmPassword: {
    type: String,
    required: [true, "Confirm password is a required field"],
    minlength: [8, "minimum 8 character"],
    validate: {
      // confirm pas sword has to be equal with this.password
      // if false will return validation error
      // "this" keyword only work on SAVE and CREATE!!! (jika user mengupdate maka harus di save atau create)
      validator: function (val) {
        return val === this.password;
      },
      message: "incorrect password",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  activeState: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// 2) MONGOOSE MIDDLEWARE
// 2. A) Password encryption
userSchema.pre("save", async function (next) {
  // encrypt password only if password is modified/created
  if (!this.isModified("password")) return next();

  // hash password with cost of round = 16
  this.password = await bcrypt.hash(this.password, 12);

  // Delete confirm pass before saving to DB
  this.confirmPassword = undefined;
  next();
});

// 2. B) Update passwordChangedAt setelah mengganti password/reset password
userSchema.pre("save", function (next) {
  // jika password tidak diubah, atau dokumen baru, skip middleware inii
  if (!this.isModified("password") || this.isNew) {
    next();
  } else {
    this.passwordChangedAt = Date.now() - 2000;
    // sengaja dikurangi 2 detik
    // terkadang jwt lebih cepat dibuat dibanding data (passwordChangedAt) di simpan di DB
    next();
  }
});

// 2. C) dont query user that activeState : false
userSchema.pre(/^find/, function (next) {
  this.find({ activeState: { $ne: false } });
  next();
});

// 3. INSTANCE METHOD
// 3. A) METHOD/FUNGSI UNTUK MENGECEK PASSWORD SAAT LOGIN ATAU UPDATE PASSWORD
userSchema.methods.checkingPassword = async function (
  inputtedPassword,
  userPassword
) {
  return await bcrypt.compare(inputtedPassword, userPassword);
};

// 3. B) METHOD/FUNGSI UNTUK MENGECEK TOKEN DIBUAT SEBELUM ATAU SETELAH GANTI PASSWORD
userSchema.methods.changedPasswordAt = function (JWTCreatedAt) {
  if (this.passwordChangedAt) {
    //check apakah properti ini ada atau tidak
    const newPasswordChangedAt = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //mengubah tanggal ke milisecond
    return JWTCreatedAt < newPasswordChangedAt;
    // if true, brrti pass diubah setelah token dibuat. artinya matikan token yg telah dibuat
  }
  return false;
};

// 3. C) METHOD UNTUK MEMBUAT TOKEN FORGOT PASSWORD
userSchema.methods.createPasswordResetToken = function () {
  // 1) membuat plain token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // 2) mengenskripsi plain token
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 3) membatasi reset token hanya untuk 10 menit
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// 4) MEMBUAT MODEL

const User = mongoose.model("User", userSchema);

module.exports = User;
