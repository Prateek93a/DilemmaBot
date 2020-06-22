"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const verbose = __importStar(require("sqlite3"));
const sqlite3 = verbose.verbose();
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        return console.log(err);
    }
    console.log('Connected to the in-memory SQlite database.');
});
exports.default = db;
