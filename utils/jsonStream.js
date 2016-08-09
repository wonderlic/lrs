var through = require('through');

module.exports = {
    stringify(transform) {
        return (op, sep, cl, indent) => {
            return jsonStringify(typeof transform === 'function' ? transform : () => {}, op, sep, cl, indent);
        };
    }
};

function jsonStringify(transform, op, sep, cl, indent) {
    indent = indent || 0;
    if (op === false) {
        op = '';
        sep = '\n';
        cl = '';
    } else if (op == null) {
        op = '[\n';
        sep = '\n,\n';
        cl = '\n]\n';
    }
    var stream,
    first = true,
    anyData = false,
    stream = through(data => {
        anyData = true;
        var json;
        try {
            transform(data);
            json = JSON.stringify(data, null, indent);
        } catch (err) {
            return stream.emit('error', err);
        }
        if(first) {
            first = false;
            stream.queue(op + json);
        }
        else stream.queue(sep + json);
    }, data => {
    if(!anyData)
        stream.queue(op);
        stream.queue(cl);
        stream.queue(null);
    });
    return stream;
};