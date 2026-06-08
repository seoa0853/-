/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AvailabilityStatus, Friend, ScheduleRoom, DayStatus } from './types.ts';

// 다인원용 친구 프리셋 팔레트 및 컬러 설정
export const FRIEND_PALETTE = [
  { id: 'me', defaultName: '나', color: 'indigo', dotColor: '#6366f1' },
  { id: 'friend1', defaultName: '친구 1', color: 'emerald', dotColor: '#10b981' },
  { id: 'friend2', defaultName: '친구 2', color: 'pink', dotColor: '#ec4899' },
  { id: 'friend3', defaultName: '친구 3', color: 'violet', dotColor: '#8b5cf6' },
  { id: 'friend4', defaultName: '친구 4', color: 'amber', dotColor: '#f59e0b' },
  { id: 'friend5', defaultName: '친구 5', color: 'teal', dotColor: '#14b8a6' },
  { id: 'friend6', defaultName: '친구 6', color: 'cyan', dotColor: '#06b6d4' },
  { id: 'friend7', defaultName: '친구 7', color: 'rose', dotColor: '#f43f5e' },
];

export const DEFAULT_FRIENDS: Friend[] = [
  { id: 'me', name: '나', color: 'indigo', dotColor: '#6366f1' },
  { id: 'friend1', name: '친구 1', color: 'emerald', dotColor: '#10b981' },
  { id: 'friend2', name: '친구 2', color: 'pink', dotColor: '#ec4899' },
];

// 지정한 인원수에 맞춰 친구 목록을 동적으로 조립/성장/축소 시키는 헬퍼
export function createFriendsForCount(count: number, existingFriends: Friend[] = []): Friend[] {
  const result: Friend[] = [];
  const safeCount = Math.min(Math.max(count, 2), 8); // 최소 2명, 최대 8명 제한
  
  for (let i = 0; i < safeCount; i++) {
    const preset = FRIEND_PALETTE[i] || { id: `friend${i}`, defaultName: `친구 ${i}`, color: 'slate', dotColor: '#64748b' };
    const existing = existingFriends.find(f => f.id === preset.id);
    result.push({
      id: preset.id,
      name: existing ? existing.name : preset.defaultName,
      color: preset.color,
      dotColor: preset.dotColor
    });
  }
  return result;
}

export const DEFAULT_ROOM_TITLE = '우리의 맛있는 약속 🍕';

// 달력 날짜 생성 인터페이스
export interface CalendarCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD format
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

// YYYY-MM-DD 문자열 포맷팅
export function formatDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 년, 월(0-11) 기입에 따라 달력 채울 그리드 배열 리턴
export function getCalendarGrid(year: number, month: number): CalendarCell[] {
  const grid: CalendarCell[] = [];
  const today = new Date();
  const todayStr = formatDateString(today);

  // 이 달의 첫 번째 요일과 마지막 요일 알아내기
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
  
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // 1. 이전 달 빈칸 채우기
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const dateStr = formatDateString(prevMonthDate);
    grid.push({
      date: prevMonthDate,
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // 2. 이번 달 날짜 채우기
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dateStr = formatDateString(currentDate);
    grid.push({
      date: currentDate,
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // 3. 다음 달 빈칸 채우기 (전체 셀 개수가 7의 배수가 되도록)
  const remainingCells = 7 - (grid.length % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDate = new Date(year, month + 1, day);
      const dateStr = formatDateString(nextMonthDate);
      grid.push({
        date: nextMonthDate,
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }
  }

  // 42칸에 매칭 안 되면 6줄 완성용으로 7칸 더 채워줌
  if (grid.length < 42) {
    const startDay = (grid[grid.length - 1]?.dayNumber || 0) + 1;
    for (let day = startDay; day < startDay + 7; day++) {
      const nextMonthDate = new Date(year, month + 1, day);
      const dateStr = formatDateString(nextMonthDate);
      grid.push({
        date: nextMonthDate,
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }
  }

  return grid;
}

// 상태 압축하여 URL용 Base64 생성
export function encodeStateToHash(state: ScheduleRoom): string {
  try {
    const compactState = {
      id: state.id,
      t: state.title,
      p: state.participantCount || state.friends.length,
      f: state.friends.map((friend) => ({ id: friend.id, name: friend.name })),
      a: state.availability,
      n: state.notes || {},
    };
    const jsonStr = JSON.stringify(compactState);
    // 한글 깨짐 방지용 utf-8 base64 변환
    const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    return base64;
  } catch (e) {
    console.error('Encoding error:', e);
    return '';
  }
}

// URL 해시 정보로부터 상태 복원
export function decodeStateFromHash(hash: string): ScheduleRoom | null {
  if (!hash) return null;
  try {
    // 한글 깨짐 방지 디코드
    const decodedStr = decodeURIComponent(
      atob(hash)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(decodedStr);
    
    // 이전 버전 호환성 혹은 compact 디코드 복구
    const id = parsed.id || `room-${Date.now()}`;
    const title = parsed.t || parsed.title || DEFAULT_ROOM_TITLE;
    const participantCount = parsed.p || parsed.participantCount || (parsed.f || parsed.friends || []).length || 3;
    
    // 친구들의 고정 색상 설정 매칭
    const parsedFriends = parsed.f || parsed.friends || [];
    
    // 지정된 인원수 기반 친구 목록 생성
    const friends = createFriendsForCount(participantCount);
    // 이미 지정된 친구들의 이름이 있다면 복구 기입
    friends.forEach(f => {
      const match = parsedFriends.find((pf: any) => pf.id === f.id);
      if (match && match.name) {
        f.name = match.name;
      }
    });

    const availability = parsed.a || parsed.availability || {};
    const notes = parsed.n || parsed.notes || {};

    return {
      id,
      title,
      friends,
      availability,
      notes,
      participantCount,
    };
  } catch (e) {
    console.error('Decoding error:', e);
    return null;
  }
}

// 모든 요일 가져오기
export const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

// 특정 날짜의 상태 요약 구하기
export function getDateSummary(dayStatus: DayStatus = {}, friends: Friend[]) {
  const total = friends.length;
  let availableCount = 0;
  let unavailableCount = 0;
  const listAvailable: string[] = [];
  const listUnavailable: string[] = [];
  const listNone: string[] = [];

  friends.forEach((friend) => {
    const status = dayStatus[friend.id] || AvailabilityStatus.NONE;
    if (status === AvailabilityStatus.AVAILABLE) {
      availableCount++;
      listAvailable.push(friend.name);
    } else if (status === AvailabilityStatus.UNAVAILABLE) {
      unavailableCount++;
      listUnavailable.push(friend.name);
    } else {
      listNone.push(friend.name);
    }
  });

  return {
    total,
    availableCount,
    unavailableCount,
    isAllAvailable: availableCount === total,
    isAnyUnavailable: unavailableCount > 0,
    listAvailable,
    listUnavailable,
    listNone,
  };
}
