"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Navigation";
import {
  getPostById,
  deletePost,
  deleteAttachment,
  createComment,
  deleteComment,
} from "@/lib/board";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Pin,
  X,
  MessageCircle,
  Send,
} from "lucide-react";
import { Post, PostAttachment } from "@/types/board";

export default function PostDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 파일 다운로드
  const handleDownloadFile = (attachment: PostAttachment) => {
    // 파일 다운로드 로직
    const link = document.createElement("a");
    link.href = attachment.file_path;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 첨부파일 삭제
  const handleDeleteAttachment = async (
    attachmentId: string,
    fileName: string
  ) => {
    if (!confirm(`"${fileName}" 첨부파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteAttachment(attachmentId);

      if (result.success) {
        // 로컬 상태에서 첨부파일 제거
        setPost((prev: any) =>
          prev
            ? {
                ...prev,
                attachments:
                  prev.attachments?.filter(
                    (att: any) => att.id !== attachmentId
                  ) || [],
              }
            : null
        );

        alert("첨부파일이 삭제되었습니다.");
      } else {
        alert(result.error || "첨부파일 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("첨부파일 삭제 오류:", error);
      alert("첨부파일 삭제 중 오류가 발생했습니다.");
    }
  };

  // 댓글 작성 (로그인한 사용자만 가능)
  const handleSubmitComment = async () => {
    // 로그인 상태 확인
    if (!user || isLoading) {
      alert("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    // 로컬 스토리지에서 직접 세션 확인
    const sessionData = localStorage.getItem("nms-user-session");
    const localUser = sessionData ? JSON.parse(sessionData) : null;
    const actualUser = user || localUser;

    // 사용자 ID 상세 정보 출력
    if (actualUser && actualUser.id) {
      // console.log("사용자 ID 상세:", {
      //   id: actualUser.id,
      //   type: typeof actualUser.id,
      //   length: actualUser.id.length,
      //   isString: typeof actualUser.id === "string",
      //   isValid:
      //     actualUser.id &&
      //     typeof actualUser.id === "string" &&
      //     actualUser.id.length >= 10,
      // });
    }

    // 로그인 상태 재확인
    if (!actualUser || !actualUser.id) {
      alert("로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    if (!commentContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmittingComment(true);
      const result = await createComment(postId, {
        content: commentContent.trim(),
      });

      if (result.success && result.comment) {
        // console.log("댓글 작성 성공:", result.comment);

        // 댓글 목록에 새 댓글 추가
        setPost((prev: any) =>
          prev
            ? {
                ...prev,
                comments: [...(prev.comments || []), result.comment],
              }
            : null
        );

        // 댓글 입력창 초기화
        setCommentContent("");
        alert("댓글이 작성되었습니다.");

        // 작성 후 댓글 목록 상태 확인
        // console.log("댓글 작성 후 post 상태:", {
        //   comments: [...(post?.comments || []), result.comment],
        // });
      } else {
        // console.error("댓글 작성 실패:", result.error);
        alert(result.error || "댓글 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert("댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // 댓글 수정 시작
  const handleStartEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  // 댓글 수정 취소
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  // 댓글 수정 완료
  const handleUpdateComment = async () => {
    if (!editingCommentContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      // 실제 수정 API는 나중에 구현
      // 현재는 로컬 상태만 업데이트
      setPost((prev: any) =>
        prev
          ? {
              ...prev,
              comments:
                prev.comments?.map((comment: any) =>
                  comment.id === editingCommentId
                    ? { ...comment, content: editingCommentContent.trim() }
                    : comment
                ) || [],
            }
          : null
      );

      setEditingCommentId(null);
      setEditingCommentContent("");
      alert("댓글이 수정되었습니다.");
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const result = await deleteComment(commentId);

      if (result.success) {
        // 로컬 상태에서 댓글 제거
        setPost((prev: any) =>
          prev
            ? {
                ...prev,
                comments:
                  prev.comments?.filter(
                    (comment: any) => comment.id !== commentId
                  ) || [],
              }
            : null
        );

        alert("댓글이 삭제되었습니다.");
      } else {
        alert(result.error || "댓글 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  // 게시글 조회
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const postData = await getPostById(postId);

        if (postData) {
          setPost(postData);
          // 작성자 여부 확인
          setIsAuthor(user?.id === postData.user_id);
        } else {
          alert("게시글을 찾을 수 없습니다.");
          router.push("/board");
        }
      } catch (error) {
        console.error("게시글 조회 오류:", error);
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
        router.push("/board");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPost();
    }
  }, [postId, user, router]);

  // 디버깅: 로그인 상태 확인
  useEffect(() => {
    // 로컬 스토리지에서 직접 세션 확인
    const sessionData = localStorage.getItem("nms-user-session");
    const localUser = sessionData ? JSON.parse(sessionData) : null;

    // console.log("로그인 상태:", {
    //   user: user ? { id: user.id, email: user.email } : null,
    //   isLoading,
    //   userExists: !!user,
    //   userType: typeof user,
    //   userKeys: user ? Object.keys(user) : [],
    //   localStorageSession: localUser,
    //   localStorageExists: !!localUser,
    // });
  }, [user, isLoading]);

  // 수정 페이지로 이동
  const handleEdit = () => {
    router.push(`/board/${postId}/edit`);
  };

  // 삭제
  const handleDelete = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setDeleting(true);

      // 삭제 API 호출 (board.ts에 추가 필요)
      const result = await deletePost(postId);

      if (result.success) {
        alert("게시글이 삭제되었습니다.");
        router.push("/board");
      } else {
        alert(result.error || "게시글 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 뒤로 가기
  const handleBack = () => {
    router.push("/board");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">게시글을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">게시글</h1>
          </div>

          {/* 수정/삭제 버튼 */}
          {isAuthor && (
            <div className="flex space-x-3">
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>수정</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>삭제</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 게시글 내용 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 게시글 헤더 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {post.is_pinned && <Pin className="w-5 h-5 text-red-500" />}
                  <h2 className="text-2xl font-bold text-gray-900">
                    {post.title}
                  </h2>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>작성자:</span>
                  <span className="font-medium">
                    {post.user_name} {post.user_position}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{post.user_team}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>작성일:</span>
                  <span>
                    {new Date(post.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>조회수 {post.view_count}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 게시글 본문 */}
          <div className="p-6">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {post.content}
              </div>
            </div>

            {/* 첨부파일 표시 */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  첨부파일
                </h3>
                <div className="space-y-3">
                  {post.attachments.map((attachment: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {attachment.file_name
                              .split(".")
                              .pop()
                              ?.toUpperCase() || "FILE"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.file_size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(attachment)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 댓글 섹션 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                댓글 : {post.comments?.length || 0}개
              </h3>

              {/* 댓글 목록 */}
              <div className="space-y-4 mb-6">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment: any) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* 작성자 정보 및 시간 */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              {comment.user_name}{" "}
                              {new Date(comment.created_at).toLocaleDateString(
                                "ko-KR",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )}
                            </span>
                            {/* 본인 댓글일 때만 수정/삭제 버튼 표시 */}
                            {user?.id === comment.user_id && (
                              <div className="flex space-x-2">
                                {editingCommentId === comment.id ? (
                                  <>
                                    <button
                                      onClick={handleUpdateComment}
                                      className="text-xs text-green-600 text-[#1e1e1e] hover:text-green-800 px-2 py-1 rounded hover:bg-green-50"
                                    >
                                      완료
                                    </button>
                                    <button
                                      onClick={handleCancelEditComment}
                                      className="text-xs text-gray-600 text-[#1e1e1e] hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-50"
                                    >
                                      취소
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleStartEditComment(comment)
                                      }
                                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                                    >
                                      삭제
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {/* 댓글 내용 */}
                          {editingCommentId === comment.id ? (
                            <textarea
                              value={editingCommentContent}
                              onChange={(e) =>
                                setEditingCommentContent(e.target.value)
                              }
                              className="w-full p-2 border border-gray-300 text-[#1e1e1e] rounded text-sm resize-none"
                              rows={3}
                            />
                          ) : (
                            <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    아직 댓글이 없습니다.
                    <br />
                    <span className="text-xs text-blue-500">
                      (첫 번째 댓글을 작성해보세요!)
                    </span>
                  </div>
                )}
              </div>

              {/* 댓글 작성 폼 - 로그인한 사용자만 작성 가능 */}
              {user && !isLoading ? (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex space-x-3">
                    <textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      className="flex-1 p-3 border text-[#1e1e1e] border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={3}
                      disabled={submittingComment}
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={submittingComment || !commentContent.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      등록
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-gray-600 mb-2">
                    댓글을 작성하려면 로그인이 필요합니다
                  </div>
                  <button
                    onClick={() => (window.location.href = "/auth/login")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    로그인하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
