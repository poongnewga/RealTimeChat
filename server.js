var express = require('express');
var colors = require('colors');
var { mongoose } = require('./db/mongoose');
var { Chat } = require('./models/Chat');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(8080);
console.log('Server is running at 80');

//Chat.remove({}).then((e)=>{console.log(e)});

app.use((req,res)=>{
  res.send('<h1>Heeham</h1>');
});

var rooms = [];


io.on('connection', function (socket) {
  console.log('Socket Connected'.green, socket.id);


  socket.on('enterRoom', (user, chatDays)=>{
    for (let day in chatDays) {
      if (chatDays[day] != null) {

        if (rooms.find((room)=>{ return room.roomName == chatDays[day] }) == undefined) {
          rooms.push({roomName: chatDays[day], day: day, msgCount: 0});
        }
        
        socket.join(chatDays[day]);
        console.log(`${user}가 ${chatDays[day]}에 입장했습니다. 요일 : ${day}`);

        Chat.find({to: chatDays[day]}).then((messages) => {
          // 해당 요일 및 요일의 메세지들을 전달해주어 초기화
          socket.emit('initial', day, messages);
        }, (e) => {
          socket.emit('initial', day, []);
        });
      }
    }
  });

  socket.on('newMsg', (msg, count) => {
    // 기존 메세지 카운트와 유저가 보낸 카운트를 비교
    var _room = rooms.find((room)=>{ return room.roomName == msg.to });
    var mcnt = _room.msgCount;
    var _day = _room.day;

    console.log('메세지 카운트 : ', mcnt);
    console.log('유저가 제공한 카운트 : ', count);
    if (mcnt != count) {
      if (mcnt > count) {
        // 카운트가 서로 다르면, 즉 유저가 가진 데이터량보다 실제로 더 많이 저장되 어 있으면 그 만큼만 다시 초기화
        Chat.find({to: msg.to}).limit(mcnt - count).sort({_id: -1})
        .then((messages)=>{
          // 차이나는 만큼 바로 전송해준다.
          socket.emit('initial', _day, messages.reverse());

          var newChat = new Chat({
            from: msg.from,
            to: msg.to,
            body: msg.body,
            createdAt: msg.createdAt
          });
          newChat.save().then((doc)=>{
            console.log(doc);
            _room.msgCount += 1;
            io.to(doc.to).emit('initial', _day, [doc]);
          }, (e) => {
            socket.emit('dbErr', doc);
          });

        });
        console.log(`Pollyfill 실행 : ${mcnt - count}개`.magenta);
      } else {
        console.log('유저가 가진 메세지가 서버가 가진 메세지보다 많습니다.'.red);
	// 추가한 부분
	_room.msgCount = count
      }
    } else {
      console.log('바로 전달'.cyan);
      // 최신 상태.
      // 받은 메세지를 저장하고 바로 뿌려준다.
      var newChat = new Chat({
        from: msg.from,
        to: msg.to,
        body: msg.body,
        createdAt: msg.createdAt
      });

      newChat.save().then((doc)=>{
        console.log(doc);
        _room.msgCount += 1;
        io.to(doc.to).emit('initial', _day, [doc]);
      }, (e) => {
        socket.emit('dbErr', doc);
      });
    }
  });

//WEB
  socket.on('joinRoom', (user, room, day) => {

    if (rooms.find((room)=>{ return room.roomName == room }) == undefined) {
      rooms.push({roomName: room, day: day, msgCount: 0});
    }

    socket.join(room);
    console.log(`${user}가 ${room}에 입장했습니다. 요일 : ${day}`);

    Chat.find({to: room}).then((messages) => {
      socket.emit('initial', day, messages);
    }, (e) => {
      socket.emit('initial', day, []);
    });
  });

  socket.on('disconnect',()=>{
    console.log('Socket Disconnected'.red, socket.id);
  });

});
