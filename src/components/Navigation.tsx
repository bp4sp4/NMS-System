"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    // Force page refresh to clear any cached state
    window.location.href = "/auth/login";
  };

  const menuItems = [
    { href: "/dashboard", label: "홈" },
    { href: "/ranking", label: "순위" },
    { href: "/crm", label: "CRM" },
    { href: "/settlement", label: "정산" },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* 로고 */}
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                한평생 eduvisor
              </span>
            </div>

            {/* 메뉴 아이템 */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 사용자 정보 및 로그아웃 */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{user?.branch}</span>
            <span className="text-sm text-gray-500">{user?.team}</span>
            <span className="text-sm font-medium text-gray-900">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
