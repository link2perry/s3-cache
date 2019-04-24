const AWS = require('aws-sdk');

class S3Promise {
  constructor() {
    this.s3 = new AWS.S3();
  }

  getObject(params) {
    return new Promise((f,r) => {
      this.s3.getObject(params, (err,data) => {
        if(err) r(err);
        f(data);
      });
    });
  }

  deleteObject(params) {
    return new Promise((f,r) => {
      this.s3.deleteObject(params, (err,data) => {
        if(err) r(err);
        f(data);
      });
    });
  }

  headObject(params) {
    return new Promise((f,r) => {
      this.s3.headObject(params, (err,data) => {
        if(err) r(err);
        f(data);
      });
    });
  }

  copyObject(params) {
    return new Promise((f,r) => {
      this.s3.copyObject(params, (err,data) => {
        if(err) r(err);
        f(data);
      });
    });
  }

  upload(params) {
    return new Promise((f,r) => {
      this.s3.upload(params, (err,data) => {
        if(err) r(err);
        f(data);
      });
    });
  }
}

module.exports = new S3Promise();
