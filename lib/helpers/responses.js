"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickReplies = exports.imageResponse = exports.oneTimeNotificationTemplate = exports.buttonTemplate = exports.textMessage = exports.genericTemplate = void 0;
function genericTemplate(elements) {
    return ({
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    });
}
exports.genericTemplate = genericTemplate;
function textMessage(text) {
    return ({ text });
}
exports.textMessage = textMessage;
function buttonTemplate(url) {
    return ({
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "The results of your previous poll has been calculated",
                "buttons": [
                    {
                        "type": "web_url",
                        "url": url,
                        "title": "View results"
                    }
                ]
            }
        }
    });
}
exports.buttonTemplate = buttonTemplate;
function oneTimeNotificationTemplate(pollPsid) {
    return ({
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "one_time_notif_req",
                "title": "Click on Notify Me to know which option got the most points.",
                "payload": pollPsid
            }
        }
    });
}
exports.oneTimeNotificationTemplate = oneTimeNotificationTemplate;
function imageResponse(url) {
    return ({
        "attachment": {
            "type": "image",
            "payload": {
                "url": url,
                "is_reusable": true
            }
        }
    });
}
exports.imageResponse = imageResponse;
function quickReplies(text, quick_replies) {
    return ({ text, quick_replies });
}
exports.quickReplies = quickReplies;
