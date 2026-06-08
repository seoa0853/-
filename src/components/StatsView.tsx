/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Award, Star, Heart, CheckCircle2, ChevronRight, HelpCircle, Flame } from 'lucide-react';
import { Friend, DateAvailability, AvailabilityStatus, DayStatus } from '../types.ts';
import { getDateSummary } from '../utils.ts';

interface StatsViewProps {
  friends: Friend[];
  availability: DateAvailability;
  currentYear: number;
  currentMonth: number;
  onSelectDate: (dateStr: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  friends,
  availability,
  currentYear,
  currentMonth,
  onSelectDate,
}) => {
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  const goldenDates: Array<{ dateStr: string; dateObj: Date }> = [];
  const nearDates: Array<{ dateStr: string; dateObj: Date; availableFriends: string[]; missingFriends: string[] }> = [];

  // 현재 월의 모든 날짜 분석
  Object.entries(availability).forEach(([dateStr, dayStatus]) => {
    if (dateStr.startsWith(currentMonthPrefix)) {
      const summary = getDateSummary(dayStatus as DayStatus, friends);
      const dateParts = dateStr.split('-');
      const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

      if (summary.isAllAvailable) {
        goldenDates.push({ dateStr, dateObj: d });
      } else if (summary.availableCount > 0 && summary.availableCount === friends.length - 1 && summary.unavailableCount === 0) {
        // 총원 N명 중 (N-1)명이 가능하고 불가능 체크한 사람이 없는 경우 (단 1명만 답변하면 골든 약속일!)
        nearDates.push({
          dateStr,
          dateObj: d,
          availableFriends: summary.listAvailable,
          missingFriends: summary.listNone,
        });
      }
    }
  });

  // 날짜 오름차순 정렬
  goldenDates.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  nearDates.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const formatShortDate = (d: Date) => {
    const daysKo = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${daysKo[d.getDay()]})`;
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-[32px] border-4 sm:border-8 border-brand-primary shadow-2xl p-4 sm:p-6 flex flex-col gap-6" id="stats-card">
      <div>
        <h3 className="text-xl font-black text-brand-primary flex items-center gap-2">
          <Award className="h-6 w-6 text-brand-warning fill-brand-warning" />
          <span>우리의 최적 약속 후보 날짜</span>
        </h3>
        <p className="text-xs text-brand-primary/65 mt-1 font-bold">
          현재 조율된 달력 데이터를 바탕으로 성사 확률이 높은 날짜를 선정합니다.
        </p>
      </div>

      {/* 1. 모두 가능한 날 (황금 약속 시간) */}
      <div className="flex-1">
        <h4 className="text-sm font-black text-brand-primary flex items-center gap-1.5 mb-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-warning text-brand-primary border border-brand-primary">
            <Star className="h-3 w-3 fill-current" />
          </span>
          <span>모두 모일 수 있는 날 ({goldenDates.length}곳)</span>
        </h4>

        {goldenDates.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 max-h-[180px] overflow-y-auto pr-1">
            {goldenDates.map((item) => (
              <motion.button
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className="w-full flex items-center justify-between text-left p-3.5 rounded-2xl bg-brand-warning border-2 border-brand-primary cursor-pointer transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-brand-warning text-xs font-black shadow-sm">
                    축!
                  </span>
                  <div>
                    <span className="text-sm font-black text-brand-primary">{formatShortDate(item.dateObj)}</span>
                    <p className="text-[10px] text-brand-primary/80 mt-0.5 font-bold">전원 가능 ∙ 강력 추천 약속일</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-brand-primary">
                  <span>선택</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border-4 border-dashed border-brand-primary/45 bg-white text-center flex flex-col items-center justify-center">
            <HelpCircle className="h-8 w-8 text-brand-primary/30 mb-2" />
            <p className="text-xs text-brand-primary/65 font-bold leading-relaxed">
              멤버 전원이 비어있는 노란색 날짜가 아직 없습니다.<br />
              친구별로 가능한 일정을 캘린더에 기입해 보세요!
            </p>
          </div>
        )}
      </div>

      {/* 2. 거의 성공한 날 (아쉬운 후보) */}
      <div className="border-t-4 border-brand-primary pt-5">
        <h4 className="text-sm font-black text-brand-primary flex items-center gap-1.5 mb-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-secondary/20 text-brand-secondary border border-brand-primary">
            <Flame className="h-3 w-3 fill-current" />
          </span>
          <span>거의 다 맞춘 후보 날 ({nearDates.length}곳)</span>
        </h4>

        {nearDates.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {nearDates.map((item) => (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className="w-full text-left p-3.5 rounded-2xl bg-brand-secondary/10 hover:bg-brand-secondary/15 border-2 border-brand-primary cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-brand-primary font-sans">{formatShortDate(item.dateObj)}</span>
                  <span className="text-[10px] bg-brand-secondary text-white font-black px-2 py-0.5 rounded-lg border border-brand-primary/20">
                    {friends.length - 1}명 가능
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 items-center text-[10px] text-brand-primary/80 font-bold">
                  <span className="text-brand-success font-black">{item.availableFriends.join(', ')}</span>
                  <span>가능함 ∙</span>
                  <span className="text-brand-secondary font-black underline bg-white px-1.5 py-0.5 rounded border border-brand-primary/20">{item.missingFriends.join(', ')}</span>
                  <span>님의 조율만 완료되면 황금일!</span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-primary/65 leading-relaxed text-center bg-white border-2 border-brand-primary/20 p-4 rounded-xl font-bold">
            {friends.length - 1}명 참여 대기 후보 날짜가 없습니다.
          </p>
        )}
      </div>

      {/* 3. 소모임 팁 */}
      <div className="bg-brand-secondary border-4 border-brand-primary rounded-2xl p-4 text-white shadow-lg mt-auto">
        <p className="text-xs font-black flex items-center gap-1.5">
          <Heart className="h-4 w-4 fill-current text-white" />
          <span>우리의 약속 규칙 Tip</span>
        </p>
        <p className="text-[11px] text-white/95 leading-relaxed mt-2 font-bold">
          완벽한 매칭이 없을 때는 "거의 전원 가능" 목록에서 1순위 타협 후보를 정하고 메신저(카카오톡 등)에서 한 명의 친구 일정을 끌어 주면 조율이 훨씬 빨라집니다!
        </p>
      </div>

    </div>
  );
};
