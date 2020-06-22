import express from 'express';
const router = express.Router();
router.use(express.static(__dirname+'/static'));

router.get('/',(req,res) => res.sendFile(__dirname+'/static/index.html'));

export default router;