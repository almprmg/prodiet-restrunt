'use strict';

const bcrypt = require('bcrypt');

/**
 * دالة لتشفير كلمة السر
 * @param {string} password - كلمة السر النصية
 * @param {number} saltRounds - عدد جولات الملح (اختياري، الافتراضي 10)
 * @returns {Promise<string>} - كلمة السر المشفرة
 */
async function hashPassword(password, saltRounds = 10) {
  try {
    const hashed = await bcrypt.hash(password, saltRounds);
    return hashed;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}
// مقارنة كلمة السر المدخلة مع المشفرة في قاعدة البيانات
async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}
module.exports = { hashPassword, comparePassword };
