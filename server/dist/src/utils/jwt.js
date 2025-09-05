"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.JWT_SECRET_KEY;
const EXPIRES_IN = '12h';
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, SECRET_KEY);
    }
    catch {
        return null;
    }
}
