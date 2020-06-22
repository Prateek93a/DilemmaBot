"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.downloadImage = exports.characterCount = exports.baseFilePath = void 0;
const request_promise_1 = __importDefault(require("request-promise"));
const fs_1 = require("fs");
exports.baseFilePath = './temp_imgs/';
exports.characterCount = (text) => {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        let characterCode = text[i].charCodeAt(0);
        if ((characterCode >= 65 && characterCode <= 90) || (characterCode >= 97 && characterCode <= 122)) {
            count++;
        }
    }
    return count;
};
exports.downloadImage = (url, filename) => {
    return new Promise((resolve, reject) => {
        request_promise_1.default(url).pipe(fs_1.createWriteStream(exports.baseFilePath + filename)).on('close', resolve).on('error', reject);
    });
};
exports.deleteImage = (filename) => {
    return new Promise((resolve, reject) => {
        fs_1.unlink(exports.baseFilePath + filename, (err) => {
            if (err) {
                reject();
            }
            resolve();
        });
    });
};
