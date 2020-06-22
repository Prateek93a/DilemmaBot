import request from 'request-promise';
import Filter from 'bad-words';
import vision from '@google-cloud/vision';
import { textMessage, quickReplies, genericTemplate, buttonTemplate, oneTimeNotificationTemplate, imageResponse } from './responses';
import {credibilityFunction, mapToRange} from './credibiltyFunction';
import {maxAllowedLimit, minAllowedLimit, maxPossibleLimit, minPossibleLimit} from './limits';
import {characterCount, downloadImage, deleteImage, baseFilePath} from './utilityFunctions';
import objectKeys from './keys';
import commands from './commands';
import payloads from './payloads';
import generalTexts, {textsWithInputs, noMatchTexts, greetText} from './generalTexts';
import genericElements from './genericElements';
import sqlCommands from './sqlCommands';
import * as constructResponse from './constructResponse';
import { Client } from 'pg';

// connection string
const connectionString = process.env.CONNECTION_STRING

const client = new Client({connectionString})

client.connect().then(async() => {
	try{
		await client.query(sqlCommands.createUserTable());
	}catch(err){
		console.log(err);
	}
});

// vision api client
const visionClient = new vision.ImageAnnotatorClient();

const filter = new Filter();

const optionsArray = ['A','B','C','D','E'];

const invalidPossibilityArray = ['LIKELY','VERY_LIKELY','POSSIBLE'];

// I am using a separate server for this
// base url
const baseUrl = process.env.BASE_URL;

// store the ongoing poll ids
const ongoingPollsSet = new Set();
// ongoingPollsSet.add(123);

// store the ongoing polls
const ongoingPollsArray = [];

// store the question of the user temperorily
const temperaryQuesMap = new Map();

// store the quick replies of the user temperorily
const temperaryAnsMap = new Map();

// store the image urls that user sends temperorily
const temperaryImageMap = new Map();

// store the responses of the user temperorily
const temperaryResponseMap = new Map();

// store if current user has asked question before or not
const temperaryHasAskedMap = new Map();

// store if current user has answered question  before or not
const temperaryHasAnsweredMap = new Map();

// image validation
const isImageValid = (senderId: any, url: string) => new Promise(async(resolve, reject) => {
	try{
		let filename = senderId + '' + Math.floor(Math.random()*Math.floor(Math.random()*1000)) + '.png';
		await downloadImage(url, filename);
		console.log('File downloaded');
		const [result] = await visionClient.safeSearchDetection(`./${filename}`);
		console.log('File analysised');
		await deleteImage(filename);
		console.log('File deleted');
		if(result.safeSearchAnnotation){
			console.log(result.safeSearchAnnotation);
			const {adultConfidence, nsfwConfidence, racyConfidence, violenceConfidence, adult, racy, violence} = result.safeSearchAnnotation;
			resolve(!(adultConfidence > 0.7 || nsfwConfidence > 0.7 || racyConfidence > 0.7 || violenceConfidence > 0.7 || invalidPossibilityArray.includes(adult as string) || invalidPossibilityArray.includes(racy as string) || invalidPossibilityArray.includes(violence as string)));
		}else{
			resolve(true);
		}
	}catch(err){
		console.log('Image error: ',err);
		reject();
	}
})

const sendTextMessage = (senderId, text) => {
	const responseObj = textMessage(text);
	const responseMessage = constructResponse.message(senderId, responseObj);
	return request(responseMessage);
};

const sendButtonMessage = async(senderId, question: string, answers: Array<any>, scores: Array<any>) => {
	let ansArray:string[] = [];
	for(let i = 0; i < answers.length; i++){
		ansArray.push('Option '+optionsArray[i]);
	}
	let choices: string = 'Choices available were:\n';
	for(let i = 0; i < answers.length; i++){
		choices += ansArray[i] + ': ' + answers[i] + '\n';
	}
	ansArray = ansArray.map((answer: string) => answer.trim().split(' ').join('.'));
	question = question.split(' ').join('_').trim();
	const ansString = ansArray.join('_');
	const scoreString = scores.join('_');
	const url = `${baseUrl}/${senderId}/?ans=${ansString}&score=${scoreString}`;
	const responseObj = buttonTemplate(choices, url);
	const responseMessage = constructResponse.message(senderId, responseObj);
	await request(responseMessage);
};

const sendImages = (senderId: any, url: string) => {
	const responseObj = imageResponse(url);
	const responseMessage = constructResponse.message(senderId, responseObj);
	return request(responseMessage);
}

const sendQuestion = async(senderId, poll) => {
	await sendSignal(senderId, objectKeys.typingOn);
	const options = [];
	const question: string = 'Question:\n' + poll.question;
	// send question
	await sendTextMessage(senderId,question);
	// send images
	if(poll.imageUrls.length){
		for(let i = 0; i < poll.imageUrls.length; i++){
			await sendImages(senderId, poll.imageUrls[i]);
		}
	}
	await sendSignal(senderId, objectKeys.typingOff);
	// send options with quick replies
	let choices: string = 'Choices available:\n';
	for(let i = 0; i < poll.answers.length; i++){
		choices += '(' + optionsArray[i] + ') ' + poll.answers[i] + '\n';
		options[i] = 'Option ' + optionsArray[i];
	}
	const answers = options.map((answer,index) => (
		{   "content_type": "text",
			"title": answer,
			"payload": '' + index,
		}
	));
	const responseObj = quickReplies(choices, answers);
	const responseMessage = constructResponse.message(senderId, responseObj);
	await request(responseMessage);
};

const sendGenericMessage = (senderId, genericType) => {
	const responseObj = genericTemplate(genericElements[genericType]);
	const responseMessage = constructResponse.message(senderId, responseObj);
	return request(responseMessage);
}

const sendSignal = (senderId, type) => {
	const responseObj = constructResponse.signal(senderId, type);
	return request(responseObj);
}

const sendNotificationChoice = (senderId) => {
	const ansArray = [
		{
			"content_type":"text",
			"title": generalTexts.yesNotify,
			"payload": payloads.yes,	
		},
		{
			"content_type":"text",
			"title": generalTexts.noNotify,
			"payload": payloads.no,	
		}
	]
	const question = (temperaryHasAnsweredMap.has(senderId) && temperaryHasAnsweredMap.get(senderId) == 0) ? generalTexts.getNotified : generalTexts.getNotified2;
	temperaryHasAnsweredMap.has(senderId) && temperaryHasAnsweredMap.delete(senderId);
	const responseObj = quickReplies(question, ansArray);
	const responseMessage = constructResponse.persona_message(senderId, responseObj);
	return request(responseMessage);
}

const sendNotificationRequest = (senderId, pollPsid) => {
	// see what goes to the payload of the one time notification message
	const responseObj = oneTimeNotificationTemplate(pollPsid);
	const responseMessage = constructResponse.persona_message(senderId, responseObj);
	return request(responseMessage);
}

const sendNotficationConfirm = (senderId, text) => {
	// see what goes to the payload of the one time notification message
	const responseObj = textMessage(text);
	const responseMessage = constructResponse.persona_message(senderId, responseObj);
	return request(responseMessage);
}

const sendNotfication = (token, answer) => {
	const responseObj = textMessage(answer);
	const responseMessage = constructResponse.persona_notification(token,responseObj);
	return request(responseMessage);
}

const checkState = async(senderId, handler: Function) => {
	try{
		const {rows} = await client.query(sqlCommands.getState([senderId]));
		const row = rows[0];
		if(row && (row.state == 1 || row.state == 2)){
			if(handler.name === 'handleStart'){
				await sendTextMessage(senderId, generalTexts.ongoingStart);
			}else if(handler.name === 'handleReceive'){
				await sendTextMessage(senderId, generalTexts.ongoingreceive);
			}else if(handler.name === 'handleCredibility'){
				await sendTextMessage(senderId, generalTexts.ongoingCred);
			}else if(handler.name === 'handleEndFlow'){
				handleEndFlow(senderId);
				return;
			}else if(handler.name === 'handleEnd'){
				await sendTextMessage(senderId, generalTexts.finishCurrent);
				return;
			}else if(handler.name === 'handleGreet'){
				handleGreet(senderId, generalTexts.greet1);
				return;
			}
			else{
				await sendTextMessage(senderId, generalTexts.guide);
				row.state == 2 ? await sendTextMessage(senderId, generalTexts.afterGuide2) : await sendTextMessage(senderId, generalTexts.afterGuide1);
			}
		}else if(row && row.state == 3){
			await sendTextMessage(senderId, generalTexts.wait2);
			return;
		}else if(row && row.state == 4){
			await sendTextMessage(senderId, generalTexts.finishCurrent);
			const pollCreator = temperaryResponseMap.get(senderId);
			const poll = ongoingPollsArray.filter(poll => poll.sender === pollCreator)[0];
			await sendQuestion(senderId, poll);
			return;
		}
		else if(row && row.state == 5){
			await sendTextMessage(senderId, generalTexts.wait);
			return;
		}else if(row && row.state == 6){
			await sendNotficationConfirm(senderId, generalTexts.pleaseReply);
			await sendNotificationChoice(senderId);
			return;
		}else if(row && row.state == 0 && handler.name === 'handleEndFlow'){
			await sendTextMessage(senderId, generalTexts.noFlow);
			return;
		}
		else{
			handler(senderId);
		}

	}catch(err){
		console.log(err);
		return handleError(senderId);
	}
}

const handleGreetings = async(senderId) => {
	try{
		await sendSignal(senderId, objectKeys.typingOn);
		const res = await request.get(`https://graph.facebook.com/${senderId}?fields=first_name&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`);
		const name = JSON.parse(res).first_name;
		const {rows} = await client.query(sqlCommands.findByPsid([senderId]))
		if(rows && rows[0]){
			// if the user has already used the app before, then we just want to remove any
			// pending of his/her pending actions and change his/her state back to 0.
			const row = rows[0];
			if(temperaryResponseMap.has(senderId)) temperaryResponseMap.delete(senderId);
			if(temperaryAnsMap.has(senderId)) temperaryAnsMap.delete(senderId);
			if(temperaryQuesMap.has(senderId)) temperaryQuesMap.delete(senderId);
			if(temperaryHasAskedMap.has(senderId)) temperaryHasAskedMap.delete(senderId);
			if(temperaryHasAnsweredMap.has(senderId)) temperaryHasAnsweredMap.delete(senderId);
			if(temperaryImageMap.has(senderId)) temperaryImageMap.delete(senderId);
			if(row.state !== 0){
				await client.query(sqlCommands.updateUserState([0,senderId]));
				await sendTextMessage(senderId, textsWithInputs.welcomeBack(name));
				await sendSignal(senderId, objectKeys.typingOff);
			}else{
				await sendTextMessage(senderId,  textsWithInputs.welcomeBack(name));
				await sendSignal(senderId, objectKeys.typingOff);
			}
		}else{
			// the user is using the app for the first time.
			await client.query(sqlCommands.insertIntoUsers([senderId,0,1.0,0,0,0]));
			await sendGenericMessage(senderId, objectKeys.greetings);
			await sendTextMessage(senderId,  textsWithInputs.greetings(name));
			await sendTextMessage(senderId, generalTexts.guide);
			await sendSignal(senderId, objectKeys.typingOff);
		}
	}catch(err){
		console.log(err);
		return handleError(senderId);
	}
}

const handleStart = async(senderId) => {
	if(ongoingPollsSet.has(senderId)){
		await sendTextMessage(senderId, generalTexts.alreadyHasPoll);
		return;
	}
	// ask for question
	try{
		await client.query(sqlCommands.updateUserState([1,senderId])); 
		const {rows} = await client.query(sqlCommands.findIfAsked([senderId]));
		const row = rows[0];
		temperaryHasAskedMap.set(senderId,row.has_asked);
		if(row.has_asked){
			await sendTextMessage(senderId, generalTexts.start2);
		}else{
			await client.query(sqlCommands.changeIfAsked([1,senderId]));
			await sendTextMessage(senderId, generalTexts.start1);
		}
	}catch(err){
		console.log(err);
		return handleError(senderId);
	}
}

const handleEnd = async(senderId) => {
	if(!ongoingPollsSet.has(senderId)){
		await sendTextMessage(senderId, generalTexts.endUnablePoll);
		return;
	}
	try{
		await sendTextMessage(senderId, generalTexts.fetchResults);
		await sendSignal(senderId, objectKeys.typingOn);
		await client.query(sqlCommands.updateUserState([3,senderId]));
		let index = 0;
		let pollObj = null;
		for(let i = 0; i < ongoingPollsArray.length; i++){
			if(ongoingPollsArray[i].sender === senderId){
				index = i;
				pollObj = ongoingPollsArray[i];
				break;
			}
		}
		ongoingPollsArray.splice(index,1);
		ongoingPollsSet.delete(senderId);
		const scoresArray = pollObj.scoresArray;
		const psidArray = [];

		pollObj.psids.forEach((value, key) => {
			psidArray.push(key);
		})

		let winningIndex = 0, maxScore = scoresArray[0], flag = 0; 
		// flag is to keep track of whether all options have same amount of votes or different
		scoresArray.forEach((score, index) => {
			if(score > maxScore){
				flag = 1;
				maxScore = score;
				winningIndex = index;
			}
		})

		// send user the results, don't want to block the execution here
		client.query(sqlCommands.updateUserState([0, senderId]))
		.then(async()=>{
			await sendButtonMessage(senderId, pollObj.question, pollObj.answers, scoresArray);
			await sendSignal(senderId, objectKeys.typingOff);
		}).catch(err=>{
			console.log(err);
			return handleError(senderId);
		});
		
		let answer = 'No option received majority';

		let question = pollObj.question.length > 80 ? pollObj.question.substr(0,80) + '...' : pollObj.question;

		if(flag === 0){
			// notify that there is no winner
			pollObj.notificationRecipients.forEach((user)=>{
				sendNotfication(user, textsWithInputs.notification(question,answer));
			});
		}else{
			// notify that there is winner
			answer = pollObj.answers[winningIndex];
			pollObj.notificationRecipients.forEach((user)=>{
				sendNotfication(user, textsWithInputs.notification(question,answer));
			});

			// update credibilities in the background
			const votersCredibilityChange = credibilityFunction(scoresArray, pollObj.psids);

			// chances of failure lies here
			// queries will execute in serialized mode
			for(let i = 0; i < psidArray.length; i++){
				let id = psidArray[i];
				let {rows} = await client.query(sqlCommands.getCredibility([id]));
				let row = rows[0];
				let credibilityChange = votersCredibilityChange.get(id);
				let newCred = row.credibility;
				let change = 0;
				if(credibilityChange !== 0){
					newCred = newCred - credibilityChange;
					change = -1;
				}else{
					newCred = newCred + (0.05)*scoresArray.length;
					change = +1;
				}
				newCred = mapToRange(newCred, minPossibleLimit, maxPossibleLimit, minAllowedLimit, maxAllowedLimit);
				await client.query(sqlCommands.updateCredibility([newCred, change, id]));
			}
		}
	}catch(err){
		console.log(err);
		return handleError(senderId);
	}
	
}

const handleReceive = async(senderId) => {
	if(!ongoingPollsSet.size || (ongoingPollsSet.size === 1 && ongoingPollsSet.has(senderId))){
		await sendTextMessage(senderId, generalTexts.noPollsAvailable);
		return;
	}
	let pollObj = null;
	for(let i = 0; i < ongoingPollsArray.length; i++){
		let poll = ongoingPollsArray[i];
		if(poll.sender !== senderId && !poll.psids.has(senderId)){
			pollObj = poll;
			break;
		}
	}
	if(pollObj === null){
		// if no such polls are available where the user hasn't voted yet, send messvotersCredibilityChangeage
		await sendTextMessage(senderId, generalTexts.noPollsAvailable);
		return;
	}else{
		// send the quick message
		await sendTextMessage(senderId, generalTexts.fetchQues);
		try{
			const {rows} = await client.query(sqlCommands.findIfAnswered([senderId]));
			temperaryHasAnsweredMap.set(senderId, rows[0].has_answered);
			await client.query(sqlCommands.updateUserStateReceive([4,senderId]));
			temperaryResponseMap.set(senderId, pollObj.sender);
			await sendQuestion(senderId, pollObj);
			return;
		}catch(err){
			console.log(err);
			return handleError(senderId);
		}
	}
}

const handleCredibility = async(senderId) => {
	try{
		await sendTextMessage(senderId, generalTexts.fetchCred);
		await sendSignal(senderId, objectKeys.typingOn);
		await client.query(sqlCommands.updateUserState([5,senderId])); 
		const {rows} = await client.query(sqlCommands.getCredibility([senderId]));
		await client.query(sqlCommands.updateUserStateAndChange([senderId]));
		const row = rows[0];
		const credibility = Math.floor(mapToRange(row.credibility,minAllowedLimit,maxAllowedLimit,0,100));
		switch(row.has_changed){
			case 0:
				await sendTextMessage(senderId, textsWithInputs.credibilityNoChange(credibility));
				break;
			case 1:
				await sendTextMessage(senderId, textsWithInputs.credibilityPositiveChange(credibility));
				break;
			case -1:
				await sendTextMessage(senderId, textsWithInputs.credibilityNegativeChange(credibility));
				break;
			default:
				handleError(senderId);
				break;
		}
		await sendSignal(senderId, objectKeys.typingOff);
	}catch(err){
		console.log(err);
		return handleError(senderId);
	}
}

const handleGreet = async(senderId, text?: string) => {
	if(!text || text.length == 0){
		await sendTextMessage(senderId, greetText[Math.floor(Math.random()*greetText.length)])
	}else{
		await sendTextMessage(senderId, text);
	}
}

const handleEndFlow = async(senderId) => {
	// are you sure?
	temperaryQuesMap.delete(senderId);
	temperaryAnsMap.delete(senderId);
	await sendTextMessage(senderId, generalTexts.wait);
	await client.query(sqlCommands.resetUsers([senderId]))
	await sendTextMessage(senderId, generalTexts.ongoingEnd);
}

const handleError = async(senderId) => {
	// roll back everything
	try{
		await client.query(sqlCommands.updateUserState([0,senderId]));
		if(temperaryResponseMap.has(senderId)) temperaryResponseMap.delete(senderId);
		if(temperaryAnsMap.has(senderId)) temperaryAnsMap.delete(senderId);
		if(temperaryQuesMap.has(senderId)) temperaryQuesMap.delete(senderId);
		if(temperaryHasAskedMap.has(senderId)) temperaryHasAskedMap.delete(senderId);
		if(temperaryHasAnsweredMap.has(senderId)) temperaryHasAnsweredMap.delete(senderId);
		if(temperaryImageMap.has(senderId)) temperaryImageMap.delete(senderId);
		await sendTextMessage(senderId, generalTexts.error);
	}catch(err){
		console.log(err);
		await sendTextMessage(senderId, generalTexts.error);
	}
}

const handleState1 = async(senderId, message) => {
	try{
		if(!temperaryQuesMap.has(senderId)){
			temperaryQuesMap.set(senderId,"");
		}
		if(!temperaryImageMap.has(senderId)){
			temperaryImageMap.set(senderId,[]);
		}
	
		// if user has sent images
		if(message.attachments && message.attachments != {}){
			const imageArray: string[] = temperaryImageMap.get(senderId);
			if(imageArray.length == 2){
				await sendTextMessage(senderId, generalTexts.imgExceed);
				return;
			}
			let imageFlag = 0;
			for(let attachment of message.attachments){
				if(attachment.type == 'image'){
					imageArray.push(attachment.payload.url);
					if(imageArray.length == 2){
						break;
					}
				}else{
					imageFlag = 1;
				}
			}
			if(imageFlag) await sendTextMessage(senderId, generalTexts.onlyImg);
			temperaryImageMap.set(senderId, imageArray);
			await sendSignal(senderId, objectKeys.seen);
			return;
		}
	
		// if user has sent text
		let ques:string = temperaryQuesMap.get(senderId);
		if(message.text.trim() == '👍️' || (message.text.trim().charCodeAt(0) == '👍️'.charCodeAt(0) && message.text.trim().charCodeAt(1) == '👍️'.charCodeAt(1)) || message.text.includes('thumbsup')){
			if(!ques.length){
				await sendTextMessage(senderId, generalTexts.emptyQues);
				return;
			}
	
			// foul words detection
			const sanitizedQues = filter.clean(ques.trim());
			if(ques.trim() != sanitizedQues){
				temperaryQuesMap.set(senderId,'');
				temperaryImageMap.set(senderId,[]);
				await sendTextMessage(senderId, generalTexts.foul);
				return;
			}
	
			// inappropriate image detection
			const imageArray: string[] = temperaryImageMap.get(senderId);
			for(let i = 0; i < imageArray.length; i++){
				let isImageValidBool = await isImageValid(senderId, imageArray[i]);
				if(!isImageValidBool){
					temperaryQuesMap.set(senderId,'');
					temperaryImageMap.set(senderId,[]);
					await sendTextMessage(senderId, generalTexts.inappropriateImg);
					return;
				}
			}
	
			// look for character count
			const count = characterCount(ques.trim());
			if(count < 80){
				await sendTextMessage(senderId, textsWithInputs.moreCharacters(80 - count));
				return;
			}
	
			// ask for answers
			await sendTextMessage(senderId, generalTexts.wait);
			await sendSignal(senderId, objectKeys.typingOn);
			try{
				await client.query(sqlCommands.updateUserState([2,senderId]));
				if(temperaryHasAskedMap.get(senderId)){
					await sendTextMessage(senderId, generalTexts.askForOptions2);
					await sendSignal(senderId, objectKeys.typingOff);
				}else{
					await sendTextMessage(senderId, generalTexts.askForOptions);
					await sendSignal(senderId, objectKeys.typingOff);
				}
			}catch(err){
				console.log(err);
				return handleError(senderId);
			}
	
		}else{
			ques = ques + '\n' + message.text;
			temperaryQuesMap.set(senderId,ques);
			await sendSignal(senderId, objectKeys.seen);
		}
	}catch(err){
		console.log(err);
		await sendTextMessage(senderId, generalTexts.error);
	}
}

const handleState2 = async(senderId, message) => {
	if(!temperaryAnsMap.has(senderId)){
		temperaryAnsMap.set(senderId,[]);
	}
	// if user has sent images
	if(message.attachments && message.attachments != {}){
		await sendSignal(senderId, objectKeys.seen);
		await sendTextMessage(senderId, generalTexts.noImg);
		return;
	}

	let ans: Array<string> = temperaryAnsMap.get(senderId);
	if(message.text.trim() == '👍️' || (message.text.trim().charCodeAt(0) == '👍️'.charCodeAt(0) && message.text.trim().charCodeAt(1) == '👍️'.charCodeAt(1)) || message.text.includes('thumbsup')){
		if(ans.length < 2){
			await sendTextMessage(senderId, textsWithInputs.askForMoreReplies(ans.length));
			return;
		}
		if(ans.length > 5){
			ans.splice(5);
			await sendTextMessage(senderId, generalTexts.countError);
		}

		await sendTextMessage(senderId, generalTexts.wait);
		await sendSignal(senderId, objectKeys.typingOn);

		try{
			await client.query(sqlCommands.updateUserState([0,senderId]));
			ongoingPollsSet.add(senderId);
			const pollObj = {
				"sender": senderId,
				"question": temperaryQuesMap.get(senderId),
				"answers": temperaryAnsMap.get(senderId),
				"psids": new Map(),
				"scoresArray": [],
				"notificationRecipients": [],
				"imageUrls": temperaryImageMap.get(senderId)
			}
			for(let i = 0; i < temperaryAnsMap.get(senderId).length; i++){
				pollObj.scoresArray.push(0);
			}
			
			ongoingPollsArray.push(pollObj);
			temperaryQuesMap.delete(senderId);
			temperaryAnsMap.delete(senderId);
			temperaryHasAskedMap.delete(senderId);
			temperaryImageMap.delete(senderId);
			
			await sendTextMessage(senderId, generalTexts.flowComplete);
			await sendSignal(senderId, objectKeys.typingOff);
		}catch(err){
			console.log(err);
			return handleError(senderId);
		}	
	}else{
		// foul words detection
		const sanitizedOption = filter.clean(message.text.trim());
		if(message.text.trim() != sanitizedOption){
			await sendTextMessage(senderId, generalTexts.foulOption);
			return;
		}
		ans.push(message.text);
		temperaryAnsMap.set(senderId,ans);
		await sendSignal(senderId, objectKeys.seen);
	}
}

const handleState3 = async(senderId) => {
	await sendTextMessage(senderId, generalTexts.wait);
}

const handleState4 = async(senderId, message) => {
	const pollCreator = temperaryResponseMap.get(senderId);
	try{
		if(!ongoingPollsSet.has(pollCreator)){
			// poll ended before user casted a vote
			await client.query(sqlCommands.updateUserState([0,senderId]));
			await sendTextMessage(senderId, generalTexts.pollEnd);
		}else{
			const poll = ongoingPollsArray.filter(poll => poll.sender === pollCreator)[0];

			// if user has sent images
			if(message.attachments && message.attachments != {}){
				await sendTextMessage(senderId, generalTexts.pleaseReply);
				await sendQuestion(senderId, poll);
				return;
			}

			const options = [];
			for(let i = 0; i < poll.answers.length; i++){
				options[i] = 'Option ' + optionsArray[i];
			}
			if(!options.includes(message.text.trim())){
				// answer doesnot match, send the quick message again
				await sendTextMessage(senderId, generalTexts.answerNoMatch);
				await sendQuestion(senderId, poll);
			}else{
				await sendTextMessage(senderId, generalTexts.wait2);
				await sendSignal(senderId, objectKeys.typingOn);
				// change the state back to 0
				// queries will execute in serialized mode
				let cred = 1;
				const {rows} = await client.query(sqlCommands.getCredibility([senderId]));
				await client.query(sqlCommands.updateUserState([6,senderId]));
				const row = rows[0];
				cred = row.credibility;
				for(let i = 0; i < ongoingPollsArray.length; i++){
					if(ongoingPollsArray[i].sender === poll.sender){
						ongoingPollsArray[i].psids.set(senderId, message.quick_reply.payload);
						ongoingPollsArray[i].scoresArray[parseInt(message.quick_reply.payload)] += cred;
						// send confirmation message
						await sendTextMessage(senderId, generalTexts.responseRecorded);
						await sendSignal(senderId, objectKeys.typingOff);
						await sendNotificationChoice(senderId);
						return;
					}
				}
			}
		}

	}catch(err){
		console.log(err);
		return handleError(senderId);
	}
}

const handleState5 = async(senderId) => {
	await sendTextMessage(senderId, generalTexts.wait);
}

const handleState6 = async(senderId, message) => {
	// if user has sent images
	if(message.attachments && message.attachments != {}){
		await sendTextMessage(senderId, generalTexts.pleaseReply);
		await sendNotificationChoice(senderId);
		return;
	}

	await sendSignal(senderId, objectKeys.typingOn);
	if((message.payload && message.payload == payloads.yes) || (message.text.trim().toLowerCase().includes('yes'))){
		await client.query(sqlCommands.updateUserState([0,senderId]));
		await sendNotificationRequest(senderId, temperaryResponseMap.get(senderId));
		temperaryResponseMap.delete(senderId);
	}else if((message.payload && message.payload == payloads.no) || (message.text.trim().toLowerCase().includes('no'))){
		temperaryResponseMap.delete(senderId);
		await client.query(sqlCommands.updateUserState([0,senderId]));
		await sendNotficationConfirm(senderId,generalTexts.ok);
	}else{
		await sendNotficationConfirm(senderId, generalTexts.pleaseReply);
		await sendNotificationChoice(senderId);
	}
	await sendSignal(senderId, objectKeys.typingOff);
}


const handleFlow = async(senderId, message) => {
	try{
		const {rows} = await client.query(sqlCommands.getState([senderId]));
		const row = rows[0];
		switch(row.state){
			case 1:
				handleState1(senderId, message);
				break;
			case 2:
				handleState2(senderId, message);
				break;
			case 3:
				handleState3(senderId);
				break;
			case 4:
				handleState4(senderId, message);
				break;
			case 5:
				handleState5(senderId);
				break;	
			case 6:
				handleState6(senderId, message);
				break;
			default:
				await sendTextMessage(senderId, noMatchTexts[Math.floor(Math.random()*noMatchTexts.length)]);
				break;
		}
	}catch(err){
		console.log(err);
		return handleError(senderId);
	}
}

const checkEntity = (entity: any, command: string): boolean => {
	return (entity[command] && entity[command][0].confidence >= 0.88);
}

const handleMessageEvent = async(event) => {
	// handle message event
	const senderId = event.sender.id;

	const message = event.message;

	// check if user has sent an attachment
	if(message.attachments && message.attachments != {}){
		console.log(message.attachments);
		handleFlow(senderId, message);
		return;
	}

	if(message.nlp?.entities && message.nlp.entities != {}){
		const entity =  message.nlp.entities;
		if(checkEntity(entity,commands.start)){
			// start a new poll
			checkState(senderId, handleStart);
			return;
		}else if(checkEntity(entity,commands.end)){
			// handle end poll
			checkState(senderId, handleEnd);
			return;
		}else if(checkEntity(entity,commands.endFlow)){
			// handle end poll
			checkState(senderId, handleEndFlow);
			return;
		}else if(checkEntity(entity,commands.receive)){
			// fetch a poll
			checkState(senderId, handleReceive);
			return;
		}else if(checkEntity(entity,commands.credibility)){
			// fetch credibility
			checkState(senderId, handleCredibility);
			return;
		}else if(checkEntity(entity,commands.options) || checkEntity(entity,commands.question) || checkEntity(entity,commands.notifications)){
			// handle flow stuff
			handleFlow(senderId, message);
			return;
		}else if(checkEntity(entity,commands.greet)){
			// handle these greetings differently
			checkState(senderId, handleGreet);
			return;
		}else{
			handleFlow(senderId, message);
		}
	}else{
		handleFlow(senderId, message);
	}
}

const handleGuide = async(senderId) => await sendTextMessage(senderId, generalTexts.guide);

const handlePostbackEvent = async(event) => {
	// handle postback event
	const senderId = event.sender.id;

	if(event.postback.payload){
		const payload = event.postback.payload;
		switch(payload){
			case payloads.init:
				handleGreetings(senderId);
				break;
			case payloads.help:
				checkState(senderId, handleGuide);
				break;
			default:
				console.log(event.postback)
				break;
		}
	}
	return;
}

const handleAttachmentEvent = async(event) => {
	// handle attachment event
	const senderId = event.sender.id;
	await sendTextMessage(senderId, generalTexts.support);
}

const handleOptinEvent = (event) => {
	const senderId = event.sender.id;
	const payload = event.optin.payload;
	const token = event.optin.one_time_notif_token;
	if(payload && token && ongoingPollsSet.has(payload)){
		for(let i = 0; i < ongoingPollsArray.length; i++){
			if(ongoingPollsArray[i].sender == payload){
				ongoingPollsArray[i].notificationRecipients.push(token);
				break;
			}
		}
		sendNotficationConfirm(senderId,generalTexts.okNotify);
	}else{
		sendTextMessage(senderId, generalTexts.pollEnd);
	}
}

export default async(event) => {
	if(event.message) handleMessageEvent(event);
	else if(event.postback) handlePostbackEvent(event);
	else if(event.attachment) handleAttachmentEvent(event);
	else if(event.optin) handleOptinEvent(event);
};