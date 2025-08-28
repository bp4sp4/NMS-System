# SMS API 연동 가이드 (사용자별 발송)

## 1. 네이버 클라우드 플랫폼 SMS 설정

### 1.1 네이버 클라우드 플랫폼 가입

1. https://www.ncloud.com/ 접속
2. 회원가입 및 로그인
3. 결제 수단 등록

### 1.2 SMS 서비스 신청

1. "AI·NAVER API" → "SENS" 선택
2. "SMS" 서비스 신청
3. 발신번호 등록 및 승인 대기

### 1.3 API 키 발급

1. "마이페이지" → "인증키 관리"
2. "Access Key ID" 생성
3. "Secret Access Key" 생성

## 2. 환경 변수 설정

### 2.1 .env.local 파일 생성

```env
# 네이버 클라우드 플랫폼 SMS API 설정
NAVER_ACCESS_KEY=your_access_key_here
NAVER_SECRET_KEY=your_secret_key_here
NAVER_SERVICE_ID=your_service_id_here
NAVER_SENDER_PHONE=01012345678

# 기존 카카오톡 설정 (선택사항)
KAKAO_ACCESS_TOKEN=your_kakao_access_token_here
KAKAO_BUSINESS_ID=your_kakao_business_id_here
NEXT_PUBLIC_TEST_PHONE_NUMBER=010-0000-0000
```

### 2.2 설정값 확인 방법

1. **NAVER_ACCESS_KEY**: 마이페이지 → 인증키 관리 → Access Key ID
2. **NAVER_SECRET_KEY**: 마이페이지 → 인증키 관리 → Secret Access Key
3. **NAVER_SERVICE_ID**: SENS → SMS → 서비스 ID
4. **NAVER_SENDER_PHONE**: 승인받은 발신번호

## 3. 사용자별 발송 시스템

### 3.1 시스템 구조

```
사용자 A → SMS 발송 → 발송자 정보 포함 → 로그 저장
사용자 B → SMS 발송 → 발송자 정보 포함 → 로그 저장
사용자 C → SMS 발송 → 발송자 정보 포함 → 로그 저장
```

### 3.2 발송 로그 구조

```sql
CREATE TABLE sms_logs (
  id SERIAL PRIMARY KEY,
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  message TEXT,
  success BOOLEAN DEFAULT true,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### 3.3 사용자별 통계 조회

- 각 사용자별 발송 건수
- 성공/실패율
- 발송 내역 조회
- 월별/일별 통계

## 4. 비용 정보

### 4.1 네이버 클라우드 플랫폼 SMS

- **발송 건당**: 20원 ~ 30원
- **월 이용료**: 없음
- **최소 충전**: 10,000원

### 4.2 예상 비용 계산

```
월 발송량: 1,000건
건당 비용: 25원
월 총 비용: 25,000원
```

## 5. 장점

### 5.1 카카오톡 대비 장점

- **즉시 사용 가능**: 승인 절차 없음
- **개인별 구분**: 사용자별 발송 로그
- **비용 효율적**: 월 이용료 없음
- **안정성**: 높은 발송 성공률

### 5.2 사용자별 관리

- **발송자 추적**: 누가 언제 발송했는지 확인
- **통계 제공**: 개인별 발송 현황
- **권한 관리**: 관리자가 전체 현황 파악

## 6. 구현된 기능

### 6.1 발송 기능

- ✅ 사용자별 SMS 발송
- ✅ 발송 속도 조절
- ✅ 메시지 템플릿
- ✅ 발송 결과 표시

### 6.2 로그 기능

- ✅ 발송 로그 저장
- ✅ 사용자별 구분
- ✅ 성공/실패 기록

### 6.3 통계 기능

- ✅ 사용자별 통계
- ✅ 발송 내역 조회
- ✅ 페이지네이션

## 7. 사용 방법

### 7.1 발송하기

1. `/kakao-send` 페이지에서 고객 선택
2. `/kakao-send/message` 페이지에서 메시지 작성
3. "발송" 버튼 클릭
4. 발송 결과 확인

### 7.2 통계 확인

1. 관리자 페이지에서 전체 통계 확인
2. 개인별 발송 내역 조회
3. 월별/일별 통계 확인

## 8. 주의사항

### 8.1 법적 고려사항

- **수신 동의**: 고객의 수신 동의 필요
- **개인정보**: 전화번호 보호
- **발송 시간**: 야간 발송 제한

### 8.2 기술적 고려사항

- **API 제한**: 초당 요청 수 제한
- **발송 속도**: 적절한 딜레이 설정
- **에러 처리**: 발송 실패 시 재시도 로직

## 9. 향후 개선 사항

### 9.1 추가 기능

- [ ] 발송 예약 기능
- [ ] 템플릿 관리 시스템
- [ ] 고객 그룹 관리
- [ ] 자동 발송 기능

### 9.2 모니터링

- [ ] 실시간 발송 현황
- [ ] 알림 기능
- [ ] 대시보드 개선
