"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@/types/user";

interface ProfileAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

export default function ProfileAvatar({
  user,
  size = "md",
  showStatus = true,
}: ProfileAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // user_profiles 테이블에서 아바타 조회
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("avatar")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // 아바타가 없는 경우 기본 이미지 사용
          setAvatarUrl(null);
        } else if (profile?.avatar) {
          setAvatarUrl(profile.avatar);
        } else {
          setAvatarUrl(null);
        }
      } catch (error) {
        // 에러 발생 시 기본 이미지 사용
        setAvatarUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatar();
  }, [user?.id]);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };

  const sizeClass = sizeClasses[size];

  if (loading) {
    return (
      <div
        className={`${sizeClass} bg-gray-200 rounded-full animate-pulse`}
      ></div>
    );
  }

  if (avatarUrl) {
    return (
      <div className="relative">
        <img
          src={avatarUrl}
          alt={`${user.name}의 프로필 사진`}
          className={`${sizeClass} rounded-full object-cover shadow-lg`}
          onError={() => setAvatarUrl(null)}
        />
        {showStatus && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
        )}
      </div>
    );
  }

  // 기본 아바타 (이름 첫 글자)
  return (
    <div className="relative">
      <div
        className={`${sizeClass} bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
      >
        {user.name?.charAt(0) || "U"}
      </div>
      {showStatus && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
}
