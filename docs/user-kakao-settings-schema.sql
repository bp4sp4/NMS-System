-- 사용자별 카카오톡 설정 테이블
CREATE TABLE IF NOT EXISTS user_kakao_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  kakao_access_token TEXT NOT NULL,
  kakao_business_id VARCHAR(255),
  kakao_template_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 사용자별 카카오톡 발송 로그 테이블
CREATE TABLE IF NOT EXISTS user_kakao_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  message TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_kakao_settings_user_id ON user_kakao_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kakao_logs_user_id ON user_kakao_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kakao_logs_created_at ON user_kakao_logs(created_at);

-- RLS (Row Level Security) 설정
ALTER TABLE user_kakao_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kakao_logs ENABLE ROW LEVEL SECURITY;

-- 사용자별 카카오톡 설정 정책
CREATE POLICY "Users can view their own kakao settings" ON user_kakao_settings
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own kakao settings" ON user_kakao_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own kakao settings" ON user_kakao_settings
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own kakao settings" ON user_kakao_settings
  FOR DELETE USING (auth.uid()::text = user_id);

-- 사용자별 카카오톡 로그 정책
CREATE POLICY "Users can view their own kakao logs" ON user_kakao_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own kakao logs" ON user_kakao_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 관리자는 모든 데이터 조회 가능
CREATE POLICY "Admins can view all kakao settings" ON user_kakao_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND (users.email LIKE '%admin%' OR users.email = 'admin@korhrd.com')
    )
  );

CREATE POLICY "Admins can view all kakao logs" ON user_kakao_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND (users.email LIKE '%admin%' OR users.email = 'admin@korhrd.com')
    )
  );
