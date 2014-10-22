var
    koa = require('koa'),
    logger = require('koa-logger'),
    router = require('koa-router')
;


var app = koa();

app.use(logger());
app.use(router(app));


app.get('/about', function *(next) {
    this.body = { version: '1.0.2'};
});

app.listen(3000);
