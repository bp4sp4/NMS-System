# 한평생 eduvisor - 교육 관리 시스템

교육 기관을 위한 종합 관리 시스템입니다. 개인 순위, 지점 순위, CRM, 정산 등의 기능을 제공합니다.

## 주요 기능

- **로그인 시스템**: Supabase 기반 인증
- **대시보드**: 전체 현황 및 통계
- **순위 관리**: 개인별/지점별 순위 관리
- **CRM**: 고객 관계 관리
- **정산**: 매출 및 정산 관리

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
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

```bash
# .env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 사이트 URL 설정 (선택사항)
# 이 값을 설정하면 동적 감지 대신 이 값을 사용합니다
# NEXT_PUBLIC_SITE_URL=https://your-domain.com

# 예시:
# NEXT_PUBLIC_SITE_URL=https://nms-system.vercel.app
# NEXT_PUBLIC_SITE_URL=https://localhost:3000
```

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
│   └── supabase.ts      # Supabase 설정
└── types/               # TypeScript 타입 정의
    └── auth.ts          # 인증 관련 타입
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
