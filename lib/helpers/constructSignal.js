"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (senderId, signal) => {
    const requestBody = {
        "recipient": {
            "id": senderId
        },
        "sender_action": signal
    };
    const requestObject = {
        "uri": "https://graph.facebook.com/v7.0/me/messages",
        "qs": { "access_token": process.env.FACEBOOK_ACCESS_TOKEN },
        "method": "POST",
        "json": requestBody
    };
    return requestObject;
};
