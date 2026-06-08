/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar, 
  Edit2, 
  Check, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Heart,
  Plus,
  HelpCircle,
  ThumbsUp,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { AvailabilityStatus, Friend, ScheduleRoom } from './types.ts';
import { FriendCard } from './components/FriendCard.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { StatsView } from './components/StatsView.tsx';
import { DateDetailPanel } from './components/DateDetailPanel.tsx';
import { ShareUrlButton } from './components/ShareUrlButton.tsx';
import { 
  DEFAULT_FRIENDS, 
  DEFAULT_ROOM_TITLE, 
  formatDateString, 
  decodeStateFromHash,
  createFriendsForCount
} from './utils.ts';

// 로컬 스토리지 키
const LEGACY_STORAGE_KEY = 'friend_schedule_coordination_state_v2';
const ROOMS_STORAGE_KEY = 'friend_schedule_coordination_rooms_v3';

export default function App() {
  // 기본 데모 가이드 데이터 (첫 방문 또는 초기화 시 캘린더가 꽉 차있게 보여주어 학습 유도)
  const getDemoRoom = (): ScheduleRoom => {
    return {
      id: 'demo-room',
      title: '우리의 첫 만남 약속 🍻',
      participantCount: 3,
      friends: DEFAULT_FRIENDS,
      notes: {
        '2026-06-12': '강남역 삼겹살 어때요?',
        '2026-06-13': '홍대 부근 파티룸 예약 완료!',
      },
      availability: {
        '2026-06-08': { me: AvailabilityStatus.NONE, friend1: AvailabilityStatus.AVAILABLE, friend2: AvailabilityStatus.AVAILABLE },
        '2026-06-12': { me: AvailabilityStatus.AVAILABLE, friend1: AvailabilityStatus.AVAILABLE, friend2: AvailabilityStatus.AVAILABLE }, // 전원 초록 = 노란색
        '2026-06-13': { me: AvailabilityStatus.AVAILABLE, friend1: AvailabilityStatus.AVAILABLE, friend2: AvailabilityStatus.AVAILABLE }, // 전원 초록 = 노란색
        '2026-06-14': { me: AvailabilityStatus.UNAVAILABLE, friend1: AvailabilityStatus.AVAILABLE, friend2: AvailabilityStatus.AVAILABLE }, // 안됨
        '2026-06-15': { me: AvailabilityStatus.AVAILABLE, friend1: AvailabilityStatus.AVAILABLE, friend2: AvailabilityStatus.NONE }, // 2명 가능 후보
        '2026-06-19': { me: AvailabilityStatus.AVAILABLE, friend1: AvailabilityStatus.AVAILABLE, friend2: AvailabilityStatus.AVAILABLE }, // 전원 초록 = 노란색
        '2026-06-20': { me: AvailabilityStatus.AVAILABLE, friend1: AvailabilityStatus.UNAVAILABLE, friend2: AvailabilityStatus.AVAILABLE }, // 안됨
      },
    };
  };

  const createNewBlankRoom = (title = '새로운 약속 조율 방 ⭐', count = 3): ScheduleRoom => {
    return {
      id: `room-${Date.now()}`,
      title,
      participantCount: count,
      friends: createFriendsForCount(count),
      availability: {},
      notes: {},
    };
  };

  // State 선언
  const [rooms, setRooms] = useState<ScheduleRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('');

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 6월 (0-indexed: 5)
  const [activeFriendId, setActiveFriendId] = useState<string>('all'); // 'all' (종합비교) 또는 특정 친구 ID
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>('2026-06-12'); // 기본으로 노란색 확정일 포커싱
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [roomTitleInput, setRoomTitleInput] = useState('');
  const [urlLoadedAlert, setUrlLoadedAlert] = useState<boolean>(false);

  // 파생 활성 방 상태 정보 구하기
  const roomState = rooms.find((r) => r.id === activeRoomId) || rooms[0] || getDemoRoom();

  // 1. 초기 마운트 시, URL 공유 파라미터 또는 로컬 스토리지 데이터 로드 및 v3 규격 업그레이드 마이그레이션
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataHash = params.get('data');

    let loadedRooms: ScheduleRoom[] = [];
    let initialActiveId = '';

    // URL 공유 데이터 로드가 최우선 순위
    if (dataHash) {
      const decoded = decodeStateFromHash(dataHash);
      if (decoded) {
        const hashRoomId = decoded.id || `shared-${Date.now()}`;
        decoded.id = hashRoomId;
        loadedRooms.push(decoded);
        initialActiveId = hashRoomId;
        setUrlLoadedAlert(true);
        setTimeout(() => setUrlLoadedAlert(false), 5000);
      }
    }

    // 로컬 스토리지 조회
    const savedRooms = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (savedRooms) {
      try {
        const parsed = JSON.parse(savedRooms);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((r: ScheduleRoom) => {
            if (!loadedRooms.some(lr => lr.id === r.id)) {
              loadedRooms.push(r);
            }
          });
          if (!initialActiveId) {
            initialActiveId = parsed[0].id;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved rooms list:', e);
      }
    } else {
      // v3가 없고 예전 v2 단일방이 있는 경우 유연하게 v3 가로 규격 리스트로 업그레이드
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySaved) {
        try {
          const parsedV2 = JSON.parse(legacySaved);
          if (parsedV2 && typeof parsedV2 === 'object') {
            const migratedRoom: ScheduleRoom = {
              id: `room-migrated`,
              title: parsedV2.title || '기존 백업된 조율 약속 🍕',
              friends: parsedV2.friends || DEFAULT_FRIENDS,
              availability: parsedV2.availability || {},
              notes: parsedV2.notes || {},
              participantCount: (parsedV2.friends || []).length || 3
            };
            loadedRooms.push(migratedRoom);
            if (!initialActiveId) {
              initialActiveId = migratedRoom.id;
            }
          }
        } catch (e) {
          console.error('Legacy migration fail:', e);
        }
      }
    }

    // 만약 둘 다 아무것도 없는 경우 디폴트 데모 룸을 밀어넣음
    if (loadedRooms.length === 0) {
      const demo = getDemoRoom();
      loadedRooms.push(demo);
      initialActiveId = demo.id;
    }

    setRooms(loadedRooms);
    setActiveRoomId(initialActiveId);

    // 포커싱 및 뷰 이동 바인딩
    const activeR = loadedRooms.find(r => r.id === initialActiveId) || loadedRooms[0];
    if (activeR) {
      setRoomTitleInput(activeR.title);
      
      if (dataHash) {
        const dateKeys = Object.keys(activeR.availability);
        if (dateKeys.length > 0) {
          const firstDate = dateKeys[0];
          const parts = firstDate.split('-');
          setCurrentYear(parseInt(parts[0]));
          setCurrentMonth(parseInt(parts[1]) - 1);
          setSelectedDateStr(firstDate);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // 2. 상태 변경 시 자동 로컬스토리지 다중 방 동기화
  useEffect(() => {
    if (rooms.length > 0) {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    }
  }, [rooms]);

  // 방 이름 변경 저장
  const handleSaveTitle = () => {
    const trimmed = roomTitleInput.trim();
    if (trimmed) {
      setRooms((prev) =>
        prev.map((r) => (r.id === activeRoomId ? { ...r, title: trimmed } : r))
      );
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') {
      setRoomTitleInput(roomState.title);
      setIsEditingTitle(false);
    }
  };

  // 특정 친구의 이름 수정 처리
  const handleRenameFriend = (friendId: string, newName: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoomId) return r;
        const updatedFriends = r.friends.map((friend) =>
          friend.id === friendId ? { ...friend, name: newName } : friend
        );
        return {
          ...r,
          friends: updatedFriends,
        };
      })
    );
  };

  // 날짜 선택 시 액션
  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    
    // 모바일 기기(폭이 좁은 1024px 미만 뷰포트)에서 사용자가 선택한 날짜의 상세 패널로 자동 스무스 스크롤 포커싱
    setTimeout(() => {
      const panel = document.getElementById('date-detail-panel');
      if (panel && window.innerWidth < 1024) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 120);
  };

  // 날짜 마우스 클릭/더블클릭 시 직접 가속 토글 기능
  // NONE -> AVAILABLE (초록) -> UNAVAILABLE (빨강) -> NONE
  const handleToggleCellDirect = (dateStr: string) => {
    if (activeFriendId === 'all') return; // 종합 모드일 때는 비활성화

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoomId) return r;
        const currentDayStatus = r.availability[dateStr] || {};
        const currentStatus = currentDayStatus[activeFriendId] || AvailabilityStatus.NONE;
        
        let nextStatus = AvailabilityStatus.NONE;
        if (currentStatus === AvailabilityStatus.NONE) {
          nextStatus = AvailabilityStatus.AVAILABLE;
        } else if (currentStatus === AvailabilityStatus.AVAILABLE) {
          nextStatus = AvailabilityStatus.UNAVAILABLE;
        }

        return {
          ...r,
          availability: {
            ...r.availability,
            [dateStr]: {
              ...currentDayStatus,
              [activeFriendId]: nextStatus,
            },
          },
        };
      })
    );
  };

  // 세부 조정 패널에서 개별 상태 즉시 수정
  const handleUpdateFriendStatus = (friendId: string, status: AvailabilityStatus) => {
    if (!selectedDateStr) return;

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoomId) return r;
        const currentDayStatus = r.availability[selectedDateStr] || {};
        return {
          ...r,
          availability: {
            ...r.availability,
            [selectedDateStr]: {
              ...currentDayStatus,
              [friendId]: status,
            },
          },
        };
      })
    );
  };

  // 특정 날짜의 메모 내용 저장
  const handleUpdateDateNotes = (dateStr: string, text: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoomId) return r;
        return {
          ...r,
          notes: {
            ...r.notes,
            [dateStr]: text,
          },
        };
      })
    );
  };

  // 해당 날짜의 3명 일정 전체 해제 처리
  const handleClearDay = () => {
    if (!selectedDateStr) return;

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoomId) return r;
        const updatedAvailability = { ...r.availability };
        delete updatedAvailability[selectedDateStr];
        const updatedNotes = { ...r.notes };
        delete updatedNotes[selectedDateStr];
        return {
          ...r,
          availability: updatedAvailability,
          notes: updatedNotes || {},
        };
      })
    );
  };

  // 전체 리셋 로직
  const handleResetAll = () => {
    localStorage.removeItem(ROOMS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const demo = getDemoRoom();
    setRooms([demo]);
    setActiveRoomId(demo.id);
    setRoomTitleInput(demo.title);
    setSelectedDateStr('2026-06-12');
  };

  // 공유 데이터 로드시 전체 덮어쓰기 지원
  const handleLoadState = (loadedState: ScheduleRoom) => {
    const loadedId = loadedState.id || `room-${Date.now()}`;
    const preparedRoom = {
      ...loadedState,
      id: loadedId,
    };
    setRooms((prev) => {
      const idx = prev.findIndex((r) => r.id === loadedId);
      if (idx !== -1) {
        return prev.map((r) => (r.id === loadedId ? preparedRoom : r));
      }
      return [preparedRoom, ...prev];
    });
    setActiveRoomId(loadedId);
    setRoomTitleInput(preparedRoom.title);
    if (preparedRoom.availability) {
      const keys = Object.keys(preparedRoom.availability);
      if (keys.length > 0) {
        setSelectedDateStr(keys[0]);
      }
    }
  };

  // 인원 규모 변동 제어
  const handleUpdateParticipantCount = (newCount: number) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoomId) return r;
        const updatedFriends = createFriendsForCount(newCount, r.friends);

        // 만약 activeFriendId가 없어진 인원 범위라면 복귀
        const isStillAvailableActive = updatedFriends.some((f) => f.id === activeFriendId);
        if (activeFriendId !== 'all' && !isStillAvailableActive) {
          setActiveFriendId('all');
        }

        return {
          ...r,
          participantCount: newCount,
          friends: updatedFriends,
        };
      })
    );
  };

  // 월 전환 단추 제어
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(formatDateString(today));
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-primary font-sans p-2 sm:p-6 lg:p-8">
      {/* 최고 헤더 쉘프 */}
      <header className="max-w-7xl mx-auto mb-4 sm:mb-8">
        {/* 알림 토스트 베너 */}
        <AnimatePresence>
          {urlLoadedAlert && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 bg-brand-success text-brand-primary border-4 border-brand-primary rounded-[20px] px-4 py-3.5 text-xs font-black flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>친구와의 동기화가 성사되었습니다! 전달받은 캘린더 약속 데이터를 성공적으로 로드했습니다.</span>
              </div>
              <button onClick={() => setUrlLoadedAlert(false)} className="hover:opacity-80 font-black ml-2 underline">확인</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl sm:rounded-[32px] border-4 sm:border-8 border-brand-primary shadow-2xl p-4 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
          {/* 백그라운드 디자인 오브제 */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-brand-secondary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-brand-secondary font-black text-xs uppercase tracking-widest">
              <Sparkles className="h-4.5 w-4.5 text-brand-warning fill-brand-warning" />
              <span>우리의 약속 캘린더 조율</span>
            </div>

            {/* 타이틀 편집 헤드라인 */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 mt-2 w-full max-w-xl">
                <input
                  type="text"
                  id="room-title-edit-input"
                  value={roomTitleInput}
                  onChange={(e) => setRoomTitleInput(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={handleTitleKeyDown}
                  className="text-2xl sm:text-3xl font-black text-brand-primary border-b-4 border-brand-primary focus:outline-none py-1.5 w-full bg-transparent"
                  maxLength={24}
                  autoFocus
                />
                <button
                  type="button"
                  id="btn-save-room-title"
                  onClick={handleSaveTitle}
                  className="p-2.5 rounded-xl bg-brand-success text-brand-primary hover:opacity-95 border-2 border-brand-primary cursor-pointer font-black"
                  title="저장"
                >
                  <Check className="h-5 w-5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 mt-2 group/title">
                <h1 className="text-2xl sm:text-4xl font-black text-brand-primary tracking-tight leading-tight">
                  {roomState.title}
                </h1>
                <button
                  type="button"
                  id="btn-edit-room-title"
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1.5 rounded-lg text-brand-primary/50 hover:text-brand-primary hover:bg-brand-secondary/10 opacity-70 group-hover/title:opacity-100 transition-opacity cursor-pointer"
                  title="약속 목표 수정"
                >
                  <Edit2 className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
            
            <p className="text-xs text-brand-primary/80 mt-2 leading-relaxed max-w-xl font-bold">
              여러 방을 만들어 관리하고, 참여 멤버들의 수에 맞춰 모두가 모일 수 있는 최고의 날짜를 산출해 내는 약속 동기화 기기입니다.
              각 요일 속에서 친구들의 일정을 더블클릭이나 상세 패널로 설정해 보세요!
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-brand-warning/90 border-4 border-brand-primary px-4 py-2.5 rounded-2xl shadow-sm">
            <div className="flex -space-x-2 overflow-hidden py-0.5">
              {roomState.friends.map((f) => {
                const bgClass =
                  f.color === 'indigo' ? 'bg-brand-secondary' :
                  f.color === 'emerald' ? 'bg-brand-success' :
                  f.color === 'pink' ? 'bg-brand-danger' :
                  f.color === 'violet' ? 'bg-violet-500' :
                  f.color === 'amber' ? 'bg-amber-500' :
                  f.color === 'teal' ? 'bg-teal-500' :
                  f.color === 'cyan' ? 'bg-cyan-500' :
                  f.color === 'rose' ? 'bg-rose-500' :
                  f.color === 'sky' ? 'bg-sky-500' :
                  f.color === 'orange' ? 'bg-orange-500' :
                  f.color === 'lime' ? 'bg-lime-500' :
                  f.color === 'fuchsia' ? 'bg-fuchsia-500' :
                  f.color === 'purple' ? 'bg-purple-500' :
                  f.color === 'yellow' ? 'bg-yellow-500' :
                  f.color === 'blue' ? 'bg-blue-500' :
                  f.color === 'red' ? 'bg-red-500' :
                  f.color === 'stone' ? 'bg-stone-500' :
                  f.color === 'green' ? 'bg-green-500' :
                  f.color === 'slate' ? 'bg-slate-500' : 'bg-zinc-500';
                const textClass = (f.color === 'emerald' || f.color === 'yellow' || f.color === 'lime') ? 'text-brand-primary' : 'text-white';
                return (
                  <span
                    key={f.id}
                    title={f.name}
                    className={`w-8 h-8 rounded-full border-2 border-brand-primary flex items-center justify-center text-[10px] font-black shadow-sm shrink-0 uppercase ${bgClass} ${textClass}`}
                  >
                    {f.name.slice(0, 2)}
                  </span>
                );
              })}
            </div>
            <div className="text-left font-sans">
              <span className="text-[11px] font-black text-brand-primary block">고정 멤버 정원</span>
              <span className="text-[10px] text-brand-primary/75 block font-bold">동시 {roomState.participantCount}인 조율</span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 레이아웃 본문 (그리드 레이아웃) */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        
        {/* 양쪽으로 나뉜 레이아웃: 왼쪽 카운터 및 컨트롤 스위치 (4/12) */}
        <section className="lg:col-span-4 flex flex-col gap-6" id="left-sidebar">
          
          {/* 🌟 [NEW] 마스터 방 조향 & 인원 규모 설정 제어 보드 */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] border-4 sm:border-8 border-brand-primary shadow-2xl p-4 sm:p-6 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-brand-secondary">ROOM MANAGEMENT</span>
                <span className="text-[10px] font-black bg-brand-primary text-white px-2 py-0.5 rounded-full">
                  총 {rooms.length}개 방
                </span>
              </div>
              <h3 className="text-base font-black text-brand-primary flex items-center gap-1.5 mt-1">
                <Users className="h-5 w-5 text-brand-secondary" />
                <span>조율할 모임 방 선택</span>
              </h3>
            </div>

            {/* 방 선택 드롭다운 셀렉터 + 조작 버튼 */}
            <div className="flex gap-2">
              <select
                id="select-active-room"
                value={activeRoomId}
                onChange={(e) => {
                  const targetId = e.target.value;
                  setActiveRoomId(targetId);
                  const found = rooms.find(r => r.id === targetId);
                  if (found) {
                    setRoomTitleInput(found.title);
                    setActiveFriendId('all'); // 방 바뀔 때 전체뷰로
                  }
                }}
                className="flex-1 bg-brand-bg text-brand-primary font-black border-4 border-brand-primary px-3 py-2.5 rounded-2xl focus:outline-none cursor-pointer text-xs"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.title} ({room.participantCount}명)
                  </option>
                ))}
              </select>

              <button
                type="button"
                id="btn-add-new-room"
                onClick={() => {
                  const newRoom = createNewBlankRoom();
                  setRooms(prev => [newRoom, ...prev]);
                  setActiveRoomId(newRoom.id);
                  setRoomTitleInput(newRoom.title);
                  setActiveFriendId('all');
                }}
                className="p-2.5 bg-brand-warning text-brand-primary hover:opacity-90 border-4 border-brand-primary rounded-2xl cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                title="새 조율 방 만들기"
              >
                <Plus className="h-5 w-5 stroke-[3px]" />
              </button>

              <button
                type="button"
                id="btn-delete-current-room"
                onClick={() => {
                  if (rooms.length <= 1) {
                    alert('최소한 1개의 조율 방은 유지해야 합니다.');
                    return;
                  }
                  if (confirm(`'${roomState.title}' 일정을 정말 삭제하시겠습니까?`)) {
                    const remaining = rooms.filter(r => r.id !== activeRoomId);
                    setRooms(remaining);
                    const nextId = remaining[0].id;
                    setActiveRoomId(nextId);
                    const found = remaining[0];
                    setRoomTitleInput(found.title);
                    setActiveFriendId('all');
                  }
                }}
                className="p-2.5 bg-brand-danger text-white hover:opacity-90 border-4 border-brand-primary rounded-2xl cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                title="이 방 삭제하기"
              >
                <Trash2 className="h-5 w-5 fill-current text-white" />
              </button>
            </div>

            {/* 인원수 선택 레일 (2명 ~ 20명 동적 인터페이스) */}
            <div className="border-t-4 border-brand-primary/10 pt-4">
              <span className="text-[10px] uppercase font-black tracking-wider text-brand-primary/60 block mb-2">
                참여 인원 규모 설정 ({roomState.participantCount}명 참여)
              </span>
              <div className="flex flex-wrap gap-1.5 justify-start">
                {Array.from({ length: 19 }, (_, i) => i + 2).map((num) => {
                  const isSelected = roomState.participantCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleUpdateParticipantCount(num)}
                      className={`flex-1 min-w-[42px] max-w-[50px] py-1.5 text-[10px] font-black rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-secondary border-brand-primary text-white scale-[1.03] shadow-inner shadow-indigo-400/30'
                          : 'bg-slate-50 border-brand-primary/10 text-brand-primary/60 hover:bg-slate-100'
                      }`}
                    >
                      {num}명
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* 기입 대상 설정 레일 정보 */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] border-4 sm:border-8 border-brand-primary shadow-2xl p-4 sm:p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-black text-brand-primary flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="h-5 w-5 text-brand-secondary" />
                <span>누구의 일정을 기입하나요?</span>
              </h3>
              <p className="text-xs text-brand-primary/65 mt-1 font-bold">
                기입할 멤버 카드를 선택한 후 캘린더의 날짜를 더블클릭 하면 간편 체크가 가능합니다. 한글 이름을 연필 버튼으로 변경해 보세요.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              
              {/* 1. 종합 매칭 보기 버튼 */}
              <button
                type="button"
                id="btn-view-all-matching"
                onClick={() => setActiveFriendId('all')}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left cursor-pointer transition-all ${
                  activeFriendId === 'all'
                    ? 'bg-brand-warning border-4 border-brand-primary text-brand-primary font-black shadow-md'
                    : 'bg-white border-2 border-brand-primary/20 text-brand-primary hover:bg-brand-bg hover:border-brand-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl border-2 border-brand-primary ${
                    activeFriendId === 'all' ? 'bg-brand-primary text-brand-warning' : 'bg-slate-100 text-brand-primary/60'
                  }`}>
                    <Users className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <span className="text-sm font-black block">전체 종합 현황 모드</span>
                    <span className={`text-[10px] block ${
                      activeFriendId === 'all' ? 'text-brand-primary/80 font-bold' : 'text-brand-primary/50'
                    }`}>
                      전원 참여 조합 완성이 노란색으로 강조됩니다!
                    </span>
                  </div>
                </div>
                {activeFriendId === 'all' && (
                  <span className="text-white text-xs font-black bg-brand-primary px-2.5 py-1 rounded-lg border border-brand-primary shadow-sm">
                    ON
                  </span>
                )}
              </button>

              <div className="text-slate-350 border-t-4 border-brand-primary/10 my-2 pt-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-brand-primary/60">
                  개별 일정 보완 및 수정용 프로필
                </span>
              </div>

              {/* 2. 각 세 친구 개별 선택 카드 */}
              {roomState.friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  isActive={activeFriendId === friend.id}
                  onSelect={() => setActiveFriendId(friend.id)}
                  onRename={(newName) => handleRenameFriend(friend.id, newName)}
                  availability={roomState.availability}
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                />
              ))}
            </div>
          </div>

          {/* 공유 위젯 복사 다운로드 */}
          <ShareUrlButton
            roomState={roomState}
            onLoadState={handleLoadState}
            onResetAll={handleResetAll}
          />
        </section>

        {/* 오른쪽 메인 보드: 캘린더와 추천 날 수집 (8/12) */}
        <section className="lg:col-span-8 flex flex-col gap-8" id="right-main-board">
          
          {/* 달력 판넬 */}
          <CalendarView
            currentYear={currentYear}
            currentMonth={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onGoToToday={handleGoToToday}
            friends={roomState.friends}
            activeFriendId={activeFriendId}
            availability={roomState.availability}
            selectedDateStr={selectedDateStr}
            onSelectDate={handleSelectDate}
            onToggleCellDirect={handleToggleCellDirect}
          />

          {/* 하단 투 트랙 융합 탭: 날짜 디테일 가설수립 패널과 추천현황 리스트 배포 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. 세부 피치 캡슐 */}
            <AnimatePresence mode="wait">
              {selectedDateStr ? (
                <DateDetailPanel
                  key={selectedDateStr}
                  selectedDateStr={selectedDateStr}
                  friends={roomState.friends}
                  availability={roomState.availability}
                  onUpdateStatus={handleUpdateFriendStatus}
                  onUpdateNotes={handleUpdateDateNotes}
                  notes={roomState.notes?.[selectedDateStr] || ''}
                  onClearDay={handleClearDay}
                />
              ) : (
                <div className="bg-white rounded-2xl sm:rounded-[32px] border-4 sm:border-8 border-dashed border-brand-primary p-6 sm:p-8 flex flex-col items-center justify-center text-center text-brand-primary/45 min-h-[300px] shadow-2xl">
                  <Calendar className="h-10 w-10 text-brand-primary/40 mb-2.5" />
                  <p className="text-xs font-black leading-relaxed text-brand-primary/70">
                    달력의 날짜를 한 번 눌러 보세요!<br />
                    날짜를 클릭하면 해당 일자의 참여 인원 상세 관리와<br />
                    메모 입력창이 등장합니다.
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* 2. Top 3 황금 약속일 요약 통계 */}
            <StatsView
              friends={roomState.friends}
              availability={roomState.availability}
              currentYear={currentYear}
              currentMonth={currentMonth}
              onSelectDate={handleSelectDate}
            />
          </div>
        </section>

      </main>

      {/* 푸터 크레딧 */}
      <footer className="max-w-7xl mx-auto mt-16 pt-8 border-t-4 border-brand-primary text-center text-brand-primary/75 text-xs pb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-sans font-bold">
        <p>
          © {currentYear} 친구 약속 조율 캘린더 — 3인의 완벽한 노란색 골든 매칭 데이 찾기 서비스
        </p>
        <div className="flex items-center justify-center gap-4 text-brand-primary/80">
          <span className="flex items-center gap-1 font-black">
            <Heart className="h-3.5 w-3.5 fill-brand-danger text-brand-danger" />
            삼총사
          </span>
          <span>∙</span>
          <span>실시간 주소 동기화</span>
        </div>
      </footer>
    </div>
  );
}
