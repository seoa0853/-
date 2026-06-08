/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Edit2, Check, User, CalendarDays, HelpCircle } from 'lucide-react';
import { Friend, AvailabilityStatus, DateAvailability } from '../types.ts';

interface FriendCardProps {
  friend: Friend;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  availability: DateAvailability;
  currentYear: number;
  currentMonth: number;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  isActive,
  onSelect,
  onRename,
  availability,
  currentYear,
  currentMonth,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(friend.name);

  // 현재 년/월에 해당하는 사용자의 가능한 날과 불가능한 날 개수 계산
  let availableCount = 0;
  let unavailableCount = 0;

  const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  Object.entries(availability).forEach(([dateStr, statusMap]) => {
    if (dateStr.startsWith(prefix)) {
      const status = statusMap[friend.id];
      if (status === AvailabilityStatus.AVAILABLE) {
        availableCount++;
      } else if (status === AvailabilityStatus.UNAVAILABLE) {
        unavailableCount++;
      }
    }
  });

  const handleSave = () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== friend.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(friend.name);
      setIsEditing(false);
    }
  };

  // 색상 매핑
  const colorSchemes: Record<string, { bg: string; text: string; ring: string; dot: string; lightBg: string }> = {
    indigo: {
      bg: 'bg-brand-secondary',
      text: 'text-brand-secondary',
      ring: 'ring-brand-secondary',
      dot: 'bg-brand-secondary',
      lightBg: 'bg-brand-secondary/[0.08]',
    },
    emerald: {
      bg: 'bg-brand-success',
      text: 'text-brand-success',
      ring: 'ring-brand-success',
      dot: 'bg-brand-success',
      lightBg: 'bg-brand-success/[0.08]',
    },
    pink: {
      bg: 'bg-brand-danger',
      text: 'text-brand-danger',
      ring: 'ring-brand-danger',
      dot: 'bg-brand-danger',
      lightBg: 'bg-brand-danger/[0.08]',
    },
  };

  const currentTheme = colorSchemes[friend.color] || colorSchemes.indigo;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      id={`friend-card-${friend.id}`}
      onClick={(e) => {
        // 편집 중 일때는 카드 클릭에 따른 프로필 선택 전파를 방지하지 않되, 입력 폼 영역 외 클릭 처리
        if (!isEditing) onSelect();
      }}
      className={`relative p-4 rounded-2xl border-4 cursor-pointer transition-all ${
        isActive
          ? `bg-white shadow-xl border-brand-primary`
          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* 아바타 & 이름 */}
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={(e) => isEditing && e.stopPropagation()}>
          <div className={`p-2.5 rounded-xl text-white ${currentTheme.bg} flex-shrink-0 shadow-sm`}>
            <User className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="text"
                  id={`friend-name-input-${friend.id}`}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="w-full text-base font-bold text-brand-primary border-b-2 border-brand-secondary focus:outline-none p-0.5 bg-transparent"
                  maxLength={10}
                  autoFocus
                />
                <button
                  type="button"
                  id={`friend-name-save-${friend.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="p-1 rounded-md bg-brand-success/10 text-brand-primary hover:bg-brand-success/20"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/name">
                <span className="text-base font-black text-brand-primary truncate">
                  {friend.name}
                  {friend.id === 'me' && <span className="text-xs font-bold text-brand-secondary ml-1">(나)</span>}
                </span>
                <button
                  type="button"
                  id={`friend-name-edit-${friend.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-brand-primary hover:bg-slate-100 opacity-60 group-hover/name:opacity-100 focus:opacity-100 transition-opacity"
                  title="이름 수정"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-brand-primary/60 mt-0.5 flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${currentTheme.dot}`}></span>
              {friend.id === 'me' ? '캘린더 관리자' : '일정 동기화 멤버'}
            </p>
          </div>
        </div>

        {/* 선택 여부 표시 라디오 서클 */}
        <div className="ml-2 flex-shrink-0">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isActive
                ? `border-brand-primary bg-brand-primary text-white`
                : 'border-slate-350 bg-white'
            }`}
          >
            {isActive && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
          </div>
        </div>
      </div>

      {/* 이번 달 요약 통계 */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t-2 border-slate-100">
        <div className="bg-brand-success/10 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-brand-success/20">
          <span className="w-2 h-2 rounded-full bg-brand-success"></span>
          <span className="text-[11px] text-brand-primary/80 font-bold">가능:</span>
          <span className="text-xs font-black text-brand-primary ml-auto">{availableCount}일</span>
        </div>
        <div className="bg-brand-danger/10 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-brand-danger/20">
          <span className="w-2 h-2 rounded-full bg-brand-danger"></span>
          <span className="text-[11px] text-brand-primary/80 font-bold">불발:</span>
          <span className="text-xs font-black text-brand-primary ml-auto">{unavailableCount}일</span>
        </div>
      </div>
    </motion.div>
  );
};
