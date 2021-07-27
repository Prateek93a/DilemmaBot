export default (req,res) => {
	const hubChallenge = req.query[`hub.challenge`];
	const hubMode = req.query[`hub.mode`];
	const verifyTokenMatches = (req.query[`hub.verify_token`] === process.env.VERIFICATION_TOKEN);
	if(hubMode && verifyTokenMatches){
		res.status(200).send(hubChallenge);
	}else{
		res.status(403).end();
	}
};
