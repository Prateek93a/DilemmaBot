"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.use(express_1.default.static(__dirname + '/static'));
router.get('/', (req, res) => res.sendFile(__dirname + '/static/index.html'));
exports.default = router;
