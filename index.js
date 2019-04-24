const s3 = require('./S3Promise');
const URL = require('url-parse');
const uuidv4 = require('uuid/v4');
const EncryptionHelper = require('@sei-atl/encryption-helper');

class S3Cache {
  constructor(s3Bucket) {
    this.s3Bucket = s3Bucket;
  }

  resolveKey(key) {
    if(key.startsWith('s3://')) {
      key = new URL(key).pathname.substring(1).split('/').pop();
    }
    return key;
  }

  validateS3Key(s3Key) {
    let result = {valid: true};
    if(s3Key) {
      if(!s3Key.startsWith('s3://')) {
        result = {
          valid: false,
          message: `s3Key must use the "s3://" protocol`
        }
      }
    }
    return result;
  }

  validateRequiredString(v, name) {
    let result = {valid: true};
    if(typeof v !== 'string' || v === null) {
      result = {
        valid: false,
        message: `a ${name} is required`
      }
    } 
    return result;
  }

  validateEncryptionKey(encryptionKey) {
    let result = {valid: true};
    if(encryptionKey && encryptionKey.length !== 32) {
      result = {
        valid: false,
        message: 'the encryptionKey\'s length is invalid'
      }
    }
    return result;    
  }

  get(key, options) {
    return new Promise((resolve, reject) => {
      options = Object.assign({
        encryptionKey: null,
        type: 'string'
      }, options);
      if(typeof key === 'undefined' || key === null) {
        return resolve();
      }
      options.encryptionKey = options.encryptionKey ? options.encryptionKey.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
      let { encryptionKey } = options;
      let paramValidation = [
        this.validateRequiredString(key, 'key'),
        this.validateEncryptionKey(encryptionKey)
      ].reduce((a, result) => {
        a.valid = a.valid && result.valid;
        if(result.message) {
          a.messages.push(result.message);
        }
        return a;
      }, {valid: true, messages:[]});
      if(paramValidation.valid) {
          let resolveResource = (resource) => {
            if(options.type && options.type.toLowerCase() === 'json') {
              try {
                resolve(JSON.parse(resource));
              } catch (e) { 
                resolve(resource);
              }
            } else {
              resolve(resource);
            }
          };
          s3.getObject({
            Bucket: this.s3Bucket,
            Key: this.resolveKey(key)
          })
          .then(file => {
            let fileContents = file.Body.toString('utf8');
            if(encryptionKey) {
              EncryptionHelper.decryptAes256Cbc(JSON.parse(fileContents), encryptionKey)
              .then(decrypted => {
                resolveResource(decrypted);
              })
              .catch(err => {
                reject(new Error('Failed to decrypt the resource: ' + resource + '. ' + err));
              });
            } else {
              resolveResource(fileContents);
            }
          })
          .catch(err => {
            reject(err);
          });
      } else {
        let err = paramValidation.messages.join(' and ');
        reject(new Error(`Invocation Error: ${err}.`));
      }
    });
  }

  put(value, options) {
    return new Promise((resolve, reject) => {
      if(value !== null && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      options = Object.assign({
        encryptionKey: null
      }, options);
      options.encryptionKey = options.encryptionKey ? options.encryptionKey.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
      let { encryptionKey } = options;

      let paramValidation = [
        this.validateRequiredString(value, 'value'),
        this.validateEncryptionKey(encryptionKey)
      ].reduce((a, result) => {
        a.valid = a.valid && result.valid;
        if(result.message) {
          a.messages.push(result.message);
        }
        return a;
      }, {valid: true, messages:[]});
      if(paramValidation.valid) {
        let key = options.key || uuidv4();
        let url = `s3://${this.s3Bucket}/${key}`;
        let setInCache = (value) => {
          s3.upload({
            Body: value,
            Bucket: this.s3Bucket,
            Key: key,
          })
          .then(() => {
            resolve(url);
          })
          .catch(err => {
            reject(err);
          });
        };

        if(encryptionKey) {
          EncryptionHelper.encryptAes256Cbc(value, encryptionKey)
          .then(encrypted => {
            setInCache(JSON.stringify(encrypted));
          })
          .catch((err) => {
            reject(err);
          });
        } else {
          setInCache(value);
        }
      } else {
        let err = paramValidation.messages.join(' and ');
        reject(new Error(`Invocation Error: ${err}.`));
      }
    });
  }

  delete(key) {
    return new Promise((resolve, reject) => {
      let result = this.validateRequiredString(key, 'key');    
      if(result.valid) {
        s3.deleteObject({
          Bucket: this.s3Bucket,
          Key: this.resolveKey(key)
        })
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
      } else {
        reject(new Error(`Invocation Error: ${result.message}.`));
      }
    });
  }

}

module.exports = S3Cache;
