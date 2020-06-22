"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_promise_1 = __importDefault(require("request-promise"));
const bad_words_1 = __importDefault(require("bad-words"));
const vision_1 = __importDefault(require("@google-cloud/vision"));
const responses_1 = require("./responses");
const credibiltyFunction_1 = require("./credibiltyFunction");
const limits_1 = require("./limits");
const utilityFunctions_1 = require("./utilityFunctions");
const keys_1 = __importDefault(require("./keys"));
const commands_1 = __importDefault(require("./commands"));
const payloads_1 = __importDefault(require("./payloads"));
const generalTexts_1 = __importStar(require("./generalTexts"));
const genericElements_1 = __importDefault(require("./genericElements"));
const sqlCommands_1 = __importDefault(require("./sqlCommands"));
const constructResponse = __importStar(require("./constructResponse"));
const pg_1 = require("pg");
// connection string
const connectionString = process.env.CONNECTION_STRING;
const client = new pg_1.Client({ connectionString });
client.connect().then(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.query(sqlCommands_1.default.createUserTable());
    }
    catch (err) {
        console.log(err);
    }
}));
// vision api client
const visionClient = new vision_1.default.ImageAnnotatorClient();
const filter = new bad_words_1.default();
const optionsArray = ['A', 'B', 'C', 'D', 'E'];
// I am using a separate server for this
// base url
const baseUrl = 'https://still-wildwood-84680.herokuapp.com';
// store the ongoing poll ids
const ongoingPollsSet = new Set();
// ongoingPollsSet.add(123);
// store the ongoing polls
const ongoingPollsArray = [];
// store the question of the user temperorily
const temperaryQuesMap = new Map();
// store the quick replies of the user temperorily
const temperaryAnsMap = new Map();
// store the image urls that user sends temperorily
const temperaryImageMap = new Map();
// store the responses of the user temperorily
const temperaryResponseMap = new Map();
// store if current user has asked question before or not
const temperaryHasAskedMap = new Map();
// store if current user has answered question  before or not
const temperaryHasAnsweredMap = new Map();
// image validation
const isImageValid = (senderId, url) => new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let filename = senderId + '' + Math.floor(Math.random() * Math.floor(Math.random() * 1000)) + '.png';
        yield utilityFunctions_1.downloadImage(url, filename);
        console.log('File downloaded');
        const [result] = yield visionClient.safeSearchDetection(utilityFunctions_1.baseFilePath + filename);
        console.log('File analysised');
        yield utilityFunctions_1.deleteImage(filename);
        console.log('File deleted');
        if (result.safeSearchAnnotation) {
            const { adultConfidence, nsfwConfidence, racyConfidence, violenceConfidence } = result.safeSearchAnnotation;
            resolve(!(adultConfidence > 0.7 || nsfwConfidence > 0.7 || racyConfidence > 0.7 || violenceConfidence > 0.7));
        }
        else {
            resolve(true);
        }
    }
    catch (err) {
        console.log('Image error: ', err);
        reject();
    }
}));
const sendTextMessage = (senderId, text) => {
    const responseObj = responses_1.textMessage(text);
    const responseMessage = constructResponse.message(senderId, responseObj);
    return request_promise_1.default(responseMessage);
};
const sendButtonMessage = (senderId, question, answers, scores) => __awaiter(void 0, void 0, void 0, function* () {
    question = question.split(' ').join('_').trim();
    answers = answers.map((answer) => answer.trim().split(' ').join('.'));
    const ansString = answers.join('_');
    const scoreString = scores.join('_');
    const url = `${baseUrl}/${senderId}/?ans=${ansString}&score=${scoreString}`;
    const responseObj = responses_1.buttonTemplate(url);
    const responseMessage = constructResponse.message(senderId, responseObj);
    yield request_promise_1.default(responseMessage);
    yield sendTextMessage(senderId, 'If the site does not show up, use the following link: ' + url);
});
const sendImages = (senderId, url) => {
    const responseObj = responses_1.imageResponse(url);
    const responseMessage = constructResponse.message(senderId, responseObj);
    return request_promise_1.default(responseMessage);
};
const sendQuestion = (senderId, poll) => __awaiter(void 0, void 0, void 0, function* () {
    const options = [];
    const question = 'Question:\n' + poll.question;
    // send question
    yield sendTextMessage(senderId, question);
    // send images
    if (poll.imageUrls.length) {
        for (let i = 0; i < poll.imageUrls.length; i++) {
            yield sendImages(senderId, poll.imageUrls[i]);
        }
    }
    // send options with quick replies
    let choices = 'Choices available:\n';
    for (let i = 0; i < poll.answers.length; i++) {
        choices += '(' + optionsArray[i] + ') ' + poll.answers[i] + '\n';
        options[i] = 'Option ' + optionsArray[i];
    }
    const answers = options.map((answer, index) => ({ "content_type": "text",
        "title": answer,
        "payload": '' + index,
    }));
    const responseObj = responses_1.quickReplies(choices, answers);
    const responseMessage = constructResponse.message(senderId, responseObj);
    return request_promise_1.default(responseMessage);
});
const sendGenericMessage = (senderId, genericType) => {
    const responseObj = responses_1.genericTemplate(genericElements_1.default[genericType]);
    const responseMessage = constructResponse.message(senderId, responseObj);
    return request_promise_1.default(responseMessage);
};
const sendSignal = (senderId, type) => {
    const responseObj = constructResponse.signal(senderId, type);
    return request_promise_1.default(responseObj);
};
const sendNotificationChoice = (senderId) => {
    const ansArray = [
        {
            "content_type": "text",
            "title": generalTexts_1.default.yesNotify,
            "payload": payloads_1.default.yes,
        },
        {
            "content_type": "text",
            "title": generalTexts_1.default.noNotify,
            "payload": payloads_1.default.no,
        }
    ];
    const question = (temperaryHasAnsweredMap.has(senderId) && temperaryHasAnsweredMap.get(senderId) == 0) ? generalTexts_1.default.getNotified : generalTexts_1.default.getNotified2;
    temperaryHasAnsweredMap.has(senderId) && temperaryHasAnsweredMap.delete(senderId);
    const responseObj = responses_1.quickReplies(question, ansArray);
    const responseMessage = constructResponse.persona_message(senderId, responseObj);
    return request_promise_1.default(responseMessage);
};
const sendNotificationRequest = (senderId, pollPsid) => {
    // see what goes to the payload of the one time notification message
    const responseObj = responses_1.oneTimeNotificationTemplate(pollPsid);
    const responseMessage = constructResponse.persona_message(senderId, responseObj);
    return request_promise_1.default(responseMessage);
};
const sendNotficationConfirm = (senderId, text) => {
    // see what goes to the payload of the one time notification message
    const responseObj = responses_1.textMessage(text);
    const responseMessage = constructResponse.persona_message(senderId, responseObj);
    return request_promise_1.default(responseMessage);
};
const sendNotfication = (token, answer) => {
    const responseObj = responses_1.textMessage(answer);
    const responseMessage = constructResponse.persona_notification(token, responseObj);
    return request_promise_1.default(responseMessage);
};
const checkState = (senderId, handler) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows } = yield client.query(sqlCommands_1.default.getState([senderId]));
        const row = rows[0];
        if (row && (row.state == 1 || row.state == 2)) {
            if (handler.name === 'handleStart') {
                yield sendTextMessage(senderId, generalTexts_1.default.ongoingStart);
            }
            else if (handler.name === 'handleReceive') {
                yield sendTextMessage(senderId, generalTexts_1.default.ongoingreceive);
            }
            else if (handler.name === 'handleCredibility') {
                yield sendTextMessage(senderId, generalTexts_1.default.ongoingCred);
            }
            else if (handler.name === 'handleEndFlow') {
                handleEndFlow(senderId);
                return;
            }
            else if (handler.name === 'handleEnd') {
                yield sendTextMessage(senderId, generalTexts_1.default.finishCurrent);
                return;
            }
            else if (handler.name === 'handleGreet') {
                handleGreet(senderId, generalTexts_1.default.greet1);
                return;
            }
            else {
                yield sendTextMessage(senderId, generalTexts_1.default.guide);
                row.state == 2 ? yield sendTextMessage(senderId, generalTexts_1.default.afterGuide2) : yield sendTextMessage(senderId, generalTexts_1.default.afterGuide1);
            }
        }
        else if (row && row.state == 3) {
            yield sendTextMessage(senderId, generalTexts_1.default.wait2);
            return;
        }
        else if (row && row.state == 4) {
            yield sendTextMessage(senderId, generalTexts_1.default.finishCurrent);
            const pollCreator = temperaryResponseMap.get(senderId);
            const poll = ongoingPollsArray.filter(poll => poll.sender === pollCreator)[0];
            yield sendQuestion(senderId, poll);
            return;
        }
        else if (row && row.state == 5) {
            yield sendTextMessage(senderId, generalTexts_1.default.wait);
            return;
        }
        else if (row && row.state == 6) {
            yield sendNotficationConfirm(senderId, generalTexts_1.default.pleaseReply);
            yield sendNotificationChoice(senderId);
            return;
        }
        else if (row && row.state == 0 && handler.name === 'handleEndFlow') {
            yield sendTextMessage(senderId, generalTexts_1.default.noFlow);
            return;
        }
        else {
            handler(senderId);
        }
    }
    catch (err) {
        console.log(err);
        return handleError(senderId);
    }
});
const handleGreetings = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sendSignal(senderId, keys_1.default.typingOn);
        const res = yield request_promise_1.default.get(`https://graph.facebook.com/${senderId}?fields=first_name&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`);
        const name = JSON.parse(res).first_name;
        const { rows } = yield client.query(sqlCommands_1.default.findByPsid([senderId]));
        if (rows && rows[0]) {
            // if the user has already used the app before, then we just want to remove any
            // pending of his/her pending actions and change his/her state back to 0.
            const row = rows[0];
            if (temperaryResponseMap.has(senderId))
                temperaryResponseMap.delete(senderId);
            if (temperaryAnsMap.has(senderId))
                temperaryAnsMap.delete(senderId);
            if (temperaryQuesMap.has(senderId))
                temperaryQuesMap.delete(senderId);
            if (temperaryHasAskedMap.has(senderId))
                temperaryHasAskedMap.delete(senderId);
            if (temperaryHasAnsweredMap.has(senderId))
                temperaryHasAnsweredMap.delete(senderId);
            if (temperaryImageMap.has(senderId))
                temperaryImageMap.delete(senderId);
            if (row.state !== 0) {
                yield client.query(sqlCommands_1.default.updateUserState([0, senderId]));
                yield sendTextMessage(senderId, generalTexts_1.textsWithInputs.welcomeBack(name));
                yield sendSignal(senderId, keys_1.default.typingOff);
            }
            else {
                yield sendTextMessage(senderId, generalTexts_1.textsWithInputs.welcomeBack(name));
                yield sendSignal(senderId, keys_1.default.typingOff);
            }
        }
        else {
            // the user is using the app for the first time.
            yield client.query(sqlCommands_1.default.insertIntoUsers([senderId, 0, 1.0, 0, 0, 0]));
            yield sendGenericMessage(senderId, keys_1.default.greetings);
            yield sendTextMessage(senderId, generalTexts_1.textsWithInputs.greetings(name));
            yield sendTextMessage(senderId, generalTexts_1.default.guide);
            yield sendSignal(senderId, keys_1.default.typingOff);
        }
    }
    catch (err) {
        console.log(err);
        return handleError(senderId);
    }
});
const handleStart = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    if (ongoingPollsSet.has(senderId)) {
        yield sendTextMessage(senderId, generalTexts_1.default.alreadyHasPoll);
        return;
    }
    // ask for question
    try {
        yield client.query(sqlCommands_1.default.updateUserState([1, senderId]));
        const { rows } = yield client.query(sqlCommands_1.default.findIfAsked([senderId]));
        const row = rows[0];
        temperaryHasAskedMap.set(senderId, row.has_asked);
        if (row.has_asked) {
            yield sendTextMessage(senderId, generalTexts_1.default.start2);
        }
        else {
            yield client.query(sqlCommands_1.default.changeIfAsked([1, senderId]));
            yield sendTextMessage(senderId, generalTexts_1.default.start1);
        }
    }
    catch (err) {
        console.log(err);
        return handleError(senderId);
    }
});
const handleEnd = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!ongoingPollsSet.has(senderId)) {
        yield sendTextMessage(senderId, generalTexts_1.default.endUnablePoll);
        return;
    }
    try {
        yield sendTextMessage(senderId, generalTexts_1.default.fetchResults);
        yield sendSignal(senderId, keys_1.default.typingOn);
        yield client.query(sqlCommands_1.default.updateUserState([3, senderId]));
        let index = 0;
        let pollObj = null;
        for (let i = 0; i < ongoingPollsArray.length; i++) {
            if (ongoingPollsArray[i].sender === senderId) {
                index = i;
                pollObj = ongoingPollsArray[i];
                break;
            }
        }
        ongoingPollsArray.splice(index, 1);
        ongoingPollsSet.delete(senderId);
        const scoresArray = pollObj.scoresArray;
        const psidArray = [];
        pollObj.psids.forEach((value, key) => {
            psidArray.push(key);
        });
        let winningIndex = 0, maxScore = scoresArray[0], flag = 0;
        // flag is to keep track of whether all options have same amount of votes or different
        scoresArray.forEach((score, index) => {
            if (score > maxScore) {
                flag = 1;
                maxScore = score;
                winningIndex = index;
            }
        });
        // send user the results, don't want to block the execution here
        client.query(sqlCommands_1.default.updateUserState([0, senderId]))
            .then(() => __awaiter(void 0, void 0, void 0, function* () {
            yield sendButtonMessage(senderId, pollObj.question, pollObj.answers, scoresArray);
            yield sendSignal(senderId, keys_1.default.typingOff);
        })).catch(err => {
            console.log(err);
            return handleError(senderId);
        });
        let answer = 'No option received majority';
        let question = pollObj.question.length > 80 ? pollObj.question.substr(0, 80) + '...' : pollObj.question;
        if (flag === 0) {
            // notify that there is no winner
            pollObj.notificationRecipients.forEach((user) => {
                sendNotfication(user, generalTexts_1.textsWithInputs.notification(question, answer));
            });
        }
        else {
            // notify that there is winner
            answer = pollObj.answers[winningIndex];
            pollObj.notificationRecipients.forEach((user) => {
                sendNotfication(user, generalTexts_1.textsWithInputs.notification(question, answer));
            });
            // update credibilities in the background
            const votersCredibilityChange = credibiltyFunction_1.credibilityFunction(scoresArray, pollObj.psids);
            // chances of failure lies here
            // queries will execute in serialized mode
            for (let i = 0; i < psidArray.length; i++) {
                let id = psidArray[i];
                let { rows } = yield client.query(sqlCommands_1.default.getCredibility([id]));
                let row = rows[0];
                let credibilityChange = votersCredibilityChange.get(id);
                let newCred = row.credibility;
                let change = 0;
                if (credibilityChange !== 0) {
                    newCred = newCred - credibilityChange;
                    change = -1;
                }
                else {
                    newCred = newCred + (0.05) * scoresArray.length;
                    change = +1;
                }
                newCred = credibiltyFunction_1.mapToRange(newCred, limits_1.minPossibleLimit, limits_1.maxPossibleLimit, limits_1.minAllowedLimit, limits_1.maxAllowedLimit);
                yield client.query(sqlCommands_1.default.updateCredibility([newCred, change, id]));
            }
        }
    }
    catch (err) {
        console.log(err);
        return handleError(senderId);
    }
});
const handleReceive = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!ongoingPollsSet.size || (ongoingPollsSet.size === 1 && ongoingPollsSet.has(senderId))) {
        yield sendTextMessage(senderId, generalTexts_1.default.noPollsAvailable);
        return;
    }
    let pollObj = null;
    for (let i = 0; i < ongoingPollsArray.length; i++) {
        let poll = ongoingPollsArray[i];
        if (poll.sender !== senderId && !poll.psids.has(senderId)) {
            pollObj = poll;
            break;
        }
    }
    if (pollObj === null) {
        // if no such polls are available where the user hasn't voted yet, send messvotersCredibilityChangeage
        yield sendTextMessage(senderId, generalTexts_1.default.noPollsAvailable);
        return;
    }
    else {
        // send the quick message
        yield sendTextMessage(senderId, generalTexts_1.default.fetchQues);
        try {
            const { rows } = yield client.query(sqlCommands_1.default.findIfAnswered([senderId]));
            console.log(rows, rows[0], rows[0].has_answered);
            temperaryHasAnsweredMap.set(senderId, rows[0].has_answered);
            yield client.query(sqlCommands_1.default.updateUserStateReceive([4, senderId]));
            temperaryResponseMap.set(senderId, pollObj.sender);
            yield sendQuestion(senderId, pollObj);
            return;
        }
        catch (err) {
            console.log(err);
            return handleError(senderId);
        }
    }
});
const handleCredibility = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sendTextMessage(senderId, generalTexts_1.default.fetchCred);
        yield sendSignal(senderId, keys_1.default.typingOn);
        yield client.query(sqlCommands_1.default.updateUserState([5, senderId]));
        const { rows } = yield client.query(sqlCommands_1.default.getCredibility([senderId]));
        yield client.query(sqlCommands_1.default.updateUserStateAndChange([senderId]));
        const row = rows[0];
        const credibility = Math.floor(credibiltyFunction_1.mapToRange(row.credibility, limits_1.minAllowedLimit, limits_1.maxAllowedLimit, 0, 100));
        switch (row.has_changed) {
            case 0:
                yield sendTextMessage(senderId, generalTexts_1.textsWithInputs.credibilityNoChange(credibility));
                break;
            case 1:
                yield sendTextMessage(senderId, generalTexts_1.textsWithInputs.credibilityPositiveChange(credibility));
                break;
            case -1:
                yield sendTextMessage(senderId, generalTexts_1.textsWithInputs.credibilityNegativeChange(credibility));
                break;
            default:
                handleError(senderId);
                break;
        }
        yield sendSignal(senderId, keys_1.default.typingOff);
    }
    catch (err) {
        console.log(err);
        return handleError(senderId);
    }
});
const handleGreet = (senderId, text) => __awaiter(void 0, void 0, void 0, function* () {
    if (!text || text.length == 0) {
        yield sendTextMessage(senderId, generalTexts_1.greetText[Math.floor(Math.random() * generalTexts_1.greetText.length)]);
    }
    else {
        yield sendTextMessage(senderId, text);
    }
});
const handleEndFlow = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    // are you sure?
    temperaryQuesMap.delete(senderId);
    temperaryAnsMap.delete(senderId);
    yield sendTextMessage(senderId, generalTexts_1.default.wait);
    yield client.query(sqlCommands_1.default.resetUsers([senderId]));
    yield sendTextMessage(senderId, generalTexts_1.default.ongoingEnd);
});
const handleError = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    // roll back everything
    try {
        yield client.query(sqlCommands_1.default.updateUserState([0, senderId]));
        if (temperaryResponseMap.has(senderId))
            temperaryResponseMap.delete(senderId);
        if (temperaryAnsMap.has(senderId))
            temperaryAnsMap.delete(senderId);
        if (temperaryQuesMap.has(senderId))
            temperaryQuesMap.delete(senderId);
        if (temperaryHasAskedMap.has(senderId))
            temperaryHasAskedMap.delete(senderId);
        if (temperaryHasAnsweredMap.has(senderId))
            temperaryHasAnsweredMap.delete(senderId);
        if (temperaryImageMap.has(senderId))
            temperaryImageMap.delete(senderId);
        yield sendTextMessage(senderId, generalTexts_1.default.error);
    }
    catch (err) {
        console.log(err);
        yield sendTextMessage(senderId, generalTexts_1.default.error);
    }
});
const handleState1 = (senderId, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!temperaryQuesMap.has(senderId)) {
            temperaryQuesMap.set(senderId, "");
        }
        if (!temperaryImageMap.has(senderId)) {
            temperaryImageMap.set(senderId, []);
        }
        // if user has sent images
        if (message.attachments && message.attachments != {}) {
            const imageArray = temperaryImageMap.get(senderId);
            if (imageArray.length == 2) {
                yield sendTextMessage(senderId, generalTexts_1.default.imgExceed);
                return;
            }
            for (let attachment of message.attachments) {
                imageArray.push(attachment.payload.url);
            }
            temperaryImageMap.set(senderId, imageArray);
            yield sendSignal(senderId, keys_1.default.seen);
            return;
        }
        // if user has sent text
        let ques = temperaryQuesMap.get(senderId);
        if (message.text.trim() == '👍️' || (message.text.trim().charCodeAt(0) == '👍️'.charCodeAt(0) && message.text.trim().charCodeAt(1) == '👍️'.charCodeAt(1)) || message.text.includes('thumbsup')) {
            if (!ques.length) {
                yield sendTextMessage(senderId, generalTexts_1.default.emptyQues);
                return;
            }
            // foul words detection
            const sanitizedQues = filter.clean(ques.trim());
            if (ques.trim() != sanitizedQues) {
                temperaryQuesMap.set(senderId, '');
                temperaryImageMap.set(senderId, []);
                yield sendTextMessage(senderId, generalTexts_1.default.foul);
                return;
            }
            // inappropriate image detection
            const imageArray = temperaryImageMap.get(senderId);
            for (let i = 0; i < imageArray.length; i++) {
                let isImageValidBool = yield isImageValid(senderId, imageArray[i]);
                if (!isImageValidBool) {
                    temperaryQuesMap.set(senderId, '');
                    temperaryImageMap.set(senderId, []);
                    yield sendTextMessage(senderId, generalTexts_1.default.inappropriateImg);
                    return;
                }
            }
            // look for character count
            const count = utilityFunctions_1.characterCount(ques.trim());
            if (count < 80) {
                yield sendTextMessage(senderId, generalTexts_1.textsWithInputs.moreCharacters(80 - count));
                return;
            }
            // ask for answers
            yield sendTextMessage(senderId, generalTexts_1.default.wait);
            yield sendSignal(senderId, keys_1.default.typingOn);
            try {
                yield client.query(sqlCommands_1.default.updateUserState([2, senderId]));
                if (temperaryHasAskedMap.get(senderId)) {
                    yield sendTextMessage(senderId, generalTexts_1.default.askForOptions2);
                    yield sendSignal(senderId, keys_1.default.typingOff);
                }
                else {
                    yield sendTextMessage(senderId, generalTexts_1.default.askForOptions);
                    yield sendSignal(senderId, keys_1.default.typingOff);
                }
            }
            catch (err) {
                console.log(err);
                return handleError(senderId);
            }
        }
        else {
            ques = ques + '\n' + message.text;
            temperaryQuesMap.set(senderId, ques);
            yield sendSignal(senderId, keys_1.default.seen);
        }
    }
    catch (err) {
        console.log(err);
        yield sendTextMessage(senderId, generalTexts_1.default.error);
    }
});
const handleState2 = (senderId, message) => __awaiter(void 0, void 0, void 0, function* () {
    if (!temperaryAnsMap.has(senderId)) {
        temperaryAnsMap.set(senderId, []);
    }
    // if user has sent images
    if (message.attachments && message.attachments != {}) {
        yield sendSignal(senderId, keys_1.default.seen);
        yield sendTextMessage(senderId, generalTexts_1.default.noImg);
        return;
    }
    let ans = temperaryAnsMap.get(senderId);
    if (message.text.trim() == '👍️' || (message.text.trim().charCodeAt(0) == '👍️'.charCodeAt(0) && message.text.trim().charCodeAt(1) == '👍️'.charCodeAt(1)) || message.text.includes('thumbsup')) {
        if (ans.length < 2) {
            yield sendTextMessage(senderId, generalTexts_1.textsWithInputs.askForMoreReplies(ans.length));
            return;
        }
        if (ans.length > 5) {
            ans.splice(5);
            yield sendTextMessage(senderId, generalTexts_1.default.countError);
        }
        yield sendTextMessage(senderId, generalTexts_1.default.wait);
        yield sendSignal(senderId, keys_1.default.typingOn);
        try {
            yield client.query(sqlCommands_1.default.updateUserState([0, senderId]));
            ongoingPollsSet.add(senderId);
            const pollObj = {
                "sender": senderId,
                "question": temperaryQuesMap.get(senderId),
                "answers": temperaryAnsMap.get(senderId),
                "psids": new Map(),
                "scoresArray": [],
                "notificationRecipients": [],
                "imageUrls": temperaryImageMap.get(senderId)
            };
            for (let i = 0; i < temperaryAnsMap.get(senderId).length; i++) {
                pollObj.scoresArray.push(0);
            }
            ongoingPollsArray.push(pollObj);
            temperaryQuesMap.delete(senderId);
            temperaryAnsMap.delete(senderId);
            temperaryHasAskedMap.delete(senderId);
            temperaryImageMap.delete(senderId);
            yield sendTextMessage(senderId, generalTexts_1.default.flowComplete);
            yield sendSignal(senderId, keys_1.default.typingOff);
        }
        catch (err) {
            console.log(err);
            return handleError(senderId);
        }
    }
    else {
        // foul words detection
        const sanitizedOption = filter.clean(message.text.trim());
        if (message.text.trim() != sanitizedOption) {
            yield sendTextMessage(senderId, generalTexts_1.default.foulOption);
            return;
        }
        ans.push(message.text);
        temperaryAnsMap.set(senderId, ans);
        yield sendSignal(senderId, keys_1.default.seen);
    }
});
const handleState3 = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendTextMessage(senderId, generalTexts_1.default.wait);
});
const handleState4 = (senderId, message) => __awaiter(void 0, void 0, void 0, function* () {
    const pollCreator = temperaryResponseMap.get(senderId);
    try {
        if (!ongoingPollsSet.has(pollCreator)) {
            // poll ended before user casted a vote
            yield client.query(sqlCommands_1.default.updateUserState([0, senderId]));
            yield sendTextMessage(senderId, generalTexts_1.default.pollEnd);
        }
        else {
            const poll = ongoingPollsArray.filter(poll => poll.sender === pollCreator)[0];
            // if user has sent images
            if (message.attachments && message.attachments != {}) {
                yield sendTextMessage(senderId, generalTexts_1.default.pleaseReply);
                yield sendQuestion(senderId, poll);
                return;
            }
            const options = [];
            for (let i = 0; i < poll.answers.length; i++) {
                options[i] = 'Option ' + optionsArray[i];
            }
            if (!options.includes(message.text.trim())) {
                // answer doesnot match, send the quick message again
                yield sendTextMessage(senderId, generalTexts_1.default.answerNoMatch);
                yield sendQuestion(senderId, poll);
            }
            else {
                yield sendTextMessage(senderId, generalTexts_1.default.wait2);
                yield sendSignal(senderId, keys_1.default.typingOn);
                // change the state back to 0
                // queries will execute in serialized mode
                let cred = 1;
                const { rows } = yield client.query(sqlCommands_1.default.getCredibility([senderId]));
                yield client.query(sqlCommands_1.default.updateUserState([6, senderId]));
                const row = rows[0];
                cred = row.credibility;
                for (let i = 0; i < ongoingPollsArray.length; i++) {
                    if (ongoingPollsArray[i].sender === poll.sender) {
                        ongoingPollsArray[i].psids.set(senderId, message.quick_reply.payload);
                        ongoingPollsArray[i].scoresArray[parseInt(message.quick_reply.payload)] += cred;
                        // send confirmation message
                        yield sendTextMessage(senderId, generalTexts_1.default.responseRecorded);
                        yield sendSignal(senderId, keys_1.default.typingOff);
                        yield sendNotificationChoice(senderId);
                        return;
                    }
                }
            }
        }
    }
    catch (err) {
        console.log(err);
        return handleError(senderId);
    }
});
const handleState5 = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendTextMessage(senderId, generalTexts_1.default.wait);
});
const handleState6 = (senderId, message) => __awaiter(void 0, void 0, void 0, function* () {
    // if user has sent images
    if (message.attachments && message.attachments != {}) {
        yield sendTextMessage(senderId, generalTexts_1.default.pleaseReply);
        yield sendNotificationChoice(senderId);
        return;
    }
    yield sendSignal(senderId, keys_1.default.typingOn);
    if ((message.payload && message.payload == payloads_1.default.yes) || (message.text.trim().toLowerCase().includes('yes'))) {
        yield client.query(sqlCommands_1.default.updateUserState([0, senderId]));
        yield sendNotificationRequest(senderId, temperaryResponseMap.get(senderId));
        temperaryResponseMap.delete(senderId);
    }
    else if ((message.payload && message.payload == payloads_1.default.no) || (message.text.trim().toLowerCase().includes('no'))) {
        temperaryResponseMap.delete(senderId);
        yield client.query(sqlCommands_1.default.updateUserState([0, senderId]));
        yield sendNotficationConfirm(senderId, generalTexts_1.default.ok);
    }
    else {
        yield sendNotficationConfirm(senderId, generalTexts_1.default.pleaseReply);
        yield sendNotificationChoice(senderId);
    }
    yield sendSignal(senderId, keys_1.default.typingOff);
});
const handleFlow = (senderId, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows } = yield client.query(sqlCommands_1.default.getState([senderId]));
        const row = rows[0];
        switch (row.state) {
            case 1:
                handleState1(senderId, message);
                break;
            case 2:
                handleState2(senderId, message);
                break;
            case 3:
                handleState3(senderId);
                break;
            case 4:
                handleState4(senderId, message);
                break;
            case 5:
                handleState5(senderId);
                break;
            case 6:
                handleState6(senderId, message);
                break;
            default:
                yield sendTextMessage(senderId, generalTexts_1.noMatchTexts[Math.floor(Math.random() * generalTexts_1.noMatchTexts.length)]);
                break;
        }
    }
    catch (err) {
        console.log(err);
        return handleError(senderId);
    }
});
const checkEntity = (entity, command) => {
    return (entity[command] && entity[command][0].confidence >= 0.88);
};
const handleMessageEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // handle message event
    const senderId = event.sender.id;
    const message = event.message;
    // check if user has sent an attachment
    if (message.attachments && message.attachments != {}) {
        handleFlow(senderId, message);
        return;
    }
    if (((_a = message.nlp) === null || _a === void 0 ? void 0 : _a.entities) && message.nlp.entities != {}) {
        const entity = message.nlp.entities;
        if (checkEntity(entity, commands_1.default.start)) {
            // start a new poll
            checkState(senderId, handleStart);
            return;
        }
        else if (checkEntity(entity, commands_1.default.end)) {
            // handle end poll
            checkState(senderId, handleEnd);
            return;
        }
        else if (checkEntity(entity, commands_1.default.endFlow)) {
            // handle end poll
            checkState(senderId, handleEndFlow);
            return;
        }
        else if (checkEntity(entity, commands_1.default.receive)) {
            // fetch a poll
            checkState(senderId, handleReceive);
            return;
        }
        else if (checkEntity(entity, commands_1.default.credibility)) {
            // fetch credibility
            checkState(senderId, handleCredibility);
            return;
        }
        else if (checkEntity(entity, commands_1.default.options) || checkEntity(entity, commands_1.default.question) || checkEntity(entity, commands_1.default.notifications)) {
            // handle flow stuff
            handleFlow(senderId, message);
            return;
        }
        else if (checkEntity(entity, commands_1.default.greet)) {
            // handle these greetings differently
            checkState(senderId, handleGreet);
            return;
        }
        else {
            handleFlow(senderId, message);
        }
    }
    else {
        handleFlow(senderId, message);
    }
});
const handleGuide = (senderId) => __awaiter(void 0, void 0, void 0, function* () { return yield sendTextMessage(senderId, generalTexts_1.default.guide); });
const handlePostbackEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    // handle postback event
    const senderId = event.sender.id;
    if (event.postback.payload) {
        const payload = event.postback.payload;
        switch (payload) {
            case payloads_1.default.init:
                handleGreetings(senderId);
                break;
            case payloads_1.default.help:
                checkState(senderId, handleGuide);
                break;
            default:
                console.log(event.postback);
                break;
        }
    }
    return;
});
const handleAttachmentEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    // handle attachment event
    const senderId = event.sender.id;
    yield sendTextMessage(senderId, generalTexts_1.default.support);
});
const handleOptinEvent = (event) => {
    const senderId = event.sender.id;
    const payload = event.optin.payload;
    const token = event.optin.one_time_notif_token;
    if (payload && token && ongoingPollsSet.has(payload)) {
        for (let i = 0; i < ongoingPollsArray.length; i++) {
            if (ongoingPollsArray[i].sender == payload) {
                ongoingPollsArray[i].notificationRecipients.push(token);
                break;
            }
        }
        sendNotficationConfirm(senderId, generalTexts_1.default.okNotify);
    }
    else {
        sendTextMessage(senderId, generalTexts_1.default.pollEnd);
    }
};
exports.default = (event) => __awaiter(void 0, void 0, void 0, function* () {
    if (event.message)
        handleMessageEvent(event);
    else if (event.postback)
        handlePostbackEvent(event);
    else if (event.attachment)
        handleAttachmentEvent(event);
    else if (event.optin)
        handleOptinEvent(event);
});
