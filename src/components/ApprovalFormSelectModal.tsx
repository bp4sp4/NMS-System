"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Search, Folder, FileText, Star, Plus } from "lucide-react";
import styles from "./ApprovalFormSelectModal.module.css";

interface FormField {
  name: string;
  type: "text" | "date" | "number" | "select" | "textarea" | "file";
  label: string;
  required: boolean;
  options?: string[];
}

interface ApprovalStep {
  order: number;
  approverType: string;
  required: boolean;
}

interface FormTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: FormField[];
  approval_flow: ApprovalStep[];
  required_attachments: string[];
  is_active: boolean;
  sort_order: number;
}

interface ApprovalFormSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: FormTemplate) => void;
  userBranch?: string;
  userId?: string;
}

export default function ApprovalFormSelectModal({
  isOpen,
  onClose,
  onSelect,
  userBranch = "전체",
  userId,
}: ApprovalFormSelectModalProps) {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FormTemplate[]>(
    []
  );
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [favoriteForms, setFavoriteForms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // 부서별 필터링된 양식 로드
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadFavoriteForms();
    }
  }, [isOpen, userBranch]);

  // 검색어에 따른 필터링
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTemplates(filtered);
    }
  }, [searchTerm, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("approval_form_templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // 부서별 필터링 로직
      let filteredData = data || [];

      // 브랜드마케팅본부는 고객 관련 양식 우선 표시
      if (userBranch === "브랜드마케팅본부") {
        filteredData = filteredData.filter(
          (template) =>
            template.category === "고객" ||
            template.category === "마케팅" ||
            template.name.includes("할인") ||
            template.name.includes("마케팅")
        );
      }
      // 인사팀은 인사 관련 양식 우선 표시
      else if (userBranch === "인사팀") {
        filteredData = filteredData.filter(
          (template) =>
            template.category === "인사" ||
            template.name.includes("휴가") ||
            template.name.includes("출장") ||
            template.name.includes("인사")
        );
      }
      // 경영지원본부는 비용 관련 양식 우선 표시
      else if (userBranch === "경영지원본부") {
        filteredData = filteredData.filter(
          (template) =>
            template.category === "비용" ||
            template.name.includes("구매") ||
            template.name.includes("경비") ||
            template.name.includes("정산")
        );
      }

      setTemplates(filteredData);
      setFilteredTemplates(filteredData);

      // 카테고리 자동 확장
      const categories = new Set(filteredData.map((t) => t.category));
      setExpandedCategories(categories);
    } catch (error) {
      console.error("양식 템플릿 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteForms = async () => {
    try {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_favorite_forms")
        .select("template_id")
        .eq("user_id", userId);

      if (error) throw error;

      const favoriteIds = new Set(data?.map((item) => item.template_id) || []);
      setFavoriteForms(favoriteIds);
    } catch (error) {
      console.error("즐겨찾기 로드 오류:", error);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleFavorite = async (templateId: string) => {
    try {
      if (!userId) return;

      const isFavorite = favoriteForms.has(templateId);

      if (isFavorite) {
        // 즐겨찾기 제거
        const { error } = await supabase
          .from("user_favorite_forms")
          .delete()
          .eq("user_id", userId)
          .eq("template_id", templateId);

        if (error) throw error;

        const newFavorites = new Set(favoriteForms);
        newFavorites.delete(templateId);
        setFavoriteForms(newFavorites);
      } else {
        // 즐겨찾기 추가
        const { error } = await supabase.from("user_favorite_forms").insert({
          user_id: userId,
          template_id: templateId,
        });

        if (error) throw error;

        const newFavorites = new Set(favoriteForms);
        newFavorites.add(templateId);
        setFavoriteForms(newFavorites);
      }
    } catch (error) {
      console.error("즐겨찾기 토글 오류:", error);
    }
  };

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "인사":
        return "👥";
      case "업무":
        return "💼";
      case "비용":
        return "💰";
      case "고객":
        return "👤";
      case "마케팅":
        return "📢";
      default:
        return "📄";
    }
  };

  const getCategoryTemplates = (category: string) => {
    return filteredTemplates.filter(
      (template) => template.category === category
    );
  };

  const categories = Array.from(
    new Set(filteredTemplates.map((t) => t.category))
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>결재양식 선택</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.leftPanel}>
            <div className={styles.searchSection}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="양식제목"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <button className={styles.searchButton}>
                  <Search size={16} />
                </button>
              </div>
              <button className={styles.addFavoriteButton}>
                <Plus size={16} />
                자주 쓰는 양식으로 추가
              </button>
            </div>

            <div className={styles.formTree}>
              <div className={styles.treeItem}>
                <div className={styles.treeHeader}>
                  <span className={styles.treeIcon}>📁</span>
                  <span className={styles.treeLabel}>양식</span>
                </div>

                {loading ? (
                  <div className={styles.loading}>양식을 불러오는 중...</div>
                ) : (
                  <div className={styles.treeContent}>
                    {categories.map((category) => {
                      const categoryTemplates = getCategoryTemplates(category);
                      const isExpanded = expandedCategories.has(category);

                      return (
                        <div key={category} className={styles.categoryGroup}>
                          <div
                            className={styles.categoryHeader}
                            onClick={() => toggleCategory(category)}
                          >
                            <span className={styles.categoryIcon}>
                              {isExpanded ? "📂" : "📁"}
                            </span>
                            <span className={styles.categoryLabel}>
                              {category}
                            </span>
                            <span className={styles.categoryCount}>
                              ({categoryTemplates.length})
                            </span>
                          </div>

                          {isExpanded && (
                            <div className={styles.templateList}>
                              {categoryTemplates.map((template) => (
                                <div
                                  key={template.id}
                                  className={`${styles.templateItem} ${
                                    selectedTemplate?.id === template.id
                                      ? styles.selected
                                      : ""
                                  }`}
                                  onClick={() => setSelectedTemplate(template)}
                                >
                                  <span className={styles.templateIcon}>
                                    <FileText size={16} />
                                  </span>
                                  <span className={styles.templateName}>
                                    {template.name}
                                  </span>
                                  <button
                                    className={`${styles.favoriteButton} ${
                                      favoriteForms.has(template.id)
                                        ? styles.favorited
                                        : ""
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(template.id);
                                    }}
                                  >
                                    <Star size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.rightPanel}>
            <h3 className={styles.detailTitle}>상세정보</h3>
            {selectedTemplate ? (
              <div className={styles.detailContent}>
                <div className={styles.detailField}>
                  <label>제목</label>
                  <div className={styles.detailValue}>
                    {selectedTemplate.name}
                  </div>
                </div>
                <div className={styles.detailField}>
                  <label>전사문서함</label>
                  <div className={styles.detailValue}>
                    {selectedTemplate.category}
                  </div>
                </div>
                <div className={styles.detailField}>
                  <label>보존연한</label>
                  <div className={styles.detailValue}>5년</div>
                </div>
                <div className={styles.detailField}>
                  <label>기안부서</label>
                  <select className={styles.detailSelect}>
                    <option value={userBranch}>{userBranch}</option>
                    <option value="전체">전체</option>
                  </select>
                </div>
                <div className={styles.detailField}>
                  <label>부서문서함</label>
                  <select className={styles.detailSelect}>
                    <option value="미지정">미지정</option>
                    <option value={userBranch}>{userBranch}</option>
                  </select>
                </div>
                <div className={styles.detailField}>
                  <label>설명</label>
                  <div className={styles.detailValue}>
                    {selectedTemplate.description}
                  </div>
                </div>
                <div className={styles.detailField}>
                  <label>필수 첨부서류</label>
                  <div className={styles.attachmentsList}>
                    {selectedTemplate.required_attachments.map(
                      (attachment, index) => (
                        <span key={index} className={styles.attachmentTag}>
                          {attachment}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.noSelection}>
                왼쪽에서 양식을 선택해주세요.
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.confirmButton}
            onClick={handleSelect}
            disabled={!selectedTemplate}
          >
            확인
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
