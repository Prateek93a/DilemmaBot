"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const processMessage_1 = __importDefault(require("../helpers/processMessage"));
exports.default = (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                processMessage_1.default(event);
            });
        });
        res.status(200).end();
    }
    return;
};
