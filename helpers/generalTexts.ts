export default {
    guide: "Below are the available services. You can ask me to:\n(1) Start to start a new poll\n(2)End the your current ongoing poll\n(3) Send you others' current running poll.\n(4) End the flow of creating poll.\n(5) Send you your current credibility scores.\nUse the menu buttons for help and to know more about the bot.",
    q1Text: "What type of service do you wish to avail?",
    getNotified:"Hey there! I am the NotifyBot, friend of DilemmaBot. If this poll seems genuinely interesting to you and you would like to know the outcome, I can notify you about the results of this poll when it ends. Would you like to be notified? Note that you will only be notified about which option received the most points and not the entire analysis.",
    yesNotify:"Yes, notify me.",
    noNotify:"Nah, not for this.",
    okNotify:'Ok, you will be notified.',
    askFeedback: "How would you like to rate your experience?",
    exitBeforeFeedback: "Thanks for stoping by. We hope we were able to serve your queries well.",
    goodFeedback: "Thanks you for the amazing feedback!",
    neutralFeedback: "Ok, would you like to provide suggestions so that we can serve you better next time?",
    badFeedback: "Oh! That's unfortunate. Would you like to talk to our support team and express your grievances? This is will help us serve you better next time.",
    exitAfterFeedback: "Looking forward to working with you again. Type #start to restart the flow.",
    alreadyHasPoll: "A poll that you started is already running. You need to end that poll before you can start a new one.",
    endUnablePoll: "You don't have any ongoing poll. I can start one if you want me to.",
    noPollsAvailable: "Sorry, there are no more ongoing polls available right now. Would you like to start one?",
    start1: "Nice! Type in your question and then send a 👍️ thumbsup to indicate that you are done. Your question should have atleast 80 alphabetic characters which means you need to ask your question elaborately to get the best results. Be creative here, formulate a story, provide good context and add relevant details that you think might be useful for others to understand the problem. You can use images(max 2). Also avoid exposing your personal details, using swear words and inappropriate images. You can end the flow anytime, just tell me whenever you want to.",
    start2: "Great! you know the drill. Type in your question and then send a 👍️ thumbsup to indicate that you're done typing.",
    askForOptions: "Ok, now type in your options. Send each option in a separate message and then send a 👍️ thumbsup to indicate that you are done.\nTry to keep the options short. \nNote that you can only send atmost 5 options. Rest will not be considered.",
    askForOptions2:"Now provide your options (maximum 5) and then send a 👍️ thumbsup when you're done.",
    wait: "Please wait while your query is being processed...",
    wait2: "Please wait...",
    fetchQues: "Fetching question...",
    fetchCred: "Fetching your score...",
    notUnderstand: "Sorry I don't understand what you mean.",
    pollCreated: "Done! Your poll has been created. Now wait for some time, preferably an hour or two, before you end the poll to see the results.",
    error: "There is an error. Please try again from the begining.",
    emptyQues: "Please provide valid question.",
    afterGuide1: "Finish the question.",
    afterGuide2: "Provide the remaining options.",
    ongoingStart: "Please complete the current flow before starting another. Alternatively you can tell me to end this flow.",
    ongoingCred: "Please complete the current flow first.",
    ongoingreceive: "You need to finish the current flow before you can participate in polls. Alternatively you can tell me to end this flow.",
    ongoingEnd: "The flow has ended.",
    pollEnd: "Sorry, the poll has ended. No issues, you may look for other ongoing polls or create one yourself if you don't have your own ongoing poll.",
    flowComplete: "Your question has been registered. Now wait for few hours before ending the poll to receive good results. In the meantime, I can fetch you ongoing polls of other users if you want to answer questions.",
    countError: "Note that only initial 5 entries will be considered.",
    imgExceed: "Sorry, atmost 2 images are allowed. Anymore attachments will not be considered.",
    finishCurrent: "Please finish the current process.",
    answerNoMatch: "Your answer doesn't match the available options. Please try again.",
    savingResponse: "Saving your response...",
    notification: "Notification: There is an update to your credibility score as one or more of the polls that you participated in, have ended.",
    responseRecorded: "Your response has been recorded.",
    fetchResults: "Fetching results of your last poll...",
    unsatisfiedResults: "If you are not satisfied you may choose to restart the poll. Do you want to restart the poll?",
    restartPoll: "Yes, I want to",
    noRestart:"Nope, I don't want to restart the poll",
    credNoEffect:'Since the poll has no winner, your credibility score will not be affected.',
    credEffect:'Your credibility score will change shortly.',
    pleaseReply: 'Please reply to the question.',
    ok:'Ok.',
    getNotified2:'Shall I notify you about the results?',
    support:'Support for images and videos coming soon. For now, you can take advantage of the texts.',
    foul: 'Use of foul words detected. Please resubmit your question without making use of swear words and foul language.',
    greet1: 'Greetings to you too. Please finish the flow now.',
    noFlow: 'There is no flow going on.',
    foulOption: 'Swear word(s) detected. This option will not be considered. Please resubmit another option.',
    noImg:'Sorry, attachments are not allowed for choices.',
    inappropriateImg: 'Inappropriate image(s) detected. Please resubmit your question and strictly avoid using inappropriate content.',
    choices: 'Your choices are as follows:',
    onlyImg: 'Only image attachments are allowed.'
}

export const textsWithInputs = {
    moreCharacters: (count: number) => `Your question should have ${count} more alphabetic characters. Elaborate further on your question or tell me if you want to end the flow so you can submit different text.`,
    notification: (question: string, answer: string) => `Hey, really sorry to interrupt the conversation but you opted in to be notified for the results of following question: ${question}.\nThe result is: '${answer}'.\n${answer == 'No option received majority'?'Since the poll has no winner, your credibility score will not be affected.':'Your credibility score will change shortly'} Please carry on with whatever was going on.`,
    greetings: (name: string) => `Hey ${name}, Welcome! I am the DilemmaBot, here to help you. Ask about questions and choices that bug you, anonymously. Get advice from people on the internet, and with my smart credibility calculation technique, have, maybe not perfect, but good assurance that the answer reflects opinions of general crowd, not personal biases.`,
    welcomeBack: (name: string) => `Welcome back ${name}! Ready to make another decision?`,
    results: (answer: string) => `So the answer based on the general consensus is\n'${answer}'`,
    askForMoreReplies: (num: number) => `You need to provide atleast ${2-num} more replies for others to choose from.`, 
    credibilityPositiveChange: (credibility: number) => `Great! Your credibility score has increased to ${credibility}. Keep up the good work 👍️.`,
    credibilityNegativeChange: (credibility: number) => `Uh oh! Your credibility score has decreased to ${credibility}. Try to keep your answers similar to general consensus.`,
    credibilityNoChange: (credibility: number) => `Your current credibility score is ${credibility}(out of 100).`
}

export const noMatchTexts = ["Sorry I don't understand what you mean.","Hmm, I have trouble understanding that.", "I think you should refer to the available services", "Please be a little more specific.", "Can you clarify what exactly you mean by that."];

export const greetText = ['I think we have already met', 'Hello again', 'Greeting!', 'We have greeted each other before.']