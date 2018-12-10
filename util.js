var util = {};

// Request의 인증 확인
util.isLogined = function(req, res, next){
    if (req.session.isAuthenticated) {
        return next();
    }
    res.status(404).send();
};

module.exports = util;