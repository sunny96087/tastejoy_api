// middlewares/myMiddleware.js
// 這頁是寫好玩的，可以改掉或不用理它 xd
module.exports = function(req, res, next) {
 console.log('叩叩叩 有人進來了...');
 next();
};