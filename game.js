const uuidv4 = require('uuid/v4');

// socket.io 초기화
module.exports = function(server) { // 외부에서 요청해 사용할 수 있게 코딩

    // 방 정보
    var rooms = [];

    var io = require('socket.io')(server, {
        transports: ['websocket'], // 웹소켓만으로 작동하게 정의
    });
    io.on('connection', function(socket) { // socket 은 클라이언트 객체를 의미하게 된다.
            // io로 호출되는 이벤트는 전체 소켓을 대상으로 한다.

        console.log('Connection:' + socket.id); // 연결 --> id는 임의의 식별자
            // 클라이언트 메시지를 캐치 ( 클라이언트가 접속했을 때 동작을 정의)
        if (rooms.length > 0) { // 방이 있을 경우
            var rId = rooms.shift(); // shift() --> 첫번째 인덱스를 제거하면서 반환
            socket.join(rId, function(){ // 또다른 익명함수 선언 --> () => {} 최근 언어에서도 선언되는 형식
                console.log("JOIN ROOM:" + rId); // join 후 기능정의(지금은 확인만)
                socket.emit('joinRoom', { room: rId}); // 조인한 방이름
                io.to(rId).emit('startGame');
            });

        } else {
            var roomName = uuidv4();
            socket.join(roomName, function(){ // join() -->roomName으로 방이 없으면 방이 생성
                console.log("CREATE ROOM:" + roomName);
                socket.emit('createRoom', { room: roomName }); // 생성한 방이름
                rooms.push(roomName); // push --> 마직막 배열값 추가
            });
        }

        socket.on('disconnecting', function(reason) { // 연결해지
            // socket.on --> 접속된 소켓단위의 이벤트를 대상으로 한다.
            console.log('Disconnected:' + socket.id);
            
            var socketRooms = Object.keys(socket.rooms).filter(function(item) { 
                if(item != socket.id) { // item이 자신의 자동생성 방이 아니면
                    return true; //  item을 반환
                } else {
                    return false;
                } 
            });
            console.dir(socketRooms);

            socketRooms.forEach(function(room) {
                socket.broadcast.to(room).emit('exitRoom');

                // 혼자 만든 방의 유저가 disconnect 되면 해당 방 제거
                var idx = rooms.indexOf(room); 
                // indexOf --> rooms 배열 중에 room이 있다면 room의 인덱스를 반환
                // --> 없다면 -1을 반환
                if(idx != -1) // 방이 있으면
                {
                    rooms.splice(idx, 1); // rooms 중에 1번인덱스까지 삭제함
                }
            });

            //socket.rooms --> rooms 해당 소켓이 참여하고 있는 모든 방의 정보를 얻어올 수 있다.
        });

        socket.on('doPlayer', function(playerInfo) {
            // 클라이언트의 정보를 그대로 다른 클라이언트 에 전달
            var roomId = playerInfo.room;
            var cellIndex = playerInfo.position;

            socket.broadcast.to(roomId).emit('doOpponent', { position: cellIndex });
        });

        //클라이언트에게 메시지를 받았을 때 디버그 창에 출력
        // socket.on('hi', function() { 
        //     console.log('Hi~~~');
        //     socket.emit('hello');// emit --> 메시지를 보낸 소켓에게 응답을 보내는 함수
        //     io.emit('hello');// 접속한 모든 클라이언트에게 메시지를 보냄
        //     socket.broadcast.emit('hello'); // 메시지를 보낸 소켓을 제외한 모든 소켓들에게 알림
        // });

        //챗팅을 위한 함수 --> 클라이언트로부터 메시지를 받는 함수
        socket.on('message', function(msg) {

            console.dir(msg); // dir --> 전달받은 메시지의 데이타구조를 볼 수 있음
            socket.broadcast.emit('chat', msg);
            //socket.broadcast.emit('chat',);
        });
    });
};