"use client";

import Link from "next/link";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a2e] text-white">
      <div className="p-4">
        <Link
          href="/new"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors no-underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to Twelve Cash
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center overflow-y-auto pb-8">
        {children}
      </div>
    </div>
  );
}
