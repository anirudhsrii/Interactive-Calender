"use client";

import React, { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isWithinInterval,
  isBefore,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Image as ImageIcon, PenLine, MountainSnow } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type NoteMap = Record<string, string>;

export default function InteractiveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<NoteMap>({});
  const [currentNote, setCurrentNote] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const savedNotes = localStorage.getItem("calendar-notes");
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Compute a stable key for selected range or day
  const activeNoteKey = selectionStart
    ? selectionEnd
      ? `${format(selectionStart, "yyyy-MM-dd")}_${format(
          selectionEnd,
          "yyyy-MM-dd"
        )}`
      : format(selectionStart, "yyyy-MM-dd")
    : null;

  useEffect(() => {
    if (activeNoteKey) {
      setCurrentNote(notes[activeNoteKey] || "");
    } else {
      setCurrentNote(notes["general"] || "");
    }
  }, [activeNoteKey, notes]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCurrentNote(val);
    const key = activeNoteKey || "general";
    const newNotes = { ...notes, [key]: val };
    setNotes(newNotes);
    localStorage.setItem("calendar-notes", JSON.stringify(newNotes));
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const onDateClick = (day: Date) => {
    if (!selectionStart) {
      // First click
      setSelectionStart(day);
      setSelectionEnd(null);
    } else if (selectionStart && !selectionEnd) {
      // Second click - handle reverse order as well
      if (isBefore(day, selectionStart)) {
        setSelectionEnd(selectionStart);
        setSelectionStart(day);
      } else {
        setSelectionEnd(day);
      }
    } else {
      // Reset
      setSelectionStart(day);
      setSelectionEnd(null);
    }
  };

  const isDaySelected = (day: Date) => {
    if (selectionStart && isSameDay(day, selectionStart)) return true;
    if (selectionEnd && isSameDay(day, selectionEnd)) return true;
    return false;
  };

  const isDayInRange = (day: Date) => {
    if (selectionStart && selectionEnd) {
      return isWithinInterval(day, {
        start: selectionStart,
        end: selectionEnd,
      });
    }
    if (selectionStart && hoverDate && !selectionEnd) {
      const start = isBefore(hoverDate, selectionStart)
        ? hoverDate
        : selectionStart;
      const end = isBefore(hoverDate, selectionStart)
        ? selectionStart
        : hoverDate;
      return isWithinInterval(day, { start, end });
    }
    return false;
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 pl-2 pr-6 border-b pb-4">
        <h2 className="text-3xl font-light tracking-tight text-slate-800 uppercase flex flex-col leading-none">
          <span className="text-sm font-semibold text-blue-500 tracking-widest pl-1 mb-1">
            {format(currentDate, "yyyy")}
          </span>
          {format(currentDate, "MMMM")}
        </h2>
        <div className="flex gap-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-blue-600"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-blue-600"
          >
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = "EE";
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          className="text-center font-medium text-xs text-slate-400 tracking-wider mb-2"
          key={i}
        >
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;

        const isSelected = isDaySelected(cloneDay);
        const inRange = isDayInRange(cloneDay);
        const isStart = selectionStart && isSameDay(cloneDay, selectionStart);
        const isEnd = selectionEnd && isSameDay(cloneDay, selectionEnd);
        const currentMonth = isSameMonth(cloneDay, monthStart);

        days.push(
          <div
            className={cn(
              "relative aspect-square flex items-center justify-center cursor-pointer transition-colors sm:text-lg text-sm rounded-full",
              !currentMonth && "text-slate-300 pointer-events-none",
              currentMonth && !inRange && "hover:bg-slate-100 text-slate-700",
              inRange && !isSelected && "bg-blue-50 text-blue-800 rounded-none",
              isStart && !isEnd && selectionEnd && "bg-blue-50 rounded-l-full rounded-r-none",
              isStart && hoverDate && !selectionEnd && isBefore(hoverDate, selectionStart) && "bg-blue-50 rounded-r-full rounded-l-none",
              isStart && hoverDate && !selectionEnd && isBefore(selectionStart, hoverDate) && "bg-blue-50 rounded-l-full rounded-r-none",
              isEnd && "bg-blue-50 rounded-r-full rounded-l-none"
            )}
            key={cloneDay.toISOString()}
            onClick={() => currentMonth && onDateClick(cloneDay)}
            onMouseEnter={() => currentMonth && setHoverDate(cloneDay)}
            onMouseLeave={() => setHoverDate(null)}
          >
            <div
              className={cn(
                "z-10 flex items-center justify-center w-full h-full rounded-full transition-all duration-300",
                isSelected && "bg-blue-600 text-white shadow-md font-medium scale-100",
                !isSelected && "scale-95"
              )}
            >
              {formattedDate}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-y-2 mb-1" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 min-h-screen bg-slate-50 flex items-center justify-center font-sans tracking-wide">
      <div className="w-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* Wall Canvas Aesthetic Top/Left */}
        <div className="md:w-5/12 relative h-64 md:h-auto min-h-\[300px\] overflow-hidden group bg-slate-200">
          <div className="absolute inset-0 .bg-gradient-to-tr from-cyan-900 to-blue-500 opacity-60 mix-blend-multiply transition-opacity group-hover:opacity-40 z-10" />
          <img
            src="https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Hero Climbing Mountain"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute top-0 left-0 w-full h-12 bg-[url('https://www.transparenttextures.com/patterns/binding-dark.png')] opacity-10" />
          <div className="absolute inset-0 z-20 flex flex-col justify-between p-8">
            <MountainSnow className="text-white/80 w-10 h-10" />
            <div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-white text-5xl font-bold tracking-tighter"
              >
                Reach
                <br />
                New Peaks
              </motion.h1>
            </div>
          </div>
          
          {/* Aesthetic ZigZag Divider line */}
          <div className="absolute bottom-0 left-0 w-full z-30 transform translate-y-1">
             <svg viewBox="0 0 1440 120" className="w-full h-auto text-white fill-current">
                <path d="M0,64L80,80C160,96,320,128,480,122.7C640,117,800,75,960,69.3C1120,64,1280,96,1360,112L1440,128L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
             </svg>
          </div>
        </div>

        {/* Calendar Selection & Notes */}
        <div className="md:w-7/12 flex flex-col sm:flex-row bg-white relative">
          
          <div className="flex-1 p-6 sm:p-10 order-2 sm:order-1 pt-10 border-r border-slate-100 border-dashed relative">
             {/* Binding coil decoration */}
             <div className="absolute -top-4 left-0 w-full flex justify-around px-8">
               {[...Array(15)].map((_,i) => <div key={i} className="w-1.5 h-6 bg-slate-300 rounded-full shadow-inner border border-slate-400"></div>)}
             </div>

            {renderHeader()}
            {renderDays()}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDate.toString()}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="min-h-\[260px\]"
              >
                {renderCells()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="sm:w-64 p-6 sm:py-10 bg-slate-50 order-1 sm:order-2 flex flex-col mt-0 sm:mt-0 shadow-[inset_1px_0_10px_rgba(0,0,0,0.02)]">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-4 flex items-center gap-2">
              <PenLine size={14} />
              Notes
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 font-medium h-4">
              {selectionStart
                ? selectionEnd
                  ? `${format(selectionStart, "MMM d")} - ${format(selectionEnd, "MMM d")}`
                  : format(selectionStart, "MMMM d, yyyy")
                : "General (No selection)"}
            </p>
            <textarea
              className="flex-1 w-full bg-transparent resize-none border-none focus:ring-0 text-slate-600 text-sm leading-relaxed p-0 outline-none placeholder:text-slate-300 custom-scrollbar"
              placeholder="Jot down notes, trips, or memos for this period..."
              value={currentNote}
              onChange={handleNoteChange}
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e2e8f0 27.5px, #e2e8f0 28px)',
                lineHeight: '28px',
                paddingTop: '6px'
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
