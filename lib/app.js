"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
dotenv_1.config();
const verification_1 = __importDefault(require("./controller/verification"));
const messageWebhooks_1 = __importDefault(require("./controller/messageWebhooks"));
const webRoutes_1 = __importDefault(require("./webRoutes"));
const app = express_1.default();
app.use(body_parser_1.json());
app.use(body_parser_1.urlencoded({ extended: true }));
app.set("views", path_1.default.join(__dirname, "views"));
app.set("view engine", "ejs");
app.listen(process.env.PORT || 3000, () => console.log('Webhook Server is listening at port 3000'));
app.get('/', verification_1.default).post('/', messageWebhooks_1.default);
app.use('/web', webRoutes_1.default);