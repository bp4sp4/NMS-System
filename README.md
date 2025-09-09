# 한평생 eduvisor - 교육 관리 시스템

교육 기관을 위한 종합 관리 시스템입니다. 개인 순위, 지점 순위, CRM, 정산 등의 기능을 제공합니다.

## 주요 기능

- **관리자 승인 시스템**: 이메일 인증 대신 관리자 승인으로 회원가입
- **로그인 시스템**: Supabase 기반 인증
- **대시보드**: 전체 현황 및 통계
- **순위 관리**: 개인별/지점별 순위 관리
- **CRM**: 고객 관계 관리
- **정산**: 매출 및 정산 관리
- **출근관리**: 실시간 출근/퇴근 체크 및 근무시간 관리
- **관리자 대시보드**: 사용자 승인 및 관리

## 관리자 승인 시스템

### 시스템 특징

- **이메일 인증 없음**: 회원가입 후 관리자 승인만으로 로그인 가능
- **승인 상태 관리**: pending, approved, rejected, suspended 상태
- **승인 로그**: 모든 승인/거부 이력 관리
- **관리자 권한**: super_admin, admin 역할 구분

### 사용자 상태

- **pending**: 승인 대기 중 (기본값)
- **approved**: 승인됨 (로그인 가능)
- **rejected**: 거부됨 (로그인 불가)
- **suspended**: 정지됨 (로그인 불가)

### 초기 설정

1. `admin-approval-system.sql` 실행하여 데이터베이스 스키마 생성
2. `create-admin.sql`에서 사용자 ID를 실제 ID로 변경 후 실행
3. `database/attendance_schema.sql` 실행하여 출근관리 테이블 생성
4. 관리자 계정으로 로그인하여 `/admin` 페이지에서 사용자 승인

## 출근관리 시스템

### 주요 기능

- **실시간 출근/퇴근 체크**: 현재 시간과 연동된 출근/퇴근 버튼
- **자동 근무시간 계산**: 출근/퇴근 시간을 기반으로 자동 계산
- **출근 상태 관리**: 정상 출근, 지각, 조기 퇴근, 결근 상태 구분
- **월별 통계**: 출근률, 근무시간, 지각 횟수 등 통계 제공
- **출근 기록 조회**: 월별 출근 기록 및 상세 내역 조회

### 사용법

1. `/attendance` 페이지에서 출근/퇴근 체크
2. 실시간으로 현재 시간 표시
3. 출근 후 퇴근 버튼 활성화
4. 월별 통계 및 기록 자동 업데이트

### 데이터베이스 설정

출근관리 기능을 사용하려면 다음 SQL 스크립트를 Supabase에서 실행해야 합니다:

```sql
-- database/attendance_schema.sql 파일의 내용을 실행
```

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (관리자 승인 시스템)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React

## 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn
- Supabase 계정

### 설치

1. 저장소를 클론합니다:

```bash
git clone <repository-url>
cd NMSProject
```

2. 의존성을 설치합니다:

```bash
npm install
```

3. 환경 변수를 설정합니다:

**환경 변수 설명:**

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL (필수)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키 (필수)
- `NEXT_PUBLIC_SITE_URL`: 사이트 URL (선택사항, 설정하지 않으면 자동 감지)

4. 개발 서버를 시작합니다:

```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인합니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # 인증 관련 페이지
│   │   └── login/         # 로그인 페이지
│   ├── attendance/        # 출근관리 페이지
│   ├── api/attendance/    # 출근관리 API
│   ├── dashboard/         # 대시보드
│   ├── ranking/           # 순위 관리
│   ├── crm/              # CRM
│   ├── settlement/       # 정산
│   ├── layout.tsx        # 루트 레이아웃
│   └── page.tsx          # 메인 페이지
├── components/           # 재사용 가능한 컴포넌트
│   └── AuthContext.tsx   # 인증 컨텍스트
├── lib/                  # 유틸리티 함수
│   ├── auth.ts          # 인증 관련 함수
│   ├── attendance.ts    # 출근관리 관련 함수
│   └── supabase.ts      # Supabase 설정
├── types/               # TypeScript 타입 정의
│   ├── auth.ts          # 인증 관련 타입
│   └── attendance.ts    # 출근관리 관련 타입
└── database/            # 데이터베이스 스키마
    └── attendance_schema.sql
```

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 시작 (Turbopack 사용)
- `npm run build` - 프로덕션 빌드 생성
- `npm run start` - 프로덕션 서버 시작
- `npm run lint` - ESLint를 사용한 코드 검사

## 테스트 계정

개발 환경에서 사용할 수 있는 테스트 계정:

- **사용자명**: honggildong
- **비밀번호**: password
- **역할**: AIO

## 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.
