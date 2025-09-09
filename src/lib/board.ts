import { supabase } from "./supabase";
import { Post, CreatePostData, CreateCommentData } from "@/types/board";

// 사용자가 특정 카테고리에 글을 쓸 수 있는지 확인
export const canWritePost = async (
  userId: string,
  category: string
): Promise<boolean> => {
  try {
    // 1. 사용자의 직급과 팀 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("branch, team, position_id")
      .eq("id", userId)
      .single();

    if (userError) return false;

    // 2. 해당 카테고리의 직급별 권한 확인
    const { data: positionPermission } = await supabase
      .from("post_category_permissions")
      .select("*")
      .eq("category_name", category)
      .eq("position_id", userData.position_id)
      .eq("can_write", true)
      .single();

    // 3. 해당 카테고리의 팀별 권한 확인 (특별 권한)
    const { data: teamPermission } = await supabase
      .from("post_category_permissions")
      .select("*")
      .eq("category_name", category)
      .eq("team_name", userData.team)
      .eq("can_write", true)
      .single();

    // 4. 둘 중 하나라도 만족하면 작성 가능
    return !!(positionPermission || teamPermission);
  } catch (error) {
    console.error("권한 확인 오류:", error);
    return false;
  }
};

// 사용자가 읽을 수 있는 카테고리 목록 조회
export const getReadableCategories = async (
  userId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("post_category_permissions")
      .select("category_name")
      .eq("can_read", true);

    if (error) return [];

    return [...new Set(data.map((item) => item.category_name))];
  } catch (error) {
    console.error("읽기 가능 카테고리 조회 오류:", error);
    return [];
  }
};

// 게시글 목록 조회
export const getPosts = async (
  category?: string,
  limit: number = 10,
  offset: number = 0
): Promise<Post[]> => {
  try {
    // 1단계: 기본 게시글 정보 조회
    let query = supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "전체") {
      query = query.eq("category", category);
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) {
      console.error("게시글 조회 오류:", postsError);
      return [];
    }

    if (!postsData || postsData.length === 0) {
      return [];
    }

    // 2단계: 작성자 정보 조회 (직급 정보 포함)
    const authorIds = [...new Set(postsData.map((post) => post.author_id))];
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, branch, team, position_id")
      .in("id", authorIds);

    if (usersError) {
      console.error("사용자 정보 조회 오류:", usersError);
    }

    // 3단계: 직급 마스터 정보 조회
    const positionIds =
      usersData?.map((u) => u.position_id).filter(Boolean) || [];
    const { data: positionMaster, error: masterError } = await supabase
      .from("positions")
      .select("id, name")
      .in("id", positionIds);

    if (masterError) {
      console.error("직급 마스터 조회 오류:", masterError);
    }

    // 5단계: 첨부파일 정보 조회
    const postIds = postsData.map((post) => post.id);

    const { data: attachmentsData, error: attachmentsError } = await supabase
      .from("post_attachments")
      .select("*")
      .in("post_id", postIds);

    if (attachmentsError) {
      console.error("첨부파일 조회 오류:", attachmentsError);
    }

    // 6단계: 데이터 매칭 및 변환
    const usersMap = new Map(usersData?.map((user) => [user.id, user]) || []);
    const positionNamesMap = new Map(
      positionMaster?.map((pos) => [pos.id, pos.name]) || []
    );

    return postsData.map((post) => {
      const user = usersMap.get(post.author_id);
      const positionId = user?.position_id;
      const positionName = positionId ? positionNamesMap.get(positionId) : null;
      const attachments =
        attachmentsData?.filter((att) => att.post_id === post.id) || [];

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        is_pinned: post.is_pinned || false,
        created_at: post.created_at,
        updated_at: post.updated_at,
        user_id: post.author_id,
        user_name: user?.name || "알 수 없음",
        user_position: positionName || "직급 미설정",
        user_team: user?.team || "팀 미설정",
        attachments: attachments,
        comments: [], // 댓글은 별도로 조회해야 함
      } as Post;
    });
  } catch (error) {
    console.error("게시글 조회 중 오류:", error);
    return [];
  }
};

// 게시글 작성
export const createPost = async (
  userId: string,
  postData: CreatePostData,
  attachments?: File[]
): Promise<{ success: boolean; postId?: string; error?: string }> => {
  try {
    // 권한 확인
    const hasPermission = await canWritePost(userId, postData.category);
    if (!hasPermission) {
      return {
        success: false,
        error: "해당 카테고리에 글을 쓸 권한이 없습니다.",
      };
    }

    // 1단계: 게시글 작성
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: postData.title,
        content: postData.content,
        author_id: userId,
        category: postData.category,
        is_pinned: postData.is_pinned || false,
      })
      .select()
      .single();

    if (error) {
      console.error("게시글 작성 오류:", error);
      return { success: false, error: "게시글 작성에 실패했습니다." };
    }

    // 2단계: 첨부파일 저장 (있는 경우)
    if (attachments && attachments.length > 0) {
      console.log("첨부파일 저장 시작:", attachments.length, "개");

      try {
        const attachmentData = attachments.map((file) => ({
          post_id: data.id,
          file_name: file.name,
          file_path: `/uploads/${file.name}`, // 임시 경로
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
        }));

        console.log("저장할 첨부파일 데이터:", attachmentData);

        const { data: attachmentResult, error: attachmentError } =
          await supabase
            .from("post_attachments")
            .insert(attachmentData)
            .select();

        if (attachmentError) {
          console.error("첨부파일 저장 오류 상세:", {
            message: attachmentError.message,
            details: attachmentError.details,
            hint: attachmentError.hint,
            code: attachmentError.code,
          });
          // 첨부파일 저장 실패해도 게시글은 성공으로 처리
          console.warn("첨부파일 저장에 실패했지만 게시글은 작성되었습니다.");
        } else {
          console.log("첨부파일 저장 성공:", attachmentResult);
        }
      } catch (error) {
        console.error("첨부파일 저장 중 예외 발생:", error);
        console.warn("첨부파일 저장에 실패했지만 게시글은 작성되었습니다.");
      }
    }

    return { success: true, postId: data.id };
  } catch (error) {
    console.error("게시글 작성 중 오류:", error);
    return { success: false, error: "게시글 작성 중 오류가 발생했습니다." };
  }
};

// 게시글 상세 조회
export const getPostById = async (postId: string): Promise<Post | null> => {
  try {
    // 1단계: 기본 게시글 정보 조회
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .eq("status", "published")
      .single();

    if (postError) {
      console.error("게시글 상세 조회 오류:", postError);
      return null;
    }

    // 2단계: 작성자 정보 조회 (직급 정보 포함)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, branch, team, position_id")
      .eq("id", postData.author_id)
      .single();

    if (userError) {
      console.error("사용자 정보 조회 오류:", userError);
    }

    // 3단계: 직급 마스터 정보 조회
    let positionName = null;
    if (userData?.position_id) {
      const { data: masterData, error: masterError } = await supabase
        .from("positions")
        .select("name")
        .eq("id", userData.position_id)
        .single();

      if (masterError) {
        console.error("직급 마스터 조회 오류:", masterError);
      } else {
        positionName = masterData?.name;
      }
    }

    // 5단계: 첨부파일 정보 조회
    console.log("게시글 상세 조회 - 게시글 ID:", postId);

    const { data: attachmentsData, error: attachmentsError } = await supabase
      .from("post_attachments")
      .select("*")
      .eq("post_id", postId);

    if (attachmentsError) {
      console.error("첨부파일 조회 오류:", attachmentsError);
    } else {
      console.log("게시글 상세 - 조회된 첨부파일:", attachmentsData);
    }

    // 6단계: 댓글 데이터 조회 (단순화)
    console.log("댓글 조회 시작 - 게시글 ID:", postId);

    const { data: commentsData, error: commentsError } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("댓글 조회 오류:", commentsError);
    } else {
      console.log("게시글 상세 - 조회된 댓글:", commentsData);
      console.log("댓글 개수:", commentsData?.length || 0);

      // 전체 댓글 테이블 확인
      const { data: allComments, error: allCommentsError } = await supabase
        .from("post_comments")
        .select("*")
        .limit(5);

      if (allCommentsError) {
        console.error("전체 댓글 조회 오류:", allCommentsError);
      } else {
        console.log("전체 댓글 테이블 샘플:", allComments);
        console.log("전체 댓글 개수:", allComments?.length || 0);
      }
    }

    // 댓글 정보 정리 (사용자 정보는 별도로 조회)
    const formattedComments: any[] = [];
    if (commentsData) {
      for (const comment of commentsData) {
        try {
          // 각 댓글의 사용자 정보 개별 조회
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("name, branch, team")
            .eq("id", comment.user_id)
            .single();

          if (userError) {
            console.warn(
              `사용자 정보 조회 실패 (${comment.user_id}):`,
              userError
            );
          }

          formattedComments.push({
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.content,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            user_name: userData?.name || "알 수 없음",
            user_position: "직급 미설정", // 임시로 고정
            user_team: userData?.team || "팀 미설정",
          });
        } catch (error) {
          console.warn(`댓글 ${comment.id} 처리 중 오류:`, error);
          // 오류가 발생해도 기본 정보는 포함
          formattedComments.push({
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.content,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            user_name: "알 수 없음",
            user_position: "직급 미설정",
            user_team: "팀 미설정",
          });
        }
      }
    }

    // 7단계: 조회수 증가
    await supabase
      .from("posts")
      .update({ view_count: (postData.view_count || 0) + 1 })
      .eq("id", postId);

    // 8단계: 데이터 반환
    return {
      id: postData.id,
      title: postData.title,
      content: postData.content,
      category: postData.category,
      is_pinned: postData.is_pinned || false,
      created_at: postData.created_at,
      updated_at: postData.updated_at,
      user_id: postData.author_id,
      user_name: userData?.name || "알 수 없음",
      user_position: positionName || "직급 미설정",
      user_team: userData?.team || "팀 미설정",
      attachments: attachmentsData || [],
      comments: formattedComments,
    } as Post;
  } catch (error) {
    console.error("게시글 상세 조회 중 오류:", error);
    return null;
  }
};

// 게시글 수정
export const updatePost = async (
  postId: string,
  postData: CreatePostData,
  newAttachments?: File[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1단계: 게시글 정보 수정
    const { error } = await supabase
      .from("posts")
      .update({
        title: postData.title,
        content: postData.content,
        category: postData.category,
        is_pinned: postData.is_pinned || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      console.error("게시글 수정 오류:", error);
      return { success: false, error: "게시글 수정에 실패했습니다." };
    }

    // 2단계: 새로운 첨부파일 추가 (있는 경우)
    if (newAttachments && newAttachments.length > 0) {
      console.log("새 첨부파일 추가 시작:", newAttachments.length, "개");

      const attachmentData = newAttachments.map((file) => ({
        post_id: postId,
        file_name: file.name,
        file_path: `/uploads/${file.name}`, // 임시 경로
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
      }));

      const { error: attachmentError } = await supabase
        .from("post_attachments")
        .insert(attachmentData);

      if (attachmentError) {
        console.error("새 첨부파일 추가 오류:", attachmentError);
        console.warn("새 첨부파일 추가에 실패했지만 게시글은 수정되었습니다.");
      } else {
        console.log("새 첨부파일 추가 성공:", newAttachments.length, "개");
      }
    }

    return { success: true };
  } catch (error) {
    console.error("게시글 수정 중 오류:", error);
    return { success: false, error: "게시글 수정 중 오류가 발생했습니다." };
  }
};

// 첨부파일 삭제
export const deleteAttachment = async (
  attachmentId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("post_attachments")
      .delete()
      .eq("id", attachmentId);

    if (error) {
      console.error("첨부파일 삭제 오류:", error);
      return { success: false, error: "첨부파일 삭제에 실패했습니다." };
    }

    return { success: true };
  } catch (error) {
    console.error("첨부파일 삭제 중 오류:", error);
    return { success: false, error: "첨부파일 삭제 중 오류가 발생했습니다." };
  }
};

// 게시글 삭제
export const deletePost = async (
  postId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 먼저 첨부파일 삭제
    const { error: attachmentError } = await supabase
      .from("post_attachments")
      .delete()
      .eq("post_id", postId);

    if (attachmentError) {
      console.error("첨부파일 삭제 오류:", attachmentError);
    }

    // 게시글 삭제
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.error("게시글 삭제 오류:", error);
      return { success: false, error: "게시글 삭제에 실패했습니다." };
    }

    return { success: true };
  } catch (error) {
    console.error("게시글 삭제 중 오류:", error);
    return { success: false, error: "게시글 삭제 중 오류가 발생했습니다." };
  }
};

// ===== 댓글 관련 함수들 =====

// 댓글 작성
export const createComment = async (
  postId: string,
  commentData: CreateCommentData
): Promise<{ success: boolean; comment?: any; error?: string }> => {
  try {
    console.log("createComment 시작 - postId:", postId);

    // 1단계: Supabase Auth에서 사용자 정보 조회
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("Supabase Auth 사용자:", user);

    let actualUser = user;

    // 2단계: Supabase Auth에 사용자가 없으면 로컬 스토리지에서 확인
    if (!user) {
      console.log("Supabase Auth에서 사용자 정보 없음, 로컬 스토리지 확인");

      if (typeof window !== "undefined") {
        const sessionData = localStorage.getItem("nms-user-session");
        if (sessionData) {
          try {
            const localUser = JSON.parse(sessionData);
            console.log("로컬 스토리지 사용자:", localUser);

            if (localUser && localUser.id) {
              // 로컬 세션을 사용하여 댓글 작성 시도
              actualUser = localUser;
              console.log("로컬 세션 사용자로 댓글 작성 시도:", actualUser);
            }
          } catch (parseError) {
            console.error("로컬 세션 파싱 오류:", parseError);
          }
        }
      }
    }

    if (!actualUser || !actualUser.id) {
      console.log("사용자 정보를 찾을 수 없음");
      return { success: false, error: "로그인이 필요합니다." };
    }

    console.log("사용자 ID:", actualUser.id, "타입:", typeof actualUser.id);

    // 사용자 ID가 올바른 형식인지 확인
    if (
      !actualUser.id ||
      typeof actualUser.id !== "string" ||
      actualUser.id.length < 10
    ) {
      console.error("잘못된 사용자 ID 형식:", actualUser.id);
      return { success: false, error: "사용자 ID 형식이 올바르지 않습니다." };
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, branch, team")
      .eq("id", actualUser.id)
      .single();

    if (userError) {
      console.error("사용자 정보 조회 오류:", userError);
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    console.log("사용자 정보 조회 성공:", userData);

    // 사용자 직급 정보 조회
    const { data: positionData, error: positionError } = await supabase
      .from("user_positions")
      .select("position_id")
      .eq("user_id", actualUser.id)
      .single();

    if (positionError) {
      console.error("직급 정보 조회 오류:", positionError);
      // 직급 정보가 없어도 댓글은 작성 가능하도록 처리
      console.warn("직급 정보 없음, 기본값 사용");
    }

    let positionName = "직급 미설정";
    if (positionData) {
      // 직급명 조회
      const { data: positionNameData, error: positionNameError } =
        await supabase
          .from("positions")
          .select("name")
          .eq("id", positionData.position_id)
          .single();

      if (!positionNameError && positionNameData) {
        positionName = positionNameData.name;
      }
    }

    // 댓글 생성 시작
    console.log("댓글 생성 시작:", {
      post_id: postId,
      user_id: actualUser.id,
      content: commentData.content,
    });

    // 사용자 ID 유효성 검사
    if (!actualUser || !actualUser.id) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    if (typeof actualUser.id !== "string" || actualUser.id.length < 10) {
      return { success: false, error: "사용자 ID가 올바르지 않습니다." };
    }

    // 사용자 ID가 실제로 users 테이블에 존재하는지 확인
    const { data: userCheck, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("id", actualUser.id)
      .single();

    if (userCheckError || !userCheck) {
      return {
        success: false,
        error: `사용자 ID '${actualUser.id}'가 users 테이블에 존재하지 않습니다.`,
      };
    }

    // post_id가 실제로 posts 테이블에 존재하는지 확인
    const { data: postCheck, error: postCheckError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postCheckError || !postCheck) {
      return {
        success: false,
        error: `게시글 ID '${postId}'가 posts 테이블에 존재하지 않습니다.`,
      };
    }

    // 댓글 생성 시도
    console.log("댓글 생성 시도");

    const { data: comment, error: commentError } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: actualUser.id,
        content: commentData.content,
      })
      .select()
      .single();

    if (commentError) {
      console.error("댓글 생성 오류:", commentError);
      console.error("오류 객체 상세:", {
        error: commentError,
        errorType: typeof commentError,
        errorKeys: Object.keys(commentError),
        errorString: JSON.stringify(commentError),
        errorCode: commentError?.code,
        errorMessage: commentError?.message,
        errorDetails: commentError?.details,
        errorHint: commentError?.hint,
      });

      // 오류 코드가 있는 경우
      if (commentError.code) {
        if (commentError.code === "42501") {
          console.error("RLS 정책 위반 - 다음을 확인하세요:");
          console.error(
            "1. post_comments 테이블에 RLS 정책이 올바르게 설정되었는지"
          );
          console.error("2. auth.uid()가 올바르게 설정되었는지");
          console.error("3. 사용자 ID가 users 테이블에 존재하는지");
          return {
            success: false,
            error:
              "권한 문제로 댓글 작성에 실패했습니다. 관리자에게 문의하세요.",
          };
        } else if (commentError.code === "23503") {
          console.error("외래키 제약조건 위반 - 다음을 확인하세요:");
          console.error("1. 사용자 ID가 users 테이블에 존재하는지");
          console.error("2. post_id가 posts 테이블에 존재하는지");
          return {
            success: false,
            error:
              "데이터 무결성 문제로 댓글 작성에 실패했습니다. 관리자에게 문의하세요.",
          };
        }
      }

      return { success: false, error: "댓글 작성에 실패했습니다." };
    }

    // 댓글 정보에 사용자 정보 추가
    const commentWithUser = {
      ...comment,
      user_name: userData.name,
      user_position: positionName,
      user_team: userData.team,
    };

    console.log("댓글 생성 완료:", commentWithUser);

    return { success: true, comment: commentWithUser };
  } catch (error) {
    return { success: false, error: "댓글 작성 중 오류가 발생했습니다." };
  }
};

// 댓글 목록 조회
export const getComments = async (
  postId: string
): Promise<{ success: boolean; comments?: any[]; error?: string }> => {
  try {
    const { data: comments, error } = await supabase
      .from("post_comments")
      .select(
        `
        *,
        users!post_comments_user_id_fkey (
          name,
          branch,
          team
        ),
        positions!user_positions_position_id_fkey (
          name
        )
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: "댓글 조회에 실패했습니다." };
    }

    // 댓글 정보 정리
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user_name: comment.users?.name || "알 수 없음",
      user_position: comment.positions?.name || "직급 미설정",
      user_team: comment.users?.team || "팀 미설정",
    }));

    return { success: true, comments: formattedComments };
  } catch (error) {
    return { success: false, error: "댓글 조회 중 오류가 발생했습니다." };
  }
};

// 댓글 삭제
export const deleteComment = async (
  commentId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      return { success: false, error: "댓글 삭제에 실패했습니다." };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "댓글 삭제 중 오류가 발생했습니다." };
  }
};

// 댓글 수정
export const updateComment = async (
  commentId: string,
  content: string
): Promise<{ success: boolean; comment?: any; error?: string }> => {
  try {
    const { data: comment, error } = await supabase
      .from("post_comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error) {
      console.error("댓글 수정 오류:", error);
      return { success: false, error: "댓글 수정에 실패했습니다." };
    }

    // 수정된 댓글 정보에 사용자 정보 추가
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, branch, team")
      .eq("id", comment.user_id)
      .single();

    if (userError) {
      console.error("사용자 정보 조회 오류:", userError);
    }

    // 직급 정보 조회
    let positionName = "직급 미설정";
    if (userData) {
      const { data: positionData, error: positionError } = await supabase
        .from("user_positions")
        .select("positions!user_positions_position_id_fkey(name)")
        .eq("user_id", comment.user_id)
        .single();

      if (!positionError && (positionData as any)?.positions?.name) {
        positionName = (positionData as any).positions.name;
      } else if ((userData as any).position) {
        positionName = (userData as any).position;
      }
    }

    const commentWithUser = {
      ...comment,
      user_name: userData?.name || "알 수 없음",
      user_position: positionName,
      user_team: userData?.team || "팀 미설정",
    };

    return { success: true, comment: commentWithUser };
  } catch (error) {
    console.error("댓글 수정 중 오류:", error);
    return { success: false, error: "댓글 수정 중 오류가 발생했습니다." };
  }
};

// 홈페이지용 게시글 인터페이스
interface HomePagePost {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  author: string;
  position: string;
  branch: string;
  team: string;
}

// 최근 게시글 조회 (메인 페이지용)
export const getRecentPosts = async (
  limit: number = 5
): Promise<{ success: boolean; posts?: HomePagePost[]; error?: string }> => {
  try {
    console.log("getRecentPosts 시작 - limit:", limit);

    // 먼저 posts 테이블의 구조를 확인
    console.log("posts 테이블 구조 확인 중...");
    const { data: tableInfo, error: tableError } = await supabase
      .from("posts")
      .select("*")
      .limit(1);

    if (tableError) {
      console.error("posts 테이블 구조 확인 오류:", tableError);
      return {
        success: false,
        error: `테이블 구조 확인 실패: ${tableError.message}`,
      };
    }

    console.log("posts 테이블 구조:", tableInfo);

    // 테이블 구조에서 실제 필드명 확인
    if (tableInfo && tableInfo.length > 0) {
      const firstPost = tableInfo[0];
      console.log("첫 번째 게시글의 모든 필드:", Object.keys(firstPost));

      // author_id 또는 user_id 필드가 있는지 확인
      const hasAuthorId = "author_id" in firstPost;
      const hasUserId = "user_id" in firstPost;
      console.log(
        "필드 존재 여부 - author_id:",
        hasAuthorId,
        "user_id:",
        hasUserId
      );
    }

    // posts 테이블에서 게시글 조회 (모든 필드 선택)
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    console.log("posts 테이블 조회 결과:", { posts, error });

    if (error) {
      console.error("posts 조회 오류:", error);
      return { success: false, error: `게시글 조회 실패: ${error.message}` };
    }

    if (!posts || posts.length === 0) {
      console.log("게시글이 없습니다.");
      return { success: true, posts: [] };
    }

    console.log("조회된 게시글 수:", posts.length);

    // 각 게시글에 대해 사용자 정보를 별도로 조회
    const postsWithUserInfo = await Promise.all(
      posts.map(async (post) => {
        try {
          console.log("게시글 처리 중:", post);

          // 실제 테이블 구조에 맞는 필드명 사용
          // author_id, user_id, 또는 다른 필드명일 수 있음
          const authorId =
            post.author_id || post.user_id || post.author || post.user;
          console.log("작성자 ID (시도한 필드들):", {
            author_id: post.author_id,
            user_id: post.user_id,
            author: post.author,
            user: post.user,
            "최종 선택": authorId,
          });

          if (!authorId) {
            console.warn("작성자 ID를 찾을 수 없습니다:", post);
            return {
              id: post.id,
              title: post.title,
              content: post.content,
              category: post.category,
              created_at: post.created_at,
              author: "작성자 정보 없음",
              position: "직급 미설정",
              branch: "지점 미설정",
              team: "팀 미설정",
            } as HomePagePost;
          }

          // 사용자 정보 조회
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("name, branch, team")
            .eq("id", authorId)
            .single();

          if (userError) {
            console.warn("사용자 정보 조회 실패:", userError);
          }

          // 직급 정보 조회
          const { data: positionData, error: positionError } = await supabase
            .from("user_positions")
            .select("position_id")
            .eq("user_id", authorId)
            .single();

          if (positionError) {
            console.warn("직급 정보 조회 실패:", positionError);
          }

          let positionName = "직급 미설정";
          if (positionData?.position_id) {
            const { data: masterData, error: masterError } = await supabase
              .from("positions")
              .select("name")
              .eq("id", positionData.position_id)
              .single();

            if (masterError) {
              console.warn("직급 마스터 조회 실패:", masterError);
            }

            if (masterData?.name) {
              positionName = masterData.name;
            }
          }

          const result = {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            created_at: post.created_at,
            author: userData?.name || "알 수 없음",
            position: positionName,
            branch: userData?.branch || "지점 미설정",
            team: userData?.team || "팀 미설정",
          } as HomePagePost;

          console.log("처리된 게시글:", result);
          return result;
        } catch (error) {
          console.error("게시글 처리 중 오류:", error);
          return {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            created_at: post.created_at,
            author: "알 수 없음",
            position: "직급 미설정",
            branch: "지점 미설정",
            team: "팀 미설정",
          } as HomePagePost;
        }
      })
    );

    console.log("최종 처리된 게시글:", postsWithUserInfo);
    return { success: true, posts: postsWithUserInfo };
  } catch (error) {
    console.error("getRecentPosts 전체 오류:", error);
    return {
      success: false,
      error: `최근 게시글 조회 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};

// 테스트용 게시글 생성 (디버깅용)
export const createTestPost = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // 먼저 사용자가 있는지 확인
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (usersError || !users || users.length === 0) {
      return { success: false, error: "사용자가 없습니다." };
    }

    const userId = users[0].id;

    // 테스트 게시글 생성
    const { error: insertError } = await supabase.from("posts").insert({
      title: "테스트 게시글",
      content: "이것은 테스트 게시글입니다.",
      author_id: userId,
      category: "공지사항",
      is_pinned: false,
    });

    if (insertError) {
      console.error("테스트 게시글 생성 오류:", insertError);
      return { success: false, error: "테스트 게시글 생성에 실패했습니다." };
    }

    return { success: true };
  } catch (error) {
    console.error("테스트 게시글 생성 중 오류:", error);
    return {
      success: false,
      error: "테스트 게시글 생성 중 오류가 발생했습니다.",
    };
  }
};
