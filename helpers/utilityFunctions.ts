import request from 'request-promise';
import {createWriteStream, unlink} from 'fs';

export const baseFilePath = './temp_imgs/';

export const characterCount: Function = (text: string): number => {
	let count = 0;
	for(let i = 0; i < text.length; i++){
		let characterCode = text[i].charCodeAt(0);
		if((characterCode >= 65 && characterCode <= 90) || (characterCode >= 97 && characterCode <= 122)){
			count++;
		}
	}
	return count;
}

export const downloadImage = (url: string, filename: string) => {
    return new Promise((resolve,reject) => {
        request(url).pipe(createWriteStream(filename)).on('close',resolve).on('error',reject);
    });
}

export const deleteImage = (filename: string) => {
    return new Promise((resolve,reject)=>{
        unlink('./'+filename,(err)=>{
            if(err){
                reject();
            }
            resolve();
        });
    })
}