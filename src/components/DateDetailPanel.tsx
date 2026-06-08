/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, X, ClipboardSignature, UserCheck, CalendarRange, HelpCircle, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { Friend, AvailabilityStatus, DateAvailability, DayStatus } from '../types.ts';
import { getDateSummary } from '../utils.ts';

interface DateDetailPanelProps {
  selectedDateStr: string;
  friends: Friend[];
  availability: DateAvailability;
  onUpdateStatus: (friendId: string, status: AvailabilityStatus) => void;
  onUpdateNotes: (dateStr: string, notes: string) => void;
  notes: string;
  onClearDay: () => void;
}

export const DateDetailPanel: React.FC<DateDetailPanelProps> = ({
  selectedDateStr,
  friends,
  availability,
  onUpdateStatus,
  onUpdateNotes,
  notes,
  onClearDay,
}) => {
  const [localNotes, setLocalNotes] = useState(notes || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalNotes(notes || '');
    setIsSaved(false);
  }, [selectedDateStr, notes]);

  const dateParts = selectedDateStr.split('-');
  const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  
  const daysKo = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const formattedDateHeadline = `${dateParts[0]}년 ${parseInt(dateParts[1])}월 ${parseInt(dateParts[2])}일 (${daysKo[dateObj.getDay()]})`;

  const dayStatus: DayStatus = availability[selectedDateStr] || {};
  const { availableCount, unavailableCount, isAllAvailable } = getDateSummary(dayStatus, friends);

  const handleNotesSave = () => {
    onUpdateNotes(selectedDateStr, localNotes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // 한 행의 색상 매핑
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    indigo: { bg: 'bg-brand-secondary/10 border-brand-secondary/20', border: 'border-brand-secondary', text: 'text-brand-primary' },
    emerald: { bg: 'bg-brand-success/10 border-brand-success/20', border: 'border-brand-success', text: 'text-brand-primary' },
    pink: { bg: 'bg-brand-danger/10 border-brand-danger/20', border: 'border-brand-danger', text: 'text-brand-primary' },
    violet: { bg: 'bg-violet-500/10 border-violet-500/20', border: 'border-violet-500', text: 'text-brand-primary' },
    amber: { bg: 'bg-amber-500/10 border-amber-500/20', border: 'border-amber-500', text: 'text-brand-primary' },
    teal: { bg: 'bg-teal-500/10 border-teal-500/20', border: 'border-teal-500', text: 'text-brand-primary' },
    cyan: { bg: 'bg-cyan-500/10 border-cyan-500/20', border: 'border-cyan-500', text: 'text-brand-primary' },
    rose: { bg: 'bg-rose-500/10 border-rose-500/20', border: 'border-rose-500', text: 'text-brand-primary' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="bg-white rounded-[32px] border-8 border-brand-primary shadow-2xl p-6"
      id="date-detail-panel"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-4 border-brand-primary">
        <div>
          <span className="text-xs font-black text-brand-primary/65 uppercase tracking-wider">선택된 날짜 상세조정 및 약속 메모</span>
          <h3 className="text-xl font-black text-brand-primary flex items-center gap-2 mt-0.5">
            <CalendarRange className="h-6 w-6 text-brand-secondary" />
            <span>{formattedDateHeadline}</span>
          </h3>
        </div>

        {/* 퀵 매크로 액션 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            id="btn-macro-all-ok"
            onClick={() => {
              friends.forEach(f => {
                onUpdateStatus(f.id, AvailabilityStatus.AVAILABLE);
              });
            }}
            className="px-3 py-1.5 bg-brand-success/15 text-brand-primary hover:bg-brand-success/30 border-2 border-brand-primary rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Check className="h-3.5 w-3.5 stroke-[3]" />
            <span>모두 가능</span>
          </button>
          
          <button
            type="button"
            id="btn-macro-all-fail"
            onClick={() => {
              friends.forEach(f => {
                onUpdateStatus(f.id, AvailabilityStatus.UNAVAILABLE);
              });
            }}
            className="px-3 py-1.5 bg-brand-danger/15 text-brand-primary hover:bg-brand-danger/30 border-2 border-brand-primary rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5 stroke-[3]" />
            <span>모두 불가</span>
          </button>

          <button
            type="button"
            id="btn-macro-clear"
            onClick={onClearDay}
            className="px-3 py-1.5 bg-white text-brand-primary hover:bg-slate-100 border-2 border-brand-primary rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
            title="모두 일정을 초기화합니다"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>초기화</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* 왼쪽 7: 3인의 일정 정보 라디오 스위치 */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <h4 className="text-xs font-black text-brand-primary/70 uppercase tracking-wider mb-1 flex items-center gap-1">
            <UserCheck className="h-4 w-4" />
            <span>친구별 가능 여부 실시간 등록</span>
          </h4>

          {friends.map((friend) => {
            const status = dayStatus[friend.id] || AvailabilityStatus.NONE;
            const theme = colorMap[friend.color] || colorMap.indigo;

            return (
              <div
                key={friend.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                  status !== AvailabilityStatus.NONE 
                    ? theme.bg + ' ' + theme.border
                    : 'bg-white border-2 border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2.5 sm:mb-0">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-brand-primary/20 ${
                    friend.color === 'indigo' ? 'bg-brand-secondary' :
                    friend.color === 'emerald' ? 'bg-brand-success' :
                    friend.color === 'pink' ? 'bg-brand-danger' :
                    friend.color === 'violet' ? 'bg-violet-500' :
                    friend.color === 'amber' ? 'bg-amber-500' :
                    friend.color === 'teal' ? 'bg-teal-500' :
                    friend.color === 'cyan' ? 'bg-cyan-500' : 'bg-rose-500'
                  }`} />
                  <span className="text-sm font-black text-brand-primary">
                    {friend.name}
                    {friend.id === 'me' && <span className="text-[10px] text-brand-secondary font-black ml-1">(나)</span>}
                  </span>
                </div>

                {/* 3지선다 버튼 그룹 */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-brand-primary shadow-sm self-end sm:self-auto">
                  
                  {/* 가능 (초록색) */}
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(friend.id, AvailabilityStatus.AVAILABLE)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                      status === AvailabilityStatus.AVAILABLE
                        ? 'bg-brand-success text-brand-primary border-2 border-brand-primary shadow-xs'
                        : 'text-brand-primary/60 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>가능</span>
                  </button>

                  {/* 불가능 (빨간색) */}
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(friend.id, AvailabilityStatus.UNAVAILABLE)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                      status === AvailabilityStatus.UNAVAILABLE
                        ? 'bg-brand-danger text-white border-2 border-brand-primary shadow-xs'
                        : 'text-brand-primary/60 hover:bg-slate-50'
                    }`}
                  >
                    <X className="h-3.5 w-3.5 stroke-[3]" />
                    <span>불가</span>
                  </button>

                  {/* 미정 */}
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(friend.id, AvailabilityStatus.NONE)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                      status === AvailabilityStatus.NONE
                        ? 'bg-brand-primary text-white border-2 border-brand-primary'
                        : 'text-brand-primary/40 hover:bg-slate-50'
                    }`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>미정</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 오른쪽 5: 날짜 전용 메모 기능 */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <h4 className="text-xs font-black text-brand-primary/70 uppercase tracking-wider mb-1 flex items-center gap-1">
            <ClipboardSignature className="h-3.5 w-3.5" />
            <span>이 날짜의 계획 ∙ 메모 적기</span>
          </h4>

          <div className="bg-brand-bg p-4 rounded-2xl border-4 border-brand-primary flex flex-col gap-3 h-full">
            <textarea
              id="date-notes-textarea"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="예: 강남역 곱창집! 7시 만남, 장소나 회비 예약 같은 세부 일정을 적어보세요."
              className="w-full flex-1 p-3 text-xs text-brand-primary bg-white border-2 border-brand-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary min-h-[96px] resize-none leading-relaxed font-bold"
            />
            
            <button
              type="button"
              id="btn-save-notes"
              onClick={handleNotesSave}
              className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all border-2 border-brand-primary ${
                isSaved 
                  ? 'bg-brand-success text-brand-primary' 
                  : (localNotes.trim() !== (notes || '').trim())
                    ? 'bg-brand-secondary text-white hover:bg-brand-secondary/90'
                    : 'bg-white text-brand-primary hover:bg-slate-50'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 fill-current text-brand-primary" />
                  <span>메모가 로컬에 기입되었습니다!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>날짜 메모 저장하기</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* 종합 현황 요약 리본 백그라운드 */}
      <div className={`mt-5 p-4 rounded-2xl border-4 text-xs flex flex-wrap items-center justify-between gap-3 ${
        isAllAvailable 
          ? 'bg-brand-warning border-brand-primary text-brand-primary font-black shadow-inner shadow-amber-200/50' 
          : 'bg-white border-brand-primary text-brand-primary/80 font-bold'
      }`}>
        <div className="flex items-center gap-1.5 font-sans">
          {isAllAvailable ? (
            <span className="inline-block bg-brand-primary text-brand-warning font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm">
              골든 약속일 🏆
            </span>
          ) : (
            <span className="inline-block bg-brand-secondary text-white text-[10px] px-2.5 py-1 rounded-lg font-black uppercase">
              조율 상태
            </span>
          )}
          <span>이번 달 매칭 진척:</span>
          <strong className="underline decoration-brand-secondary decoration-2 font-black">가능 {availableCount}명 / 불가능 {unavailableCount}명</strong>
        </div>

        <p className="text-[11px] leading-relaxed italic">
          {isAllAvailable 
            ? '모두가 가능한 Perfect Day입니다! 이 날로 약속을 최종 확정할까요?' 
            : '친구들의 모든 체크 정보를 확인하여 약속을 확정하세요.'}
        </p>
      </div>

    </motion.div>
  );
};
