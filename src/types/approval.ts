// 전자결재 관련 타입 정의

export interface FormField {
  name: string;
  type: "text" | "date" | "number" | "select" | "textarea" | "file";
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface ApprovalStep {
  order: number;
  approverType:
    | "direct_manager"
    | "department_head"
    | "hr_manager"
    | "general_manager"
    | "accounting_manager"
    | "purchase_manager"
    | "sales_manager";
  required: boolean;
  autoApproval?: boolean;
  conditions?: {
    amount?: {
      min?: number;
      max?: number;
    };
    department?: string[];
  };
}

export interface ApprovalFlow {
  steps: ApprovalStep[];
  parallelApproval?: boolean;
  escalationDays?: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: FormField[] | any; // JSON 데이터로 저장되므로 any도 허용
  approval_flow: ApprovalFlow;
  required_attachments: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ApprovalDocument {
  id: string;
  template_id: string;
  title: string;
  content?: string;
  form_data: Record<string, any>;
  applicant_id: string;
  current_approver_id?: string;
  status:
    | "draft"
    | "submitted"
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  attachments?: AttachmentInfo[];
  approval_flow: ApprovalFlow;
  created_at: string;
  updated_at: string;

  // 조인된 데이터
  applicant_name?: string;
  current_approver_name?: string;
  template?: FormTemplate;
}

export interface AttachmentInfo {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface ApprovalHistory {
  id: string;
  document_id: string;
  approver_id: string;
  action: "approve" | "reject" | "return" | "delegate";
  comment?: string;
  step_order: number;
  created_at: string;

  // 조인된 데이터
  approver_name?: string;
}

export interface UserFavoriteForm {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;

  // 조인된 데이터
  template?: FormTemplate;
}

// API 응답 타입
export interface ApprovalApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 양식 생성 요청 타입
export interface CreateDocumentRequest {
  template_id: string;
  title: string;
  form_data: Record<string, any>;
  priority?: "low" | "normal" | "high" | "urgent";
  attachments?: File[];
}

// 승인 처리 요청 타입
export interface ApprovalActionRequest {
  document_id: string;
  action: "approve" | "reject" | "return" | "delegate";
  comment?: string;
  delegate_to?: string;
}

// 검색 및 필터링 타입
export interface DocumentFilter {
  status?: string[];
  priority?: string[];
  category?: string[];
  applicant_id?: string;
  approver_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface DocumentSort {
  field: "created_at" | "updated_at" | "title" | "priority";
  order: "asc" | "desc";
}

// 통계 타입
export interface ApprovalStats {
  total_documents: number;
  pending_approvals: number;
  my_documents: number;
  approved_this_month: number;
  rejected_this_month: number;
  average_approval_time: number; // 시간 단위
}

// 알림 타입
export interface ApprovalNotification {
  id: string;
  type:
    | "new_document"
    | "approval_required"
    | "document_approved"
    | "document_rejected";
  document_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// 부서별 양식 권한 타입
export interface DepartmentFormPermission {
  department: string;
  allowed_categories: string[];
  required_approvers: string[];
  auto_approval_limit?: number;
}

// 양식 검증 결과 타입
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// 동적 양식 렌더링을 위한 컴포넌트 props 타입
export interface DynamicFormProps {
  template: FormTemplate;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onSave?: (data: Record<string, any>) => void;
  readonly?: boolean;
  loading?: boolean;
}

// 양식 필드 컴포넌트 props 타입
export interface FormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}
