import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/base/button";
import { useAuth } from "@/hook/use-auth";
import { Icons } from "@/lib/icons";
import { useMe } from "@/hook/useUser";

export default function UserMenu() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { data: user } = useMe();
  const handleLogout = () => {
    logout();
    navigate("/sign-in");
  };
  if (!user) return null;
  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-2 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 bg-[var(--primary-300)] rounded-full flex items-center justify-center text-white font-semibold">
          {user.fullName.charAt(0)}
        </div>
        <span className="hidden md:block">{user.fullName}</span>
        <Icons.chevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium text-[var(--silver)]">
              {user.fullName}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              نوع المستخدم: {user.UserType}
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <Icons.logout className="w-4 h-4 mr-2" />
            تسجيل الخروج
          </Button>
        </div>
      )}
    </div>
  );
}
