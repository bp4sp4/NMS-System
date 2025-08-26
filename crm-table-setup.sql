-- CRM 페이지용 customers 테이블 생성
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  team TEXT NOT NULL,
  manager TEXT NOT NULL,
  course_type TEXT NOT NULL,
  institution TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  contact TEXT,
  education TEXT NOT NULL,
  region TEXT NOT NULL,
  sub_region TEXT,
  status TEXT DEFAULT '등록완료',
  payment_date DATE,
  payment_amount INTEGER,
  commission INTEGER,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_customers_manager ON customers(manager);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch);
CREATE INDEX IF NOT EXISTS idx_customers_course_type ON customers(course_type);
CREATE INDEX IF NOT EXISTS idx_customers_institution ON customers(institution);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_payment_date ON customers(payment_date);

-- RLS 정책 설정 (사용자별 데이터 분리)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 볼 수 있도록 정책 설정
CREATE POLICY "Users can only see their own customers" ON customers
FOR ALL USING (manager = current_setting('app.current_user_name', true));

-- 또는 더 간단하게 RLS를 비활성화하고 애플리케이션에서 필터링
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO customers (
  branch, team, manager, course_type, institution, customer_name, 
  contact, education, region, sub_region, status, payment_date, 
  payment_amount, commission
) VALUES 
('AIO', '1팀', '김철수', '학점은행제', '한평생학점은행', '홍길동', 
 '010-1234-5678', '고등학교 졸업', '서울', '도봉구', '등록완료', 
 '2025-01-15', 600000, 140000),
('위드업', '2팀', '이영희', '민간 자격증', '한평생직업훈련', '박민수', 
 '010-9876-5432', '2년제 졸업', '서울', '강남구', '등록완료', 
 '2025-01-20', 500000, 120000),
('AIO', '3팀', '김철수', '유학', '감자유학', '최지영', 
 '010-5555-1234', '4년제 졸업', '서울', '서초구', '등록완료', 
 '2025-01-25', 800000, 200000);

-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;
