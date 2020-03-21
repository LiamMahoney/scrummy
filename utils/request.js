const https = require('https');
const config = require('../config/config');

/**
 * Sends a HTTP post request to the Github GraphQL API.
 * 
 * @param {Object} opts: various HTTP request options
 * @param {Object} data: post data to send
 */
function post(opts, data) {
    //TODO: validate options
    return new Promise((resolve, reject) => {
        let options = {
            hostname: config.githubApiUrl,
            port: 443,
            path: '/graphql',
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${config.gitUser}:${config.gitAPIToken}`).toString('base64')}`,
                'User-Agent': 'Scrummy'
            }
        }
        
        //TODO: need to do the same with regular options
        Object.assign(options.headers, opts.headers);

        let req = https.request(options, (res) => {
            let data = '';

            res.on('data', (d) => {
                data += d;
            }).on('end', function () {
                if (this.statusCode === 200) {

                    let jdata = JSON.parse(data);
                    
                    if (jdata.errors.length > 0) {
                        // TODO: need to loop through jata array objects to create an array that holds all error messages.
                        reject (new Error(jdata.errors.join(" - ")));
                    } else {
                        resolve (jdata);
                    }
                } else {
                    reject (new Error(`expected 200 but got ${this.statusCode} for ${this.req.method} ${this.req.path}`));
                }
            });

        });

        req.on('error', (err) => {
            return reject(err);
        });

        req.write(JSON.stringify(data));
        req.end();
    });
}

module.exports = {
    post
}