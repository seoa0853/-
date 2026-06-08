/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, Star, Info, RefreshCw, Sparkles } from 'lucide-react';
import { Friend, AvailabilityStatus, DateAvailability, DayStatus } from '../types.ts';
import { getCalendarGrid, WEEK_DAYS_KO, formatDateString, getDateSummary } from '../utils.ts';

interface CalendarViewProps {
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  friends: Friend[];
  activeFriendId: string; // 'all' (종합보기) 또는 특정 친구 ID
  availability: DateAvailability;
  selectedDateStr: string | null;
  onSelectDate: (dateStr: string) => void;
  onToggleCellDirect: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  friends,
  activeFriendId,
  availability,
  selectedDateStr,
  onSelectDate,
  onToggleCellDirect,
}) => {
  const gridCells = getCalendarGrid(currentYear, currentMonth);

  // 월 한글 텍스트
  const monthNamesKo = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // 각 친구별 한글 이름 매칭
  const activeFriendName = activeFriendId === 'all' 
    ? '전체 종합 현황' 
    : (friends.find(f => f.id === activeFriendId)?.name || '나');

  return (
    <div className="bg-white rounded-[32px] border-8 border-brand-primary shadow-2xl p-6 sm:p-8" id="calendar-card">
      
      {/* 캘린더 상단 상호작용 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-4 border-brand-primary">
        <div>
          <h2 className="text-3xl font-black text-brand-primary flex items-center gap-2 tracking-tight">
            <Calendar className="h-7 w-7 text-brand-secondary" />
            <span>{currentYear}년 {monthNamesKo[currentMonth]}</span>
          </h2>
          <p className="text-xs text-brand-primary/60 mt-1 flex items-center gap-1.5 font-bold">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              activeFriendId === 'all' 
                ? 'bg-brand-warning text-brand-primary border border-brand-primary' 
                : 'bg-brand-secondary text-white'
            }`}>
              {activeFriendId === 'all' ? '종합 모드' : '설정 모드'}
            </span>
            <span>선택 일러스트레이터: </span>
            <strong className="text-brand-primary font-black underline decoration-brand-secondary decoration-2">{activeFriendName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <button
            type="button"
            id="btn-prev-month"
            onClick={onPrevMonth}
            className="p-2 border-2 border-brand-primary rounded-xl hover:bg-brand-secondary/10 text-brand-primary cursor-pointer transition-transform duration-100 active:translate-y-0.5"
            title="이전 달"
          >
            <ChevronLeft className="h-5 w-5 stroke-[3px]" />
          </button>
          
          <button
            type="button"
            id="btn-today"
            onClick={onGoToToday}
            className="px-4 py-2 border-2 border-brand-primary text-xs font-black rounded-xl hover:bg-brand-secondary/10 text-brand-primary cursor-pointer transition-transform duration-100 active:translate-y-0.5"
          >
            오늘
          </button>
          
          <button
            type="button"
            id="btn-next-month"
            onClick={onNextMonth}
            className="p-2 border-2 border-brand-primary rounded-xl hover:bg-brand-secondary/10 text-brand-primary cursor-pointer transition-transform duration-100 active:translate-y-0.5"
            title="다음 달"
          >
            <ChevronRight className="h-5 w-5 stroke-[3px]" />
          </button>
        </div>
      </div>

      {/* 실시간 범례 설명 */}
      <div className="bg-brand-bg rounded-2xl p-4 my-5 text-xs text-brand-primary border-4 border-brand-primary">
        <p className="font-black text-brand-primary mb-2.5 flex items-center gap-1.5">
          <Info className="h-4.5 w-4.5 text-brand-secondary" />
          <span>캘린더 디자인 범례 가이드</span>
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] font-bold">
          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border-2 border-brand-primary">
            <span className="w-3.5 h-3.5 rounded-full bg-brand-success border-2 border-brand-primary block shadow-sm flex-shrink-0"></span>
            <span className="truncate">가능한 날 <b className="text-brand-success font-black">(Green)</b></span>
          </div>
          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border-2 border-brand-primary">
            <span className="w-3.5 h-3.5 rounded-full bg-brand-danger border-2 border-brand-primary block shadow-sm flex-shrink-0"></span>
            <span className="truncate">불가능 <b className="text-brand-danger font-black">(Red)</b></span>
          </div>
          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border-2 border-brand-primary">
            <span className="w-3.5 h-3.5 rounded bg-brand-warning border-2 border-brand-primary block shadow-sm flex-shrink-0 flex items-center justify-center">
              <Star className="h-2 w-2 text-brand-primary fill-brand-primary" />
            </span>
            <span className="truncate">모두 가능 <b className="text-amber-600 font-black">(Yellow)</b></span>
          </div>
          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border-2 border-brand-primary">
            <span className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-200 block shadow-sm flex-shrink-0"></span>
            <span className="truncate">미정 / 빈 날짜 <span className="text-slate-400 font-normal">(White)</span></span>
          </div>
        </div>
        
        {activeFriendId !== 'all' && (
          <p className="text-[10px] text-brand-primary font-bold mt-2.5 bg-brand-warning/20 p-2 rounded-xl border-2 border-brand-primary/40">
            💡 팁: 현재 <strong className="font-extrabold">{activeFriendName}</strong>님의 일정을 편집하는 중입니다. 날짜를 한 번 누르면 선택되고, <b>더블클릭</b>하면 [미정 ➡️ 가능 ➡️ 불가능] 순서로 즉시 기입됩니다!
          </p>
        )}
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-black uppercase tracking-wider text-brand-primary/50">
        {WEEK_DAYS_KO.map((day, i) => {
          let textColor = 'text-brand-primary/60';
          if (i === 0) textColor = 'text-brand-danger'; // 일요일 빨간색
          if (i === 6) textColor = 'text-brand-secondary'; // 토요일 파란색
          return (
            <div key={day} className={`py-2 select-none font-sans font-black ${textColor}`}>
              {day}
            </div>
          );
        })}
      </div>

      {/* 달력 본문 그리드 */}
      <div className="grid grid-cols-7 gap-1.5" id="calendar-grid">
        {gridCells.map((cell) => {
          const { dateStr, dayNumber, isCurrentMonth, isToday } = cell;
          const dayStatus: DayStatus = availability[dateStr] || {};
          const summary = getDateSummary(dayStatus, friends);

          // 선택 상태 체크
          const isSelected = selectedDateStr === dateStr;

          // 배경색, 테두리, 텍스트 글꼴 분석 결정
          let cellBgClass = 'bg-white hover:bg-slate-50 border-slate-200';
          let textClass = 'text-brand-primary';
          let tagBadge: React.ReactNode = null;

          // 모두 가능한 날은 무조건 노란색!
          if (summary.isAllAvailable) {
            cellBgClass = 'bg-brand-warning ring-4 ring-inset ring-amber-500 border-2 border-brand-primary';
            textClass = 'text-brand-primary font-black';
            tagBadge = (
              <span className="absolute top-1 right-1 p-0.5 bg-brand-primary rounded text-white shadow-sm" title="모두 가능!">
                <Star className="h-2.5 w-2.5 fill-brand-warning text-brand-warning" />
              </span>
            );
          } 
          // 종합뷰 모드일 때 한 명이라도 불가능하면 빨간색(불가능한 날)으로 보이고 가독성을 위해 흰색 글자 적용
          else if (activeFriendId === 'all' && summary.isAnyUnavailable) {
            cellBgClass = 'bg-brand-danger text-white hover:opacity-90 border-2 border-brand-primary shadow-sm';
            textClass = 'text-white font-black';
          }
          else {
            // "안되는 날은 그냥 흰색" -> 모두 가능하지 않고, 
            // 만약 친구별 개별 뷰가 켜진 상태라면
            if (activeFriendId !== 'all') {
              const statusOfActive = dayStatus[activeFriendId] || AvailabilityStatus.NONE;
              if (statusOfActive === AvailabilityStatus.AVAILABLE) {
                // 특정 사용자 가능일 -> 초록색!
                cellBgClass = 'bg-brand-success text-brand-primary hover:opacity-90 border-2 border-brand-primary shadow-sm';
                textClass = 'text-brand-primary font-black';
              } else if (statusOfActive === AvailabilityStatus.UNAVAILABLE) {
                // 특정 사용자 불가능일 -> 빨간색!
                cellBgClass = 'bg-brand-danger text-white hover:opacity-90 border-2 border-[#073B4C] shadow-sm';
                textClass = 'text-white font-black';
              } else {
                // 미정 -> 흰색!
                cellBgClass = 'bg-white hover:bg-slate-50 border-2 border-slate-200';
                textClass = isCurrentMonth ? 'text-brand-primary' : 'text-slate-300';
              }
            } else {
              // 종합뷰 모드이며, 3명 매칭이 안 됨 -> 그냥 흰색!
              cellBgClass = 'bg-white hover:bg-slate-100 border-2 border-slate-200';
              textClass = isCurrentMonth ? 'text-brand-primary' : 'text-slate-300';
            }
          }

          // 일요일 요일 텍스트 컬러 조정 (단, 풀컬러 상태 아닐 때만 적용)
          const isSun = cell.date.getDay() === 0;
          const isSat = cell.date.getDay() === 6;
          
          let dayLabelColor = textClass;
          if (!summary.isAllAvailable && !(activeFriendId === 'all' && summary.isAnyUnavailable) && (activeFriendId === 'all' || dayStatus[activeFriendId] === AvailabilityStatus.NONE)) {
            if (isSun) dayLabelColor = isCurrentMonth ? 'text-brand-danger font-black' : 'text-brand-danger/40';
            else if (isSat) dayLabelColor = isCurrentMonth ? 'text-brand-secondary font-black' : 'text-brand-secondary/40';
            else if (!isCurrentMonth) dayLabelColor = 'text-slate-300';
          }

          return (
            <motion.div
              key={dateStr}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              id={`calendar-cell-${dateStr}`}
              onClick={() => {
                // 선택 업데이트
                onSelectDate(dateStr);
              }}
              onDoubleClick={() => {
                if (activeFriendId !== 'all') {
                  onToggleCellDirect(dateStr);
                }
              }}
              className={`relative min-h-[72px] sm:min-h-[84px] p-2 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all ${cellBgClass} ${
                isSelected 
                  ? 'ring-4 ring-brand-secondary border-brand-secondary shadow-md scale-[1.01]' 
                  : ''
              } ${!isCurrentMonth ? 'opacity-40' : 'opacity-100'}`}
            >
              {/* 상단: 날짜 라벨 & 예약 매칭 왕관/별 아이콘 */}
              <div className="flex items-center justify-between">
                <span className={`text-sm sm:text-base font-sans font-black flex items-center justify-center w-6 h-6 rounded-full ${
                  isToday && !summary.isAllAvailable && (activeFriendId === 'all' || dayStatus[activeFriendId] === AvailabilityStatus.NONE)
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : dayLabelColor
                }`}>
                  {dayNumber}
                </span>

                {tagBadge}
              </div>

              {/* 하단: 3명의 개별 상태 닷(Dot) 인디케이터 */}
              <div className="flex items-center justify-center gap-1 mt-1 bg-brand-primary/5 py-1 px-1.5 rounded-lg border border-brand-primary/10">
                {friends.map((friend) => {
                  const status = dayStatus[friend.id] || AvailabilityStatus.NONE;
                  let statusDotClass = 'border-brand-primary bg-white ring-1 ring-brand-primary/20';
                  let statusTitle = `${friend.name}: 미정`;

                  if (status === AvailabilityStatus.AVAILABLE) {
                    statusDotClass = 'bg-brand-success ring-2 ring-brand-success/30 scale-110';
                    statusTitle = `${friend.name}: 가능 (초록색)`;
                  } else if (status === AvailabilityStatus.UNAVAILABLE) {
                    statusDotClass = 'bg-brand-danger ring-2 ring-brand-danger/30 scale-110';
                    statusTitle = `${friend.name}: 불가능 (빨간색)`;
                  }

                  return (
                    <div
                      key={friend.id}
                      className={`w-2.5 h-2.5 rounded-full transition-all border-2 border-brand-primary/20 ${statusDotClass}`}
                      title={statusTitle}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
