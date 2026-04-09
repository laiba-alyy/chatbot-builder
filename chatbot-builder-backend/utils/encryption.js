const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-dev-key-change-in-production';

exports.encrypt = (data) => {
  if (!data) return null;
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    ENCRYPTION_KEY
  ).toString();
};

exports.decrypt = (encryptedData) => {
  if (!encryptedData) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};