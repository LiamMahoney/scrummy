const https = require('https');
const config = require('../config/config');

/**
 * 
 * @param {object} opts: various HTTP request options. See https://nodejs.org/docs/latest-v12.x/api/http.html#http_http_request_options_callback for valid options
 */
function get(opts) {
    //TODO: validate options

    let options = {
        hostname: config.githubApiUrl,
        port: 443,
        path: opts.path,
        method: 'GET',
        headers: {
            Authorization: `Basic ${Buffer.from(`${config.gitUser}:${config.gitPassword}`).toString('base64')}`,
            'User-Agent': 'Scrummy'
        }
    }

    let req = https.request(options, (res) => {
        let data = '';
        console.log(`response status code: ${res.statusCode}`);

        res.on('data', (d) => {
            data += d;
        });

        res.on('end', () => {
            console.log(`data: ${data}`);
        })
    });

    req.on('error', (err) => {
        console.error(err);
    });

    req.end();
}

/**
 * Sends a HTTP post request to the Github API.
 * 
 * @param {Object} opts: various HTTP request options
 * @param {Object} data: post data to send 
 */
function post(opts, data) {
    return new Promise((resolve, reject) => {
        //TODO: validate options

        let options = {
            hostname: config.githubApiUrl,
            port: 443,
            path: opts.path,
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${config.gitUser}:${config.gitPassword}`).toString('base64')}`,
                'User-Agent': 'Scrummy'
            }
        }

        let req = https.request(options, (res) => {
            let data = '';

            res.on('data', (d) => {
                data += d;
            }).on('end', function () {
                resolve({
                    data: JSON.parse(data),
                    statusCode: this.statusCode,
                    path: this.req.path,
                    method: this.req.method
                });
            });

        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(JSON.stringify(data));
        req.end();
    });
}



module.exports = {
    get,
    post
}