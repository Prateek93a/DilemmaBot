import express from 'express';
import { json, urlencoded } from 'body-parser';
import path from 'path';
import { config } from 'dotenv';
config();

import verificationController from './controller/verification';
import messageWebhookController from './controller/messageWebhooks';
import webRouter from './webRoutes'

const app = express();
app.use(json());
app.use(urlencoded({extended: true}));
app.set( "views", path.join( __dirname, "views" ));
app.set( "view engine", "ejs" );



app.listen(process.env.PORT || 3000, () => console.log('Webhook Server is listening at port 3000'));

app.get('/',verificationController).post('/',messageWebhookController);
app.use('/web',webRouter);
