const crypto = require('crypto');
const config = require('../config/config.json');

/*
Express middleware function that verifies if the secret sent with the 
request matches the secret configured with the webhook.
*/
function verifyPostData(req, res, next) {
    // https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428
    const payload = JSON.stringify(req.body);
    if (!payload) {
        return next('Request body empty');
    }

    const sig = req.get('X-Hub-Signature') || '';
    const hmac = crypto.createHmac('sha1', config.webhookSecret);
    const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8');
    const checksum = Buffer.from(sig, 'utf8');
    if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
        return next(`Request body digest (${digest}) did not match X-Hub-Signature (${checksum})`);
    }
    return next();
}

module.exports = {
    verifyPostData
}