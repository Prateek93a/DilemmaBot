"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    greetings: [
        {
            "title": "DilemmaBot",
            "image_url": "https://salty-headland-91169.herokuapp.com/web/images/hero-img.png",
            "subtitle": "A bot that helps you make choices.",
            "default_action": {
                "type": "web_url",
                "url": "https://salty-headland-91169.herokuapp.com/web",
                "webview_height_ratio": "full",
            },
        }
    ],
    results: (question, url) => [
        {
            "title": "The results are compiled",
            "subtitle": question,
            "default_action": {
                "type": "web_url",
                "url": url,
                "webview_height_ratio": "tall",
            },
        }
    ]
};
