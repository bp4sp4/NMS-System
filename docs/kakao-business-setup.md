# 카카오톡 비즈니스 API 연동 가이드

## 1. 카카오톡 비즈니스 계정 신청

### 1.1 사전 준비사항

- 사업자등록증
- 사업계획서 (메시지 발송 목적, 예상 발송량 등)
- 웹사이트 또는 앱 (비즈니스 검증용)
- 개인정보처리방침

### 1.2 신청 절차

1. https://business.kakao.com/ 접속
2. "비즈니스 계정 신청" 클릭
3. 사업자 정보 입력
4. 사업계획서 업로드
5. 승인 대기 (1-2주 소요)

### 1.3 승인 후 설정

- API 키 발급
- 템플릿 메시지 등록 및 승인
- 발송 한도 설정

## 2. 환경 변수 설정

### 2.1 .env.local 파일 생성

```env
# 카카오톡 비즈니스 API 설정
KAKAO_ACCESS_TOKEN=your_kakao_access_token_here
KAKAO_BUSINESS_ID=your_kakao_business_id_here
KAKAO_TEMPLATE_ID=your_template_id_here

# 테스트용 전화번호
NEXT_PUBLIC_TEST_PHONE_NUMBER=010-0000-0000
```

### 2.2 API 키 발급 방법

1. 카카오톡 비즈니스 콘솔 로그인
2. "API 관리" → "API 키 발급"
3. 발급된 키를 환경 변수에 설정

## 3. 템플릿 메시지 등록

### 3.1 템플릿 등록

1. 카카오톡 비즈니스 콘솔 → "메시지 관리" → "템플릿 등록"
2. 메시지 내용 작성
3. 승인 대기 (1-3일 소요)

### 3.2 템플릿 예시

```
제목: [NMS] 교육 과정 안내
내용: 안녕하세요, {고객명}님!
{교육과정명} 과정에 대한 안내드립니다.
자세한 내용은 아래 링크를 확인해주세요.

링크: {교육과정링크}
```

## 4. API 연동 코드

### 4.1 실제 API 사용으로 변경

```typescript
// src/lib/kakao.ts
export const sendKakaoMessage = async (
  messageData: KakaoMessage
): Promise<KakaoSendResult> => {
  try {
    // 시뮬레이션 대신 실제 API 사용
    const response = await axios.post("/api/kakao/business/send", messageData);

    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("카카오톡 발송 실패:", error);

    return {
      success: false,
      message: "메시지 발송에 실패했습니다.",
      error: error.response?.data?.error || error.message,
    };
  }
};
```

### 4.2 실제 API 엔드포인트

```typescript
// src/app/api/kakao/business/send/route.ts
const KAKAO_BUSINESS_API_URL =
  "https://api.kakao.com/v1/api/talk/friends/message/default/send";

// 실제 발송 로직
const kakaoRequestData = {
  receiver_uuids: [phoneNumber], // 실제 UUID 사용
  template_object: {
    object_type: "text",
    text: message,
    link: {
      web_url: "https://your-business-domain.com",
      mobile_web_url: "https://your-business-domain.com",
    },
  },
};
```

## 5. 대안 솔루션

### 5.1 SMS API 사용

- 네이버 클라우드 플랫폼 SMS
- AWS SNS
- 토스페이먼츠 SMS

### 5.2 이메일 발송

- SendGrid
- AWS SES
- 네이버 클라우드 플랫폼 메일

### 5.3 푸시 알림

- Firebase Cloud Messaging
- OneSignal

## 6. 비용 비교

### 6.1 카카오톡 비즈니스

- 월 이용료: 10만원 ~ 50만원
- 발송 건당: 10원 ~ 30원

### 6.2 SMS

- 발송 건당: 20원 ~ 30원

### 6.3 이메일

- 발송 건당: 1원 ~ 5원

## 7. 권장사항

### 7.1 개발 단계

- 시뮬레이션 모드로 UI/UX 완성
- 실제 API 연동은 비즈니스 계정 승인 후 진행

### 7.2 운영 단계

- 발송 전 테스트 필수
- 발송 실패 시 재시도 로직 구현
- 발송 로그 저장 및 모니터링

### 7.3 법적 고려사항

- 개인정보보호법 준수
- 수신 동의 확인
- 발송 거부 처리
