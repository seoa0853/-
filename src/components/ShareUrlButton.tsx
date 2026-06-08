/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, CheckCircle, Download, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { ScheduleRoom } from '../types.ts';
import { encodeStateToHash } from '../utils.ts';

interface ShareUrlButtonProps {
  roomState: ScheduleRoom;
  onLoadState: (loadedState: ScheduleRoom) => void;
  onResetAll: () => void;
}

export const ShareUrlButton: React.FC<ShareUrlButtonProps> = ({
  roomState,
  onLoadState,
  onResetAll,
}) => {
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 공유 가능한 링크 복사 로직
  const handleCopyLink = async () => {
    try {
      const b64Data = encodeStateToHash(roomState);
      const appUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${appUrl}?data=${encodeURIComponent(b64Data)}`;
      
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
      // 클립보드 오류 시 텍스트 포커싱 지원
      setErrorMsg('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // 백업 JSON 다운로드
  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(roomState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const cleanTitle = roomState.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim();
      downloadAnchor.setAttribute("download", `${cleanTitle || '약속_캘린더_데이터'}_백업.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('JSON export failed:', err);
    }
  };

  // 백업 JSON 업로드 불러오기
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const obj = JSON.parse(event.target?.result as string);
        if (obj && typeof obj === 'object') {
          // 데이터 유효성 약식 검증
          const title = obj.title || obj.t || '불러온 약속 일정';
          const friends = obj.friends || [];
          const availability = obj.availability || obj.a || {};

          onLoadState({
            title,
            friends: roomState.friends.map((defFriend, idx) => {
              const matchingImport = friends.find((f: any) => f.id === defFriend.id) || friends[idx];
              return {
                ...defFriend,
                name: matchingImport?.name || defFriend.name,
              };
            }),
            availability,
          });
        }
      } catch (err) {
        setErrorMsg('유효하지 않은 백업 JSON 파일입니다.');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    };
    fileReader.readAsText(file);
    // 동일 파일 재기입 입력 방아쇠 리셋
    e.target.value = '';
  };

  return (
    <div className="bg-brand-primary text-white rounded-[32px] border-8 border-brand-primary shadow-2xl p-6 sm:p-8" id="sharing-widget">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-brand-secondary rounded-xl text-white font-bold shadow-sm">
          <Share2 className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">친구에게 공유하여 조율하기</h3>
          <p className="text-[11px] text-white/70 mt-0.5 font-bold">
            현재 캘린더 일정을 링크나 백업 데이터로 저장하고 전달하세요.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* 복사 버튼 */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleCopyLink}
          className={`w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all border-2 border-brand-primary shadow-lg ${
            copied
              ? 'bg-brand-success text-brand-primary'
              : 'bg-brand-danger hover:bg-brand-danger/95 text-white'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle className="h-4.5 w-4.5" />
              <span>카카오톡/온라인 공유 링크 복사 완료!</span>
            </>
          ) : (
            <>
              <Copy className="h-4.5 w-4.5" />
              <span>실시간 동기화 공유 링크 복사하기</span>
            </>
          )}
        </motion.button>

        {copied && (
          <p className="text-[10px] text-brand-success text-center font-black leading-relaxed">
            ✔️ 링크가 클립보드에 복사되었습니다! 친구들에게 보내 일정을 채우게 하세요.<br />
            (친구들이 수정 후, 다시 링크를 복사해 보내면 일정이 완벽 조율됩니다!)
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t-4 border-white/10">
          {/* JSON 백업 내보내기 */}
          <button
            type="button"
            onClick={handleExportJson}
            className="py-3 px-3 bg-white/10 hover:bg-white/15 rounded-xl text-white border-2 border-brand-primary text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            title="현재 입력한 모든 캘린더 정보를 내 컴퓨터 파일로 저장해 둡니다"
          >
            <Download className="h-3.5 w-3.5" />
            <span>백업 다운로드</span>
          </button>

          {/* JSON 백업 불러오기 */}
          <label className="py-3 px-3 bg-white/10 hover:bg-white/15 rounded-xl text-white border-2 border-brand-primary text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
            <Upload className="h-3.5 w-3.5" />
            <span>백업 불러오기</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>

        {/* 전체 초기화 리셋 버튼 */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('캘린더 조율 상태를 전부 비우고 처음부터 다시 시작할까요?')) {
              onResetAll();
            }
          }}
          className="w-full mt-1.5 py-2.5 hover:bg-white/10 text-brand-warning hover:text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>전체 캘린더 초기화 및 새로 시작</span>
        </button>

        {/* 오류 메시지 팝업 */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3 bg-brand-danger/20 text-brand-warning text-[11px] rounded-xl border border-brand-danger/40 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-brand-danger flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
