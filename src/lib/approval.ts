import { supabase } from "./supabase";
import type {
  FormTemplate,
  ApprovalDocument,
  ApprovalHistory,
  UserFavoriteForm,
  CreateDocumentRequest,
  ApprovalActionRequest,
  DocumentFilter,
  ApprovalStats,
  ApprovalApiResponse,
} from "@/types/approval";

// 양식 템플릿 관련 함수들
export async function getFormTemplates(
  category?: string,
  userBranch?: string
): Promise<ApprovalApiResponse<FormTemplate[]>> {
  try {
    let query = supabase
      .from("approval_form_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 부서별 필터링 로직
    let filteredData = data || [];

    if (userBranch) {
      filteredData = filterTemplatesByBranch(filteredData, userBranch);
    }

    return { success: true, data: filteredData };
  } catch (error) {
    console.error("양식 템플릿 조회 오류:", error);
    return { success: false, error: "양식 템플릿을 불러오는데 실패했습니다." };
  }
}

export async function getFormTemplate(
  templateId: string
): Promise<ApprovalApiResponse<FormTemplate>> {
  try {
    const { data, error } = await supabase
      .from("approval_form_templates")
      .select("*")
      .eq("id", templateId)
      .eq("is_active", true)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("양식 템플릿 조회 오류:", error);
    return { success: false, error: "양식 템플릿을 불러오는데 실패했습니다." };
  }
}

// 직급 매핑 함수
export function getApproverTitle(approverType: string): string {
  const titleMap: Record<string, string> = {
    direct_manager: "직속상관",
    department_head: "부서장",
    hr_manager: "인사실장",
    general_manager: "실장",
    accounting_manager: "회계실장",
    purchase_manager: "구매실장",
    sales_manager: "영업실장",
    director: "이사",
    ceo: "대표이사",
  };

  return titleMap[approverType] || approverType;
}

// 승인자 정보 매핑 함수
export function getApproverInfo(approverType: string): {
  name: string;
  dept: string;
} {
  const approverMap: Record<string, { name: string; dept: string }> = {
    hr_manager: { name: "경영", dept: "경영지원본부" },
    general_manager: { name: "경영", dept: "경영지원본부" },
    director: { name: "박상훈", dept: "브랜드마케팅본부" },
    ceo: { name: "관리자", dept: "AIO지점" },
  };

  return approverMap[approverType] || { name: "승인자", dept: "부서" };
}

// 부서별 양식 필터링 함수
function filterTemplatesByBranch(
  templates: FormTemplate[],
  branch: string
): FormTemplate[] {
  switch (branch) {
    case "브랜드마케팅본부":
      return templates.filter(
        (template) =>
          template.category === "고객" ||
          template.category === "마케팅" ||
          template.name.includes("할인") ||
          template.name.includes("마케팅")
      );

    case "인사팀":
      return templates.filter(
        (template) =>
          template.category === "인사" ||
          template.name.includes("휴가") ||
          template.name.includes("출장") ||
          template.name.includes("인사")
      );

    case "경영지원본부":
      return templates.filter(
        (template) =>
          template.category === "비용" ||
          template.name.includes("구매") ||
          template.name.includes("경비") ||
          template.name.includes("정산")
      );

    case "교육개발팀":
      return templates.filter(
        (template) =>
          template.category === "업무" ||
          template.name.includes("교육") ||
          template.name.includes("과정") ||
          template.name.includes("강사")
      );

    default:
      return templates;
  }
}

// 전자결재 문서 관련 함수들
export async function getApprovalDocuments(
  userId?: string,
  status?: string
): Promise<ApprovalApiResponse<ApprovalDocument[]>> {
  try {
    // userId가 필수 - 신청자만 자신의 문서를 볼 수 있음
    if (!userId) {
      return { success: false, error: "사용자 ID가 필요합니다." };
    }

    let query = supabase
      .from("approval_documents")
      .select(
        `
        *,
        applicant:users!approval_documents_applicant_id_fkey(name),
        current_approver:users!approval_documents_current_approver_id_fkey(name),
        template:approval_form_templates(*)
      `
      )
      .eq("applicant_id", userId) // 신청자만 자신의 문서 조회 가능
      .order("created_at", { ascending: false });

    // 상태 필터 적용
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("결재 문서 조회 오류:", error);
    return { success: false, error: "결재 문서를 불러오는데 실패했습니다." };
  }
}

export async function getApprovalDocument(
  documentId: string,
  userId?: string
): Promise<ApprovalApiResponse<ApprovalDocument>> {
  try {
    const { data, error } = await supabase
      .from("approval_documents")
      .select(
        `
        *,
        current_approver:users!approval_documents_current_approver_id_fkey(name),
        template:approval_form_templates(*)
      `
      )
      .eq("id", documentId)
      .single();

    if (error) throw error;

    // 권한 확인: 신청자만 자신의 문서를 볼 수 있음
    if (userId && data.applicant_id !== userId) {
      return { success: false, error: "이 문서를 조회할 권한이 없습니다." };
    }

    // 신청자 정보 별도 조회
    const { data: applicantData, error: applicantError } = await supabase
      .from("users")
      .select("name, branch")
      .eq("id", data.applicant_id)
      .single();

    if (applicantError) {
      console.error("신청자 정보 조회 오류:", applicantError);
    }

    const document = {
      ...data,
      applicant_name: applicantData?.name || "신청자",
      applicant_branch: applicantData?.branch || "부서",
      current_approver_name: data.current_approver?.name,
    };

    return { success: true, data: document };
  } catch (error) {
    console.error("결재 문서 조회 오류:", error);
    return { success: false, error: "결재 문서를 불러오는데 실패했습니다." };
  }
}

export async function createApprovalDocument(
  request: CreateDocumentRequest,
  userId?: string
): Promise<ApprovalApiResponse<ApprovalDocument>> {
  try {
    // userId가 제공되지 않은 경우 클라이언트에서 전달받아야 함
    if (!userId) {
      return { success: false, error: "사용자 ID가 필요합니다." };
    }

    // 템플릿 정보 가져오기
    const templateResult = await getFormTemplate(request.template_id);
    if (!templateResult.success || !templateResult.data) {
      return { success: false, error: "양식 템플릿을 찾을 수 없습니다." };
    }

    const template = templateResult.data;

    // 승인자 결정 로직
    const currentApproverId = await determineApprover(
      template.approval_flow,
      userId,
      request.form_data
    );

    const documentData = {
      template_id: request.template_id,
      title: request.title,
      form_data: request.form_data,
      applicant_id: userId,
      current_approver_id: currentApproverId,
      status: "draft" as const,
      priority: request.priority || "normal",
      approval_flow: template.approval_flow,
    };

    const { data, error } = await supabase
      .from("approval_documents")
      .insert(documentData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("결재 문서 생성 오류:", error);
    return { success: false, error: "결재 문서 생성에 실패했습니다." };
  }
}

export async function submitApprovalDocument(
  documentId: string
): Promise<ApprovalApiResponse<ApprovalDocument>> {
  try {
    const { data, error } = await supabase
      .from("approval_documents")
      .update({
        status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("결재 문서 제출 오류:", error);
    return { success: false, error: "결재 문서 제출에 실패했습니다." };
  }
}

export async function updateApprovalDocument(
  documentId: string,
  updateData: Partial<ApprovalDocument>
): Promise<ApprovalApiResponse<ApprovalDocument>> {
  try {
    const { data, error } = await supabase
      .from("approval_documents")
      .update(updateData)
      .eq("id", documentId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("결재 문서 수정 오류:", error);
    return { success: false, error: "결재 문서 수정에 실패했습니다." };
  }
}

// 승인자 결정 로직
async function determineApprover(
  approvalFlow: any,
  applicantId: string,
  formData: Record<string, any>
): Promise<string | null> {
  try {
    // 첫 번째 승인 단계의 승인자 찾기
    const firstStep = approvalFlow.steps?.[0];
    if (!firstStep) return null;

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("branch, team, position_id")
      .eq("id", applicantId)
      .single();

    if (userError || !userData) {
      console.error("사용자 정보 조회 실패:", userError);
      return null;
    }

    // 승인자 타입에 따른 승인자 찾기
    const approverType = firstStep.approverType;

    // 승인자 매핑 정보 사용
    const approverInfo = getApproverInfo(approverType);

    // 실제 승인자 ID 찾기 - 더 유연한 검색
    const approverQuery = supabase
      .from("users")
      .select("id")
      .eq("name", approverInfo.name);

    // 부서가 일치하는 경우 우선 검색
    const { data: approverData, error: approverError } = await approverQuery
      .eq("branch", approverInfo.dept)
      .single();

    if (approverError || !approverData) {
      // 부서가 일치하지 않으면 이름만으로 검색
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("users")
        .select("id")
        .eq("name", approverInfo.name)
        .single();

      if (fallbackError || !fallbackData) {
        console.error("승인자 조회 실패:", approverError);
        // 마지막 수단으로 관리자 사용
        const { data: adminData } = await supabase
          .from("users")
          .select("id")
          .eq("name", "관리자")
          .single();

        return adminData?.id || null;
      }

      return fallbackData.id;
    }

    return approverData.id;
  } catch (error) {
    console.error("승인자 결정 오류:", error);
    return null;
  }
}

// 승인 처리 함수
export async function processApproval(
  request: ApprovalActionRequest,
  userId?: string
): Promise<ApprovalApiResponse<ApprovalDocument>> {
  try {
    if (!userId) {
      return { success: false, error: "사용자 ID가 필요합니다." };
    }

    // 사용자 정보 조회하여 권한 확인
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, branch")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    // 경영지원본부 실장만 승인/반려 가능
    if (userData.branch !== "경영지원본부" || userData.name !== "경영") {
      return {
        success: false,
        error: "승인 권한이 없습니다. 경영지원본부 실장만 승인할 수 있습니다.",
      };
    }

    // 승인 이력 추가
    const { error: historyError } = await supabase
      .from("approval_history")
      .insert({
        document_id: request.document_id,
        approver_id: userId,
        action: request.action,
        comment: request.comment,
        step_order: 1, // 실제로는 현재 단계 계산
      });

    if (historyError) throw historyError;

    // 문서 상태 업데이트
    let newStatus = request.action === "approve" ? "approved" : "rejected";
    if (request.action === "return") {
      newStatus = "draft";
    }

    const { data, error } = await supabase
      .from("approval_documents")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.document_id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("승인 처리 오류:", error);
    return { success: false, error: "승인 처리에 실패했습니다." };
  }
}

// 즐겨찾기 관련 함수들
export async function getFavoriteForms(
  userId: string
): Promise<ApprovalApiResponse<UserFavoriteForm[]>> {
  try {
    const { data, error } = await supabase
      .from("user_favorite_forms")
      .select(
        `
        *,
        template:approval_form_templates(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("즐겨찾기 조회 오류:", error);
    return { success: false, error: "즐겨찾기를 불러오는데 실패했습니다." };
  }
}

export async function toggleFavoriteForm(
  templateId: string,
  userId?: string
): Promise<ApprovalApiResponse<boolean>> {
  try {
    if (!userId) {
      return { success: false, error: "사용자 ID가 필요합니다." };
    }

    // 기존 즐겨찾기 확인
    const { data: existing } = await supabase
      .from("user_favorite_forms")
      .select("id")
      .eq("user_id", userId)
      .eq("template_id", templateId)
      .single();

    if (existing) {
      // 즐겨찾기 제거
      const { error } = await supabase
        .from("user_favorite_forms")
        .delete()
        .eq("user_id", userId)
        .eq("template_id", templateId);

      if (error) throw error;
      return { success: true, data: false };
    } else {
      // 즐겨찾기 추가
      const { error } = await supabase.from("user_favorite_forms").insert({
        user_id: userId,
        template_id: templateId,
      });

      if (error) throw error;
      return { success: true, data: true };
    }
  } catch (error) {
    console.error("즐겨찾기 토글 오류:", error);
    return { success: false, error: "즐겨찾기 처리에 실패했습니다." };
  }
}

// 통계 관련 함수
export async function getApprovalStats(
  userId: string
): Promise<ApprovalApiResponse<ApprovalStats>> {
  try {
    // 실제 구현에서는 복잡한 통계 쿼리 실행
    const stats: ApprovalStats = {
      total_documents: 0,
      pending_approvals: 0,
      my_documents: 0,
      approved_this_month: 0,
      rejected_this_month: 0,
      average_approval_time: 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("통계 조회 오류:", error);
    return { success: false, error: "통계를 불러오는데 실패했습니다." };
  }
}
