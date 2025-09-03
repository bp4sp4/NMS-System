"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Navigation";
import { getPosts, canWritePost } from "@/lib/board";
import { Post } from "@/types/board";
import { Plus, Eye, Pin, MessageSquare, Paperclip } from "lucide-react";
import styles from "./page.module.css";

export default function BoardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [canWrite, setCanWrite] = useState(false);

  const categories = ["전체", "공지사항", "업무 공지", "회사 알림", "일반"];

  // 게시글 목록 조회
  const fetchPosts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const postsData = await getPosts(
        selectedCategory === "전체" ? undefined : selectedCategory
      );
      setPosts(postsData);
    } catch (error) {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  }, [user, selectedCategory]);

  // 권한 확인
  const checkWritePermission = useCallback(async () => {
    if (!user) return;

    try {
      const hasPermission = await canWritePost(
        user.id,
        selectedCategory === "전체" ? "일반" : selectedCategory
      );
      setCanWrite(hasPermission);
    } catch (error) {
      console.error("권한 확인 오류:", error);
      setCanWrite(false);
    }
  }, [user, selectedCategory]);

  // 카테고리 변경 시
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // 글쓰기 페이지로 이동
  const handleWritePost = () => {
    const category = selectedCategory === "전체" ? "일반" : selectedCategory;
    router.push(`/board/write?category=${encodeURIComponent(category)}`);
  };

  // 게시글 상세 페이지로 이동
  const handlePostClick = (postId: string) => {
    router.push(`/board/${postId}`);
  };

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    fetchPosts();
    checkWritePermission();
  }, [isLoading, user, router, fetchPosts, checkWritePermission]);

  useEffect(() => {
    fetchPosts();
    checkWritePermission();
  }, [selectedCategory, fetchPosts, checkWritePermission]);

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className={styles.container}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h1 className={styles.title}>게시판</h1>
          {canWrite && (
            <button onClick={handleWritePost} className={styles.writeButton}>
              <Plus className="w-5 h-5" />
              <span>글쓰기</span>
            </button>
          )}
        </div>

        {/* 카테고리 탭 */}
        <div className={styles.categoryTabs}>
          <div className={styles.tabList}>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`${styles.tab} ${
                  selectedCategory === category ? styles.active : ""
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className={styles.postList}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>게시글을 불러오는 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className={styles.emptyContainer}>
              <div className={styles.emptyIcon}>📝</div>
              <p className={styles.emptyText}>아직 게시글이 없습니다</p>
              <p className={styles.emptySubtext}>
                첫 번째 게시글을 작성해보세요!
              </p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className={styles.postItem}
                >
                  {/* 게시글 헤더 */}
                  <div className={styles.postHeader}>
                    <div className={styles.postTitleSection}>
                      {post.is_pinned && (
                        <div className={styles.pinBadge}>
                          <Pin className={styles.pinIcon} />
                          <span>고정</span>
                        </div>
                      )}
                      <h3 className={styles.postTitle}>{post.title}</h3>
                    </div>
                    <div className={styles.postActions}>
                      <div className={styles.postStats}>
                        <div className={styles.postStat}>
                          <Eye className={styles.statIcon} />
                          <span className={styles.statText}>조회수</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 게시글 메타 정보 */}
                  <div className={styles.postMeta}>
                    <div className={styles.metaRow}>
                      <span
                        className={`${styles.categoryTag} ${
                          styles[`category${post.category.replace(/\s+/g, "")}`]
                        }`}
                      >
                        {post.category}
                      </span>
                      <div className={styles.authorInfo}>
                        <span className={styles.authorName}>
                          {post.user_name}
                        </span>
                        <span className={styles.authorPosition}>
                          {post.user_position}
                        </span>
                        <span className={styles.authorTeam}>
                          {post.user_team}
                        </span>
                      </div>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.postDate}>
                        {new Date(post.created_at).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* 게시글 푸터 - 통계 정보 */}
                  <div className={styles.postFooter}>
                    <div className={styles.postStats}>
                      <div className={styles.postStat}>
                        <Eye className={styles.statIcon} />
                        <span className={styles.statText}>조회수 0</span>
                      </div>

                      <div className={styles.postStat}>
                        <MessageSquare className={styles.statIcon} />
                        <span className={styles.statText}>
                          댓글 {post.comments?.length || 0}개
                        </span>
                      </div>

                      {post.attachments && post.attachments.length > 0 && (
                        <div className={styles.postStat}>
                          <Paperclip className={styles.statIcon} />
                          <span className={styles.statText}>
                            첨부파일 {post.attachments.length}개
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
