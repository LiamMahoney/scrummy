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
            path: opts.path,
            method: 'GET',
            headers: {
                Authorization: `Basic ${Buffer.from(`${config.gitUser}:${config.gitPassword}`).toString('base64')}`,
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
 * @param {Function} callback: callback function to call when the request is done
 */
function post(opts, data) {
    //TODO: validate options
    return new Promise((resolve, reject) => {
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
 * Sends a HTTP post request to the Github API.
 * 
 * @param {Object} opts: various HTTP request options
 * @param {Object} data: post data to send
 * @param {Function} callback: callback function to call when the request is done
 */
function graphQLPost(opts, data) {
    //TODO: validate options
    return new Promise((resolve, reject) => {
        let options = {
            hostname: config.githubApiUrl,
            port: 443,
            path: '/graphql',
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${config.gitUser}:${config.gitPassword}`).toString('base64')}`,
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



module.exports = {
    get,
    post,
    graphQLPost
}