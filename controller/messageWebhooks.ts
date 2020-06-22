import processMessage from '../helpers/processMessage';

export default (req,res) => {
	if(req.body.object === 'page'){
		req.body.entry.forEach((entry: { messaging: any[]; }) => {
			entry.messaging.forEach((event: any) => {
				processMessage(event);
			});
		});
		res.status(200).end();
	}
	return;
};

