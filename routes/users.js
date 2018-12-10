var express = require('express');
var util = require('../util'); // 사용자 정의 객체를 사용할 때는 경로 표시도 함께 한다.
const { ObjectId } = require('mongodb'); // 문자열을 다시 오브젝트아이디 타입으로 변경
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

var ResponseType = { // 열거형
  INVALID_USERNAME: 0,
  INVALID_PASSWORD: 1,
  SUCCESS: 2,

};

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// User Info - 유저 정보 가져오기
router.get('/info', util.isLogined, function (req, res, next) {
  // 인증된 상태에서만 다음 함수를 실행하므로  if문이 필요없다.

  //router.get('/info', function(req, res, next) {

  // var cookies = req.cookies;
  // if (cookies.username !== undefined) {
  //   res.send('Welcome' + cookies.username);
  // } else {
  //   res.send('Who are you?');
  // }

  //if (req.session.isAuthenticated) { 
  res.json({
    username: req.session.username,
    nickname: req.session.nickname
  });
  // }else {
  //   res.json({
  //     username:'',
  //     nickname:''
  // });
  //}

});

//로그인 
// 서버주소/users/signin
router.post('/signin', function (req, res, next) {
  var username = req.body.username;
  // req.body 클라이언트가 문자열을 넣어 요청
  // .username 클라이언트가 보낸 변수의 이름 (값을 읽어들여 객체에 접근 )
  var password = req.body.password;

  var database = req.app.get('database');
  var users = database.collection('users');

  if (username !== undefined && password !== undefined) {
    /*users.find({ username : username }).toArray(function(err, result) {
      console.log(result); // toArray 내부 함수는 비동기 함수이므로 블랙포인트를 걸고 F5를 눌러 함수내로 진입 */
    users.findOne({ username: username }, // findOne --> 몽고db 함수
      function (err, result) {
        if (result) { // 결과값이 있을 때(id,password가 db에 있을 때)
          //if (password === result.password) {
          var compareResult = bcrypt.compareSync(password, result.password);
          if (compareResult) {

            req.session.isAuthenticated = true; // 로그인 한 적이 있으면 true
            req.session.userid = result._id.toString(); // userid --> _id, objectid
            req.session.username = result.username;
            req.session.nickname = result.nickname;
            // res.writeHead( 200, {
            //   'Set-Cookie':['username=' + result.username + ';Path=/'] // ';Path=/' --> 쿠키 적용 위치를 최상위로 설정
            // });

            // var ret = JSON.stringify({result:ResponseType.SUCCESS}); // JSON.stringify -->객체를 제이슨문자열로 변경
            // res.write(ret); // 문자를 보냄 
            // res.end(); // 보내기 완료
            //res.send('sucess');
            //res.json({ nickname : req.session.nickname });
            res.json({ result: ResponseType.SUCCESS });
            // 2개이상 값을 전달할 때 제이슨구조 텍스트(키:밸류)를 보냄
          } else {
            //res.send('failure');
            res.json({ result: ResponseType.INVALID_PASSWORD });
          }
        } else { // 결과값이 없을 때
          //res.send('failure');
          res.json({ result: ResponseType.INVALID_USERNAME });

        }

      });
  }
});

// 사용자 등록 (회원가입)
router.post('/add', function (req, res, next) {

  var username = req.body.username;
  var password = req.body.password;
  var nickname = req.body.nickname;
  //var score = req.body.score; 게임 종료후 요청

  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(password, salt);

  var database = req.app.get("database");
  var users = database.collection('users'); // users가 저장대상

  if (username !== undefined && password !== undefined && nickname !== undefined) { // && score !== undefined) {

    // 사용자 등록기능 insert 사용
    users.insert([{
      "username": username,
      "password": hash,
      "nickname": nickname
    }], function (err, result) {
      // "score" : score }], function(err, result) {
      res.status(200).send("sucess");
    });
  }
});

// Score 추가
router.get('/addscore/:score', function (req, res, next) {

  var score = req.params.score;
  //var username = req.session.username;
  var userid = req.session.userid;

  var database = req.app.get("database");
  var users = database.collection('users');

  //users.update({ username: username }, { score: score});

  if (userid != undefined) {
    result = users.updateOne({ _id: ObjectId(userid) }, //username은 중복될 수 있다.
      {
        $set: { // $set --> 유저네임중 스코어만 업데이트
          score: Number(score), // 숫자로 저장
          updatedAt: Date.now() // DB에 변경날짜에 대한 필드 추가
        }
      }, { upsert: true }, function (err) {
        if (err) {
          res.status(200).send("failure");
        }
        res.status(200).send("sucess");
      }); // upsert --> 필드추가 시 붙임
  }

});

// Score 불러오기
router.get('/score', util.isLogined, function (req, res, next) {

  var userid = req.session.userid;

  var database = req.app.get("database");
  var users = database.collection('users');

  users.findOne({ _id: ObjectId(userid) }, function (err, result) {
    if (err) throw err;

    // 여러가지 결과값이 나올 수 있도록 처리
    var resultObj = {
      id: result._id.toString(), // 오브젝트 아이디는 문자열로 변경해야 인식할 수 있다.
      score: result.score
    };

    res.json(resultObj);

  });


});

module.exports = router;
