// 몽구스 패키지를 사용하므로 임포트
var mongoose = require('mongoose');

var Chat = mongoose.model('Chat', {
  // 필드 정의
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  body: {
    // 필드 상세 정의 및 검증
    type: String,
    // 필수임을 명시
    required: true,
    // 디폴트값 설정가능
    // default: "heeham"
  },
  createdAt: {
    type: String,
    required: true
  }
});

module.exports = { Chat };

