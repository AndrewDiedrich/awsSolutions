'use strict';
require('dotenv').config();
const express = require('express');
const router = express.Router();
const AWS = require("aws-sdk");
const { AWS_SES } = require('../config');

const puppeteer = require('puppeteer');
const LINKEDIN_LOGIN = 'https://www.linkedin.com/'
const LOGIN_EMAIL = /*linkedin login email*/;
const LOGIN_PASSWORD = /*linkedin login password*/;
const LINKEDIN_URL = (personProfile) => `https://www.linkedin.com/in/${personProfile}/`;
const PERSON_PROFILE = `andrew-diedrich-a0a58893`;


// config AWS SES credentials
AWS.config.update( AWS_SES );
const BUCKET_NAME = 'linkedin-img-dev';

(async () => {
    /* Initiate the Puppeteer browser */
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    try {
    /*Go to Linkedin Login page */
    //await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1");
    await page.goto(LINKEDIN_LOGIN, { waitUntil: 'networkidle0' });
    /*New */
    // await page.click('.signin-link');
    // await page.waitForNavigation();
    // /*Enter Credentials, Login */

    // await page.type('#username', LOGIN_EMAIL);
    // await page.type('#password', LOGIN_PASSWORD);
    // await page.click('.btn__primary--large from__button--floating');
   
    /*OLD */
    /*Enter Credentials, Login */

    await page.type('#login-email', LOGIN_EMAIL);
    await page.type('#login-password', LOGIN_PASSWORD);
    await page.click('#login-submit');
    console.log('login clicked')
    await page.waitForNavigation();
    console.log('waiting for nav');
    console.log(page.url());

    /* Go to the LinkedIn profile page and wait for it to load */
        const contacts =  [
/*fill with objects*/
        ];
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            await page.goto(`${contact.MEMLINKIN}`, 
            { timeout: 0,
            });
            console.log(page.url());
            console.log('got to profile');
            /* Run javascript inside of the page */
            if ( page.url() === 'https://www.linkedin.com/in/unavailable/') 
            {    
                console.log('No linkedin pic')
                //return { imgSrc : 'No LinkedIn Profile Picture' }
                
            } else { 
            let img = await page.evaluate( async () => {
                let imgSrc = await document.querySelector('section[class="pv-profile-section pv-top-card-section artdeco-container-card ember-view"]>div>div>div>div').getAttribute("style").substring(23, 180);

                return imgSrc
                /* Returning an object filled with the scraped data */
                });

            /* Outputting what we scraped */
            console.log('imgSrc:', img);
            await page.setViewport({ width: 1000, height: 500 });
            await page.goto(img, 
            { timeout: 0
            });
            console.log('got to img url');

            const rect = await page.evaluate( async () => {
                const element = await document.querySelector('body>img')
                const {x, y, width, height} = element.getBoundingClientRect();              
                return {left: x, top: y, width, height};
            });

            const screenShot = await page.screenshot({
                    path: `./webscrap/images/${contact.MEMNAME}.jpg`, 
                    type: 'jpeg',
                    quality: 80,
                    clip:  {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                    }
            
            });
            //take image
            console.log('took picture');
            console.log (rect)
            
            // Create a promise on S3 service object
            var bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: BUCKET_NAME}).promise();

            // Handle promise fulfilled/rejected states
            bucketPromise.then(
            function() {
                // Create params for putObject call, bucket to use, what to call object and the image to uploade
                var objectParams = {
                    Bucket: BUCKET_NAME, 
                    Key: `${contact.MEMNAME}`, 
                    Body: screenShot, 
                    Metadata: {
                        'MCUR': `${contact.MCUR}`,
                        "MEMID": `${contact.MEMID}`,
                        "MEMNAME": `${contact.MEMNAME}`,
                        "MEMPOS": `${contact.MEMPOS}`,
                        "MEMLINKIN": `${contact.MEMLINKIN}`,
                        "MEMOTHLINK": `${contact.MEMOTHLINK}`,
                        "MEMEMAIL": `${contact.MEMEMAIL}`
                      }
                };
                // Create object upload promise
                var uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();
                uploadPromise.then(
                function(objectParams) {
                    console.log("Successfully uploaded data to " + BUCKET_NAME + "/" + `${contact.MEMNAME}`);
                });
            }).catch(
            function(err) {
                console.error(err, err.stack);
            });

                    
        }
            
    }
    await browser.close();


    } catch(error){
        console.log('Catch Error:', error);
    }
})();
