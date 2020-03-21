const https = require('https');
const config = require('../config/config');

/**
 * 
 * @param {object} opts: various HTTP request options. See https://nodejs.org/docs/latest-v12.x/api/http.html#http_http_request_options_callback for valid options
 */
function get(opts) {
    //TODO: validate options
    return new Promise((resolve, reject) => {
        let options = {
            hostname: config.githubApiUrl,
            port: 443,
            path: encodeURI(opts.path),
            method: 'GET',
            headers: {
                Authorization: `Basic ${Buffer.from(`${config.gitUser}:${config.gitAPIToken}`).toString('base64')}`,
                'User-Agent': 'Scrummy'
            }
        }

        //TODO: need to do the same with regular options
        Object.assign(options.headers, opts.headers);

        let req = https.request(options, (res) => {
            let data = '';
            console.log(`response status code: ${res.statusCode}`);

            res.on('data', (d) => {
                data += d;
            });

            res.on('end', function () {
                return resolve({
                    data: JSON.parse(data),
                    statusCode: this.statusCode,
                    path: this.req.path,
                    method: this.req.method
                });
            });
        });

        req.on('error', (err) => {
            return reject(err);
        });

        req.end();
    });
}

/**
 * Sends a HTTP post request to the Github API.
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
            path: encodeURI(opts.path),
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
                return resolve({
                    data: JSON.parse(data),
                    statusCode: this.statusCode,
                    path: this.req.path,
                    method: this.req.method
                });
            });

        });

        req.on('error', (err) => {
            return reject(err);
        });

        req.write(JSON.stringify(data));
        req.end();
    });
}

/**
 * Sends a HTTP delete request to the Github API.
 * 
 * @param {Object} opts: various HTTP request options
 * @param {Object} data: post data to send
 */
function del(opts) {
    //TODO: validate options
    return new Promise((resolve, reject) => {
        let options = {
            hostname: config.githubApiUrl,
            port: 443,
            path: encodeURI(opts.path),
            method: 'DELETE',
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
                return resolve({
                    data: JSON.parse(data),
                    statusCode: this.statusCode,
                    path: this.req.path,
                    method: this.req.method
                });
            });

        });

        req.on('error', (err) => {
            return reject(err);
        });

        req.end();
    });
}

/**
 * Determines if the response from the REST api was successful
 * or not. If not, formats the error message based on the data
 * recieved from the response.
 * 
 * @param {int} expectedCode the expected HTTP code of the repsonse
 * @param {Object} resp the response object from one of [get, post, del] methods above
 */
async function handleRest(expectedCode, resp) {
    try {
        if (resp.statusCode === expectedCode) {
            return resp.data;
        } else {
            throw new Error(`expected ${expectedCode} received ${resp.statusCode} - ${resp.method} ${resp.path}: ${resp.data.message}`);
        }
    } catch (err) {
        throw new Error(err.stack);
    }
}

module.exports = {
    get,
    post,
    del,
    handleRest
}