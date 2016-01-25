'use strict';

module.exports = function* (next){
    this.set('Access-Control-Allow-Origin', '*');
    this.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    this.set('Access-Control-Allow-Headers', 'X-Experience-API-Version,Accept,Authorization,Content-Type,If-Match,If-None-Match');
    
    if (this.method === 'OPTIONS') {
      this.status = 200;
    } else {
      yield next;
    }
}