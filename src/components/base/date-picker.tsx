import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

export interface DatePickerProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      id,
      label,
      placeholder = "اختر التاريخ",
      value = "",
      onChange,
      error,
      className,
      disabled,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value);
    const [isClient] = useState(() => typeof window !== "undefined");
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(() => {
      if (value) {
        const date = new Date(value);
        return date.getMonth();
      }
      return now.getMonth();
    });
    const [currentYear, setCurrentYear] = useState(() => {
      if (value) {
        const date = new Date(value);
        return date.getFullYear();
      }
      return now.getFullYear();
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const prevSelectedDateRef = useRef<string>(value || "");

    // Update current month/year when selectedDate changes from props
    // Use a ref to track previous value and defer updates to avoid cascading renders
    useEffect(() => {
      if (selectedDate && selectedDate !== prevSelectedDateRef.current) {
        const date = new Date(selectedDate);
        // Defer state updates to next frame to avoid cascading renders
        const timeoutId = setTimeout(() => {
          setCurrentMonth(date.getMonth());
          setCurrentYear(date.getFullYear());
        }, 0);
        prevSelectedDateRef.current = selectedDate;
        return () => clearTimeout(timeoutId);
      }
    }, [selectedDate]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        calendar: "gregory",
        numberingSystem: "latn", // Use Latin numerals (1, 2, 3...)
      };
      return date.toLocaleDateString("en-SA", options);
    };

    const handleDateSelect = (dateString: string) => {
      setSelectedDate(dateString);
      onChange?.(dateString);
      setIsOpen(false);
    };

    const handleToday = () => {
      const today = new Date().toISOString().split("T")[0];
      handleDateSelect(today);
    };

    const handleClear = () => {
      setSelectedDate("");
      onChange?.("");
      setIsOpen(false);
    };

    const handleDirectDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleDateSelect(e.target.value);
    };

    // Calendar generation functions
    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
      return new Date(year, month, 1).getDay();
    };

    const generateCalendarDays = () => {
      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
      const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
      const days = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = new Date(currentYear, currentMonth, day)
          .toISOString()
          .split("T")[0];
        const isSelected = selectedDate === dateString;
        const isToday = dateString === new Date().toISOString().split("T")[0];

        days.push({
          day,
          dateString,
          isSelected,
          isToday,
        });
      }

      return days;
    };

    const monthNames = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];

    const dayNames = [
      "أحد",
      "اثنين",
      "ثلاثاء",
      "أربعاء",
      "خميس",
      "جمعة",
      "سبت",
    ];

    const handlePrevMonth = () => {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    };

    const handleNextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    };

    const calendarDays = generateCalendarDays();

    // Show loading state during hydration
    if (!isClient) {
      return (
        <div className="w-full flex flex-col items-start">
          {label && (
            <label className="mb-1 text-[14px] font-normal text-[#231f20]">
              {label}
            </label>
          )}
          <div className="w-full h-10 bg-gray-100 rounded-md animate-pulse" />
          {error && (
            <span className="text-[12px] font-normal mt-1 text-[#f75555]">
              {error}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col items-start" dir="rtl" lang="ar">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "mb-1 text-[14px] font-normal text-[#231f20]",
              error && "text-[#f75555]"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative w-full" ref={containerRef}>
          <div
            className={cn(
              "flex items-center gap-2 w-full rounded-md border bg-white px-3 py-2 text-sm text-[#231f20] placeholder:text-[#6b7280] min-h-[40px] transition-colors duration-200 cursor-pointer",
              error
                ? "border-[#f75555] focus-within:border-[#f75555] focus-within:ring-2 focus-within:ring-red-100"
                : "border-[#e5e7eb] focus-within:border-[#ce1432] focus-within:ring-2 focus-within:ring-red-100 hover:border-[#ce1432]",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <Icons.calendar className="w-4 h-4 text-gray-400 order-3" />
            <span
              className={cn(
                "flex-1 text-right",
                !selectedDate && "text-[#6b7280]"
              )}
            >
              {selectedDate ? formatDate(selectedDate) : placeholder}
            </span>
            <Icons.chevronDown
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform duration-200 order-first",
                isOpen && "rotate-180"
              )}
            />
          </div>

          {/* Hidden input for form submission */}
          <input
            ref={ref}
            type="hidden"
            value={selectedDate}
            onChange={() => {}}
          />

          {isOpen && (
            <div
              className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-80"
              dir="rtl"
              lang="ar"
            >
              {/* Header */}
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-(--silver)">
                    اختر التاريخ
                  </h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={handleToday}
                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                    >
                      اليوم
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                      مسح
                    </button>
                  </div>
                </div>

                {/* Month/Year Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Icons.chevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                  <span className="text-sm font-medium">
                    {monthNames[currentMonth]}{" "}
                    {currentYear.toLocaleString("en-US")}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Icons.chevronDown className="w-4 h-4 rotate-90" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-3">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="text-xs text-center text-gray-500 py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <div key={index} className="aspect-square">
                      {day ? (
                        <button
                          type="button"
                          onClick={() => handleDateSelect(day.dateString)}
                          className={cn(
                            "w-full h-full text-xs rounded hover:bg-gray-100 transition-colors",
                            day.isSelected &&
                              "bg-[#ce1432] text-white hover:bg-[#a70a25]",
                            day.isToday &&
                              !day.isSelected &&
                              "bg-blue-100 text-blue-600",
                            "flex items-center justify-center"
                          )}
                        >
                          {day.day}
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Date Input */}
              <div className="p-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2 text-right">
                  أو أدخل التاريخ مباشرة:
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDirectDateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ce1432] focus:border-transparent text-sm"
                  dir="ltr"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <span className="text-[12px] font-normal mt-1 text-[#f75555]">
            {error}
          </span>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
