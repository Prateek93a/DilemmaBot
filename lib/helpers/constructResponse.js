"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persona_message = exports.persona_notification = exports.message = exports.signal = void 0;
exports.signal = (senderId, signal) => {
    const responseBody = {
        "recipient": {
            "id": senderId
        },
        "sender_action": signal
    };
    return formResponseObject(responseBody);
};
exports.message = (senderId, response) => {
    const responseBody = {
        "recipient": {
            "id": senderId
        },
        "message": response,
    };
    return formResponseObject(responseBody);
};
exports.persona_notification = (token, response) => {
    const responseBody = {
        "recipient": {
            "one_time_notif_token": token
        },
        "message": response,
        "persona_id": process.env.PERSONA_ID
    };
    return formResponseObject(responseBody);
};
exports.persona_message = (senderId, response) => {
    const responseBody = {
        "recipient": {
            "id": senderId
        },
        "message": response,
        "persona_id": process.env.PERSONA_ID
    };
    return formResponseObject(responseBody);
};
const formResponseObject = (responseBody) => ({
    "uri": "https://graph.facebook.com/v7.0/me/messages",
    "qs": { "access_token": process.env.FACEBOOK_ACCESS_TOKEN },
    "method": "POST",
    "json": responseBody
});
