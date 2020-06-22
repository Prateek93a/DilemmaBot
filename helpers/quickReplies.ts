import generalTexts from './generalTexts';

export default {
    feedback: {
        text: generalTexts.askFeedback,
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
}