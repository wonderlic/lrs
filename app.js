var
    koa = require('koa'),
    logger = require('koa-logger'),
    route = require('koa-route'),
    parse = require('co-body'),

    statements = require('./api/statements')
;


var app = koa();

app.use(logger());


app.use(route.get('/about', function *(){
    this.body = { version: '1.0.2'};
}));

app.use(route.get('/statements', function *(){
    this.body = statements.get();
}));


app.use(route.put('/statements', function *(next){
    if ('PUT' != this.method) return yield next;

    statements.add(yield parse(this))

    this.status = 204;    
}));


app.listen(3000);
