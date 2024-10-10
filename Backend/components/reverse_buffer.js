exports.Reverse = function(buf) {
    reverse_buf = Buffer.alloc(buf.length);
        for (let i = 0; i < buf.length; i++) {
            reverse_buf[i] = buf[buf.length - 1 - i];
        }
    return reverse_buf;
}