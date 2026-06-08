/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AvailabilityStatus {
  NONE = 'NONE',             // 미정 (흰색 또는 기본색)
  AVAILABLE = 'AVAILABLE',   // 가능 (초록색)
  UNAVAILABLE = 'UNAVAILABLE' // 불가능 (빨간색)
}

export interface Friend {
  id: string;      // 'me', 'friend1', 'friend2'
  name: string;    // 사용자 설정 가능 이름
  color: string;   // UI 표시 색상 테마 클래스명들
  dotColor: string; // 캘린더 점 표시 색상
}

export interface DayStatus {
  [friendId: string]: AvailabilityStatus;
}

export interface DateAvailability {
  [dateStr: string]: DayStatus; // Key is 'YYYY-MM-DD'
}

export interface ScheduleRoom {
  id: string;                  // 방 고유 ID
  title: string;               // 방 이름
  friends: Friend[];           // 이 방에 소속된 참여자 목록
  availability: DateAvailability; // 날짜별 조율 상태
  notes?: { [dateStr: string]: string }; // 날짜별 메모
  participantCount: number;    // 참여 인원수 (예: 2~8명)
}
