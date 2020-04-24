const https = require('https');
const config = require('../config/config');
const url = require('url');

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
                //FIXME: check if response is valid JSON
                return resolve({
                    data: data? JSON.parse(data) : '',
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
 * Sends a HTTP patch request to the Github API.
 * 
 * @param {Object} opts: various HTTP request options
 * @param {Object} data: data to send
 */
function patch(opts, data) {
    //TODO: validate options
    return new Promise((resolve, reject) => {
        let options = {
            hostname: config.githubApiUrl,
            port: 443,
            path: encodeURI(opts.path),
            method: 'PATCH',
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
            // TODO: need to create better error message here. Check resp.data.errors length and then iterate over each object in the array.
            throw new Error(`expected ${expectedCode} received ${resp.statusCode} - ${resp.method} ${resp.path}: ${resp.data.message}`);
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Determines if the response from the GraphQL api was successsful 
 * or not. If not, formats the error message based on the data recieved
 * from the response.
 * 
 * @param {Object} resp the response object from the post method above
 */
async function handleQL(resp) {
    try {
        if (resp.statusCode !== 200) {
            // error with request
            // TODO: need to better format this
            throw new Error(`ecpected 200 recieved ${resp.statusCode} - ${resp.method} ${resp.path}: ${resp.data.message}`)
        } else if (Object.keys(resp.data).indexOf("errors") !== -1) {
            // error on github interpreting our request
            let errMessages = [];

            for (err of resp.data.errors) {
                errMessages.push(err.message)
            }

            throw new Error(errMessages.join(" - "));
        } else {
            return resp.data;
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Executes an API GET request given the url. Often the API responds with a
 * URL to get more information about an object. This function executes that
 * URL and returns the information.
 * 
 * @param {String} fullURL the URL to get
 */
async function genericGet(fullURL) {
    try {
        options = {
            path: url.parse(fullURL).path
        }

        let resp = await get(options);

        // making sure request responded with 200
        return await handleRest(200, resp);
    } catch (err) {
        throw err;
    }
}

/**
 * Executes an API GET request given the url. Often the API responds with a
 * URL to get more information about an object. This function executes that
 * URL and returns the information.
 * 
 * @param {String} fullURL the URL to get
 */
async function genericProjectGet(fullURL) {
    try {
        options = {
            path: url.parse(fullURL).path,
            headers: {
                "Accept": "application/vnd.github.inertia-preview+json"
            }
        }

        let resp = await get(options);

        return await handleRest(200, resp);
    } catch (err) {
        throw err;
    }
}

module.exports = {
    get,
    post,
    del,
    patch,
    handleRest,
    handleQL,
    genericGet,
    genericProjectGet
}