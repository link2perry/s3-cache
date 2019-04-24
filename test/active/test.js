let {expect} = require('chai');
let S3Cache = require('../../index.js');

this.timeout = 10000;
describe('Testing S3Cache', function() {
  describe('PUT', function() {
    describe('Given a null value', function() {
      it('throws an exception', function(done) {
        let value = null;
        let s3Cache = new S3Cache('step-function-cache');
        s3Cache.put(value)
        .then(resp => {
          done(new Error('An exception was supposed to have been thrown.'));
        })
        .catch((err) => {
          expect(err.message).to.eq('Invocation Error: a value is required.');
          done();
        });
      });
    });    
    describe('Given a value', function() {
      it('Should put the item successfully', function(done) {
        let value = "This is some test data to be written to S3.";
        let s3Cache = new S3Cache('step-function-cache');
        let state = {};
        s3Cache.put(value)
        .then(key => {
          state.key = key
          return s3Cache.get(key);
        })
        .then(data => {
          expect(data).to.equal(value);
          s3Cache.delete(state.key);
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });    

    describe('Given an invalid encryption key', function() {
      it('An exception should be thrown', function(done) {
        let value = "This is some test data to be written to S3.";
        let s3Cache = new S3Cache('step-function-cache');
        let encryptionKey = 'c4deb956-bbb8-4d05-a9b3-884ff6d044078';
        s3Cache.put(value, {encryptionKey: encryptionKey})
        .then(resp => {
          done(new Error('An exception was supposed to have been thrown.'));
        })
        .catch(err => {
          expect(err.message).to.eq('Invocation Error: the encryptionKey\'s length is invalid.');
          done();
        });
      });
    });     

    describe('Given a value and an encryption key', function() {
      it('Should put the encrypted item successfully', function(done) {
        let value = "This is some test data to be written to S3.";
        let s3Cache = new S3Cache('step-function-cache');
        let state = {};
        let encryptionKey = 'c4deb956-bbb8-4d05-a9b3-884ff6d04407';
        s3Cache.put(value, {encryptionKey: encryptionKey})
        .then(key => {
          state.key = key
          return s3Cache.get(key, {encryptionKey: encryptionKey});
        })
        .then(data => {
          expect(data).to.equal(value);
          s3Cache.delete(state.key);
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });    
  });
  describe('GET', function() {
    describe('Given a null key', function() {
      it('throws an exception', function(done) {
        let key = null;
        let s3Cache = new S3Cache('step-function-cache');
        s3Cache.get(key)
        .then(resp => {
          done(new Error('An exception was supposed to have been thrown.'));
        })
        .catch(err => {
          expect(err.message).to.eq('Invocation Error: a key is required.');
          done();
        });
      });
    });

    describe.only('Given a key and an encryptionKey', function() {
      it('retrieves an encrypted file from s3', function(done) {
        let key = 's3://step-function-cache/test/SyncPicassoFormulaToSfdc/ea0535a2-8d1f-4df1-b84a-bd43aecdcd5a';
        let s3Cache = new S3Cache('step-function-cache/test/SyncPicassoFormulaToSfdc');
        let encryptionKey = 'c4deb956-bbb8-4d05-a9b3-884ff6d04407'
        s3Cache.get(key, {encryptionKey: encryptionKey, type: 'json'})
        .then(contents => {
          console.log('contents', JSON.stringify(contents));
          done();
        })
        .catch(err => {
          done(err);
        });
      });
    });
    

  });
});