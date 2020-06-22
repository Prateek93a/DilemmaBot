export function genericTemplate(elements: any) {
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

export function textMessage(text: string) { 
    return ({ text });
}

export function buttonTemplate(choices: string, url: string) {
    return ({
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text": "The results of your previous poll has been calculated.\n"+choices,
                "buttons": [
                    {
                      "type":"web_url",
                      "url":url,
                      "title":"View results"
                    }
                ]
            }
        }
    });
}

export function oneTimeNotificationTemplate(pollPsid){
    return({
        "attachment": {
            "type":"template",
            "payload": {
              "template_type":"one_time_notif_req",
              "title":"Click on Notify Me to know which option got the most points.",
              "payload": pollPsid
            }
        }
    })
}

export function imageResponse(url: string){
    return({
        "attachment":{
            "type":"image", 
            "payload":{
              "url":url, 
              "is_reusable":true
            }
        }
    })
}

export function quickReplies(text: any, quick_replies: any) {
     return ({ text, quick_replies }); 
}