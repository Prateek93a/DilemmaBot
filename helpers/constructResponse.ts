export const signal = (senderId: any, signal: any) => {
    const responseBody = {
        "recipient": {
          "id": senderId
        },
        "sender_action": signal
    }
    return formResponseObject(responseBody);
}

export const message =  (senderId: any, response) => {
    const responseBody = {
      "recipient": {
        "id": senderId
      },
      "message": response,
    }
    return formResponseObject(responseBody);
}

export const persona_notification = (token: any, response) => {
  const responseBody = {
    "recipient": {
      "one_time_notif_token":token
    },
    "message": response,
    "persona_id": process.env.PERSONA_ID
  }
  return formResponseObject(responseBody);
}

export const persona_message = (senderId: any, response) => {
  const responseBody = {
    "recipient": {
      "id": senderId
    },
    "message": response,
    "persona_id": process.env.PERSONA_ID
  }
  return formResponseObject(responseBody);
}

const formResponseObject = (responseBody) => ({
    "uri": "https://graph.facebook.com/v7.0/me/messages",
    "qs": { "access_token": process.env.FACEBOOK_ACCESS_TOKEN },
    "method": "POST",
    "json": responseBody
})