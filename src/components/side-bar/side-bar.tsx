import { sideLink } from "@/constant";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Icons } from "@/lib/icons";
import { useAuth } from "@/hook/use-auth";
import { tokenUtils } from "@/lib/token-utils";

const SideBar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { logout, isLoggingOut } = useAuth();

  // Filter links based on user role using useMemo to avoid setState in effect
  const links = useMemo(() => {
    const user = tokenUtils.getUser();
    if (user?.UserType === "DataEntry" || user?.UserType === "Rep_DataEntry") {
      return sideLink.filter(
        (link) => link.href === "/products" || link.href === "/doctors"
      );
    }
    return sideLink;
  }, []);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isOpen]);

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 right-4 z-60 p-2 bg-(--primary-300) text-white rounded-md shadow-lg lg:hidden"
        >
          <Icons.menu size={20} />
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/20 bg-opacity-50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={cn(
          "bg-(--white) h-screen px-4 py-7 shadow-lg shadow-black-100/70 transition-all duration-300 flex flex-col",
          // Desktop styles
          "lg:w-[300px] lg:relative lg:translate-x-0 lg:z-10",
          // Mobile styles
          isMobile && [
            "fixed top-0 right-0 w-[280px] z-55",
            isOpen ? "translate-x-0" : "translate-x-full",
          ]
        )}
      >
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 left-4 p-1 text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <Icons.close size={20} />
          </button>
        )}
        <div className="mx-auto mb-8 size-32">
          <img
            className=" size-full object-contain"
            src={"/assets/images/image.png"}
            alt="logo"
          />
        </div>

        <ul className="flex flex-col items-start gap-4.5 flex-1">
          {links.map((link) => (
            <Link
              className={cn(
                "flex items-center w-full gap-2 py-2.5 px-3 rounded-md duration-300 font-medium capitalize",
                pathname === link.href && "bg-(--primary-300)",
                pathname !== link.href && "hover:bg-[#e9e9e966]"
              )}
              key={link.text}
              to={link.href}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <img
                className={cn(
                  "w-[18px] h-[18px]",
                  pathname === link.href && "brightness-0 invert-[1]"
                )}
                src={link.icons}
                alt="links-side"
              />
              <span
                className={cn(
                  "text-sm text-(--black-300)",
                  pathname === link.href && "text-(--white)"
                )}
              >
                {link.text}
              </span>
            </Link>
          ))}
        </ul>

        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              logout();
              if (isMobile) setIsOpen(false);
            }}
            disabled={isLoggingOut}
            className={cn(
              "flex items-center w-full gap-2 py-2.5 px-3 rounded-md duration-300 font-medium text-sm text-red-600 hover:bg-red-50 transition-colors",
              isLoggingOut && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icons.logout size={18} />
            <span>
              {isLoggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SideBar;
