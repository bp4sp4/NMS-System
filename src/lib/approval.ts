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
  filter: DocumentFilter = {},
  userId?: string
): Promise<ApprovalApiResponse<ApprovalDocument[]>> {
  try {
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
      .order("created_at", { ascending: false });

    // 필터 적용
    if (filter.status && filter.status.length > 0) {
      query = query.in("status", filter.status);
    }

    if (filter.priority && filter.priority.length > 0) {
      query = query.in("priority", filter.priority);
    }

    if (filter.applicant_id) {
      query = query.eq("applicant_id", filter.applicant_id);
    }

    if (filter.approver_id) {
      query = query.eq("current_approver_id", filter.approver_id);
    }

    if (filter.date_from) {
      query = query.gte("created_at", filter.date_from);
    }

    if (filter.date_to) {
      query = query.lte("created_at", filter.date_to);
    }

    if (filter.search) {
      query = query.or(
        `title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // 조인된 데이터 정리
    const documents =
      data?.map((doc) => ({
        ...doc,
        applicant_name: doc.applicant?.name,
        current_approver_name: doc.current_approver?.name,
      })) || [];

    return { success: true, data: documents };
  } catch (error) {
    console.error("결재 문서 조회 오류:", error);
    return { success: false, error: "결재 문서를 불러오는데 실패했습니다." };
  }
}

export async function getApprovalDocument(
  documentId: string
): Promise<ApprovalApiResponse<ApprovalDocument>> {
  try {
    const { data, error } = await supabase
      .from("approval_documents")
      .select(
        `
        *,
        applicant:users!approval_documents_applicant_id_fkey(name),
        current_approver:users!approval_documents_current_approver_id_fkey(name),
        template:approval_form_templates(*)
      `
      )
      .eq("id", documentId)
      .single();

    if (error) throw error;

    const document = {
      ...data,
      applicant_name: data.applicant?.name,
      current_approver_name: data.current_approver?.name,
    };

    return { success: true, data: document };
  } catch (error) {
    console.error("결재 문서 조회 오류:", error);
    return { success: false, error: "결재 문서를 불러오는데 실패했습니다." };
  }
}

export async function createApprovalDocument(
  request: CreateDocumentRequest
): Promise<ApprovalApiResponse<ApprovalDocument>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
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
      user.id,
      request.form_data
    );

    const documentData = {
      template_id: request.template_id,
      title: request.title,
      form_data: request.form_data,
      applicant_id: user.id,
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

    // 실제 구현에서는 사용자의 직급과 부서 정보를 기반으로 승인자 결정
    // 여기서는 임시로 null 반환
    return null;
  } catch (error) {
    console.error("승인자 결정 오류:", error);
    return null;
  }
}

// 승인 처리 함수
export async function processApproval(
  request: ApprovalActionRequest
): Promise<ApprovalApiResponse<ApprovalDocument>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 승인 이력 추가
    const { error: historyError } = await supabase
      .from("approval_history")
      .insert({
        document_id: request.document_id,
        approver_id: user.id,
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
  templateId: string
): Promise<ApprovalApiResponse<boolean>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 기존 즐겨찾기 확인
    const { data: existing } = await supabase
      .from("user_favorite_forms")
      .select("id")
      .eq("user_id", user.id)
      .eq("template_id", templateId)
      .single();

    if (existing) {
      // 즐겨찾기 제거
      const { error } = await supabase
        .from("user_favorite_forms")
        .delete()
        .eq("user_id", user.id)
        .eq("template_id", templateId);

      if (error) throw error;
      return { success: true, data: false };
    } else {
      // 즐겨찾기 추가
      const { error } = await supabase.from("user_favorite_forms").insert({
        user_id: user.id,
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
