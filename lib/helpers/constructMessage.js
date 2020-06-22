"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (senderId, response) => {
    const requestBody = {
        "recipient": {
            "id": senderId
        },
        "message": response
    };
    const requestObject = {
        "uri": "https://graph.facebook.com/v7.0/me/messages",
        "qs": { "access_token": process.env.FACEBOOK_ACCESS_TOKEN },
        "method": "POST",
        "json": requestBody
    };
    return requestObject;
};
