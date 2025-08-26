"use client";

import Header from "@/components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">홈입니다</h1>
          <p className="text-gray-600">
            한평생 eduvisor 시스템에 오신 것을 환영합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
