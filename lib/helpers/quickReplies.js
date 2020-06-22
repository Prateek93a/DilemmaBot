"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generalTexts_1 = __importDefault(require("./generalTexts"));
exports.default = {
    feedback: {
        text: generalTexts_1.default.askFeedback,
        quick_replies: [
            {
                "content_type": "text",
                "title": "😃️",
                "payload": "GOOD"
            }, {
                "content_type": "text",
                "title": "😐️",
                "payload": "NEUTRAL"
            }, {
                "content_type": "text",
                "title": "😕️",
                "payload": "BAD"
            }
        ]
    }
};
