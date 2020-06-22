export default {
    greetings: [
        {
            "title": "DilemmaBot",
            "image_url": process.env.WEB_URL+"/images/hero-img.png",
            "subtitle": "A bot that helps you make choices.",
            "default_action": {
                "type": "web_url",
                "url": process.env.WEB_URL,
                "webview_height_ratio": "full",
            },
        }
    ],
    results: (question: string, url: string) => [
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