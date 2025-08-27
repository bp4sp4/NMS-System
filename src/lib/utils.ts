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
