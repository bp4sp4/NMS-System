/**
 * 사이트 URL을 동적으로 감지하는 함수
 * 우선순위: 환경 변수 > 현재 도메인 > 기본값
 */
export const getSiteUrl = (): string => {
  // 1. 환경 변수 우선
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // 2. 클라이언트에서 현재 도메인 감지
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // 3. 기본값
  return "https://nms-system.vercel.app";
};

/**
 * 이메일 인증 리다이렉트 URL을 생성하는 함수
 */
export const getEmailRedirectUrl = (path: string = "/auth/login"): string => {
  const siteUrl = getSiteUrl();
  return `${siteUrl}${path}`;
};

/**
 * 현재 환경이 개발 환경인지 확인하는 함수
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

/**
 * 현재 환경이 프로덕션 환경인지 확인하는 함수
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

/**
 * 부서별 색상을 반환하는 함수
 */
export const getDepartmentColor = (roomName: string): string => {
  const colorMap: { [key: string]: string } = {
    "AIO 사업단": "bg-blue-600",
    경영지원본부: "bg-green-600",
    브랜드마케팅본부: "bg-purple-600",
    "위드업 사업단": "bg-orange-600",
    한평생실습지원: "bg-red-600",
  };
  return colorMap[roomName] || "bg-gray-600";
};

/**
 * 기관명을 약식으로 변환하는 함수
 */
export const getInstitutionAbbreviation = (institution: string): string => {
  const abbreviationMap: { [key: string]: string } = {
    한평생학점은행: "한평생",
    올티칭학점은행: "올티칭",
    서울사이버평생교육원: "서사평",
    드림원격평생교육원: "드림(일반)",
    "드림원격평생교육원 한국어교원 과정": "드림(한국어)",
    "드림원격평생교육원 미용학 과정": "드림(미용학)",
    해밀원격평생교육원: "해밀",
  };
  return abbreviationMap[institution] || institution;
};

/**
 * 연락처를 010-XXXX-XXXX 형식으로 포맷팅하는 함수
 */
export const formatPhoneNumber = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/\D/g, "");

  // 길이에 따라 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11
    )}`;
  }
};

/**
 * 연락처 포맷팅을 제거하는 함수 (숫자만 반환)
 */
export const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, "");
};
