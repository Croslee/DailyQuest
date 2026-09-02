import React from 'react';
import {
  Compass,
  Search,
  MousePointerClick,
  Keyboard,
  Flame,
  Download,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  SlidersHorizontal,
  Shield,
} from 'lucide-react';
import { useTranslation } from '@/i18n/I18nContext';
import { SHADOW_SLAVE_RANKS } from '@/domain/rank';

export const TutorialPage: React.FC = () => {
  const { language } = useTranslation();

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-2xl font-bold tracking-tight">
            {language === 'vi' ? 'Hướng Dẫn Sử Dụng DailyQuest' : 'DailyQuest User Guide & Shortcuts'}
          </h2>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {language === 'vi'
            ? 'Khám phá toàn bộ tính năng và phím tắt thông minh giúp bạn tối ưu hóa năng suất mỗi ngày'
            : 'Discover all power features, browser shortcuts, and productivity workflows to supercharge your daily routine'}
        </p>
      </div>

      {/* 1. Task Row Interaction & Hover Actions */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-bold">
            {language === 'vi'
              ? '1. Giao Diện Tối Giản & Thao Tác Di Chuột (Hover Actions)'
              : '1. Minimalist Task Rows & Hover Actions'}
          </h3>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {language === 'vi'
            ? 'Danh sách nhiệm vụ được thiết kế tối giản để bạn hoàn toàn tập trung vào nội dung công việc:'
            : 'Task rows are designed to be ultra-clean so you can focus entirely on what matters:'}
        </p>

        <div className="p-3.5 rounded-lg border text-xs space-y-3" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
          <div>
            <div className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
              {language === 'vi' ? 'Trạng thái mặc định:' : 'Default State:'}
            </div>
            <div className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded border border-[var(--color-border-hover)] inline-block" />
                <span>Study System Design</span>
              </div>
              <span className="text-xs text-[var(--color-text-tertiary)] font-semibold">+20</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-[var(--color-accent)] uppercase tracking-wider mb-1">
              {language === 'vi' ? 'Khi di chuột (Hover):' : 'On Hover:'}
            </div>
            <div className="p-2 rounded-lg border border-[var(--color-accent)] bg-[var(--color-bg-secondary)] flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-tertiary)] opacity-60">⠿</span>
                <span className="w-4 h-4 rounded border border-[var(--color-border-hover)] inline-block" />
                <span>Study System Design</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--color-accent)]" title="Quick Pomodoro">◷</span>
                <span className="text-[var(--color-text-tertiary)] font-semibold">+20</span>
                <span className="text-[var(--color-text-tertiary)]">⋮</span>
              </div>
            </div>
          </div>

          <ul className="list-disc list-inside space-y-1 text-[11px] text-[var(--color-text-secondary)] pl-1">
            <li>
              <strong>{language === 'vi' ? 'Xem chi tiết:' : 'View Details:'}</strong>{' '}
              {language === 'vi'
                ? 'Nhấp trực tiếp vào tên nhiệm vụ để mở rộng xem mô tả và checklist subtasks.'
                : 'Click directly on any task title to expand its description and subtasks.'}
            </li>
            <li>
              <strong>{language === 'vi' ? 'Quick Pomodoro:' : 'Quick Focus:'}</strong>{' '}
              {language === 'vi'
                ? 'Di chuột vào nhiệm vụ và bấm biểu tượng đồng hồ để khởi động phiên tập trung 25 phút.'
                : 'Hover and click the clock icon to start a 25m Pomodoro focus session.'}
            </li>
            <li>
              <strong>{language === 'vi' ? 'Menu mở rộng (⋮):' : 'More Options (⋮):'}</strong>{' '}
              {language === 'vi'
                ? 'Chỉnh sửa toàn bộ thông tin quest, bỏ qua hôm nay hoặc dời lịch sang ngày mai.'
                : 'Edit full quest details, skip for today, or postpone to tomorrow.'}
            </li>
          </ul>
        </div>
      </div>

      {/* 2. Global Top Action Header: New Quest [N] & Focus Pomodoro */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-bold">
            {language === 'vi'
              ? '2. Thanh Header Hành Động Nhanh: Tạo Quest [N] & Focus Pomodoro'
              : '2. Global Top Action Header: New Quest [N] & Focus Pomodoro'}
          </h3>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {language === 'vi'
            ? 'Ở góc trên bên phải của Dashboard luôn có 2 công cụ năng suất tức thì, sẵn sàng hỗ trợ bạn làm việc sâu:'
            : 'At the top-right corner of the Dashboard, two instantaneous productivity tools are always ready for deep work:'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg border space-y-1.5" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between font-bold text-[var(--color-text-primary)]">
              <div className="flex items-center gap-1.5 text-[var(--color-accent)]">
                <Plus className="w-4 h-4" />
                <span>{language === 'vi' ? 'Nhiệm Vụ Mới (New Quest)' : 'New Quest'}</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">N</kbd>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {language === 'vi'
                ? 'Nhấp vào nút này hoặc nhấn phím tắt N tại bất kỳ đâu trên Dashboard để mở ngay cửa sổ tạo nhiệm vụ mới với đầy đủ tùy chọn độ khó, XP và checklist.'
                : 'Click this button or press N anywhere on the Dashboard to instantly open the quest creation dialog with full difficulty, XP, and subtask checklist options.'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border space-y-1.5" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between font-bold text-[var(--color-text-primary)]">
              <div className="flex items-center gap-1.5 text-[var(--color-accent)]">
                <Clock className="w-4 h-4" />
                <span>{language === 'vi' ? 'Đồng Hồ Focus Pomodoro' : 'Focus Pomodoro Timer'}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[var(--color-accent-light)] text-[var(--color-accent)]">Pomodoro</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {language === 'vi'
                ? 'Di chuột vào biểu tượng đồng hồ trên header để thấy nút mở rộng mượt mà "Pomodoro". Nhấp vào để khởi động phiên tập trung 25 phút giúp tăng năng suất tối đa.'
                : 'Hover over the clock icon to reveal the animated "Pomodoro" expansion. Click to launch a dedicated 25m focus session with audio notifications.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Omnibox Shortcut */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Search className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-bold">
            {language === 'vi'
              ? '3. Tạo Quest Siêu Nhanh Trên Thanh Địa Chỉ (Omnibox)'
              : '3. Instant Omnibox Address Bar Shortcut'}
          </h3>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {language === 'vi'
            ? 'Bạn không cần click mở Extension để tạo nhiệm vụ! Bạn có thể tạo ngay từ thanh URL của trình duyệt:'
            : "You don't need to open the extension popup! Create quests directly from your browser's address bar:"}
        </p>

        <div className="p-3 rounded-lg border font-mono text-xs space-y-2" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              {language === 'vi' ? 'Bước 1' : 'Step 1'}
            </span>
            <span>
              {language === 'vi'
                ? 'Click vào thanh URL (hoặc nhấn '
                : 'Click the URL address bar (or press '}
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)]">Ctrl+L</kbd> / <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)]">Cmd+L</kbd>)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              {language === 'vi' ? 'Bước 2' : 'Step 2'}
            </span>
            <span>
              {language === 'vi' ? 'Gõ ' : 'Type '}
              <strong className="text-[var(--color-accent)]">dq</strong>
              {language === 'vi' ? ' rồi nhấn phím ' : ' and press '}
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)]">Space</kbd>
              {language === 'vi' ? ' hoặc ' : ' or '}
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)]">Tab</kbd>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              {language === 'vi' ? 'Bước 3' : 'Step 3'}
            </span>
            <span>
              {language === 'vi'
                ? 'Nhập tên nhiệm vụ (ví dụ: '
                : 'Type your task title (e.g., '}
              <code>{language === 'vi' ? 'Đọc 20 trang sách' : 'Read 20 pages'}</code>
              {language === 'vi' ? ') rồi nhấn ' : ') then hit '}
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)]">Enter</kbd>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-xp)' }} />
          <span>
            <strong>{language === 'vi' ? 'Mẹo:' : 'Pro Tip:'}</strong>{' '}
            {language === 'vi'
              ? 'Gõ thêm (daily) ở cuối (ví dụ: Chạy bộ 3km (daily)) để tạo quest lặp lại mỗi ngày!'
              : 'Add (daily) at the end (e.g., Morning Run 3km (daily)) to automatically create a recurring daily quest!'}
          </span>
        </div>
      </div>

      {/* 3. Context Menu Quick Add */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <MousePointerClick className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
          <h3 className="text-sm font-bold">
            {language === 'vi' ? '4. Bôi Đen Văn Bản Tạo Quest (Context Menu)' : '4. Right-Click Text Selection Quick Add'}
          </h3>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {language === 'vi'
            ? 'Khi bạn đang đọc tài liệu, lướt Jira, GitHub issue hoặc email và thấy một đầu việc cần làm:'
            : 'Whenever you find an action item in Jira, GitHub issues, Slack, or web articles:'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <div className="font-bold text-[var(--color-text-primary)]">
              {language === 'vi' ? '1. Bôi đen văn bản' : '1. Highlight text'}
            </div>
            <p className="text-[11px] mt-1 text-[var(--color-text-secondary)]">
              {language === 'vi'
                ? 'Chọn đoạn text chứa nội dung công việc bạn muốn thực hiện.'
                : 'Select the text containing the task you want to execute.'}
            </p>
          </div>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <div className="font-bold text-[var(--color-text-primary)]">
              {language === 'vi' ? '2. Click chuột phải' : '2. Right-click'}
            </div>
            <p className="text-[11px] mt-1 text-[var(--color-text-secondary)]">
              {language === 'vi'
                ? 'Menu chuột phải của trình duyệt sẽ hiển thị tùy chọn DailyQuest.'
                : 'Your browser context menu will display the DailyQuest option.'}
            </p>
          </div>
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <div className="font-bold text-[var(--color-text-primary)]">
              {language === 'vi' ? '3. Chọn "Add to DailyQuest"' : '3. Click "Add to DailyQuest"'}
            </div>
            <p className="text-[11px] mt-1 text-[var(--color-text-secondary)]">
              {language === 'vi'
                ? 'Nhiệm vụ được tạo ngay và hiển thị lên danh sách hôm nay!'
                : "The quest is instantly captured and added to today's quest list!"}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Keyboard Shortcuts & Power Navigation */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Keyboard className="w-5 h-5" style={{ color: 'var(--color-xp)' }} />
          <h3 className="text-sm font-bold">
            {language === 'vi' ? '5. Phím Tắt Tiện Lợi & Điều Hướng (Vim Navigation)' : '5. Keyboard Shortcuts & Vim Navigation'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi' ? 'Tạo Quest mới' : 'New Quest'}
            </span>
            <kbd className="px-2 py-0.5 font-mono font-bold rounded border text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>N</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi' ? 'Chọn quest tiếp theo' : 'Next Quest'}
            </span>
            <kbd className="px-2 py-0.5 font-mono font-bold rounded border text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>J / ↓</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi' ? 'Chọn quest phía trước' : 'Previous Quest'}
            </span>
            <kbd className="px-2 py-0.5 font-mono font-bold rounded border text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>K / ↑</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi' ? 'Hoàn thành quest chọn' : 'Complete Quest'}
            </span>
            <kbd className="px-2 py-0.5 font-mono font-bold rounded border text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>X</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi' ? 'Bỏ qua hôm nay' : 'Skip Quest'}
            </span>
            <kbd className="px-2 py-0.5 font-mono font-bold rounded border text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>S</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'vi' ? 'Bật Pomodoro Focus' : 'Start Focus'}
            </span>
            <kbd className="px-2 py-0.5 font-mono font-bold rounded border text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>P</kbd>
          </div>
        </div>
      </div>

      {/* 6. Recurrence & Streak Rules */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5" style={{ color: 'var(--color-xp)' }} />
          <h3 className="text-sm font-bold">
            {language === 'vi' ? '6. Quy Tắc Lặp Lại & Giữ Chuỗi (Streak)' : '6. Recurrence & Streak Mechanics'}
          </h3>
        </div>

        <div className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
            <div>
              <strong>{language === 'vi' ? 'Lặp Hàng Ngày (Daily) vs Hàng Tuần (Weekly):' : 'Daily vs Weekly Recurrence:'}</strong>{' '}
              {language === 'vi'
                ? 'Quest Daily sẽ xuất hiện mỗi ngày. Quest Weekly cho phép bạn tick chọn các thứ trong tuần (ví dụ: Thứ 2, 4, 6) và sẽ tự động lặp lại đúng các ngày đó hàng tuần.'
                : 'Daily quests repeat everyday. Weekly quests let you specify exact days of the week (e.g., Mon, Wed, Fri) and materialize only on those days.'}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
            <div>
              <strong>{language === 'vi' ? 'Chuỗi Streak (≥ 70%):' : 'Streak Qualification (≥ 70%):'}</strong>{' '}
              {language === 'vi'
                ? 'Mỗi ngày đạt điểm hoàn thành từ 70% trở lên được tính là 1 ngày thành công để duy trì và tăng chuỗi Streak.'
                : 'Reaching a daily completion score of 70% or higher qualifies as a successful day to keep and grow your streak.'}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
            <div>
              <strong>{language === 'vi' ? 'Bỏ qua (Skip) không bị phạt:' : 'Skipping without penalty:'}</strong>{' '}
              {language === 'vi'
                ? 'Nếu bạn chủ động chọn "Skip today" cho 1 quest, nhiệm vụ đó sẽ được loại khỏi mẫu số tính điểm, không làm giảm tỷ lệ % điểm của bạn.'
                : 'If you skip a quest ("Skip today"), it is excluded from the denominator so it does not penalize your daily completion score.'}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-xp)' }} />
            <div>
              <strong>{language === 'vi' ? 'Hệ số nhân thưởng Streak Combo (Streak Multiplier):' : 'Streak Combo XP Multiplier:'}</strong>{' '}
              {language === 'vi'
                ? 'Mỗi ngày duy trì chuỗi Streak bạn được cộng thêm +5% XP thưởng trên mọi nhiệm vụ hoàn thành (lên tới tối đa +50% XP ở chuỗi 10 ngày trở lên). Đạt mốc mục tiêu ngày (Daily Goal) còn thưởng thêm +25 XP năng suất!'
                : 'Each streak day grants a +5% bonus XP multiplier across all completed quests (up to +50% max combo bonus at 10+ streak days). Reaching your Daily Goal awards an additional +25 milestone XP!'}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Data Privacy & Backup */}
      <div
        className="p-5 rounded-xl border space-y-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Download className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-sm font-bold">
            {language === 'vi' ? '7. Bảo Mật Dữ Liệu & Sao Lưu (Local-First)' : '7. 100% Local-First Data Privacy & Backup'}
          </h3>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {language === 'vi'
            ? 'Toàn bộ dữ liệu của bạn được lưu 100% cục bộ trên trình duyệt thông qua IndexedDB (không gửi lên server bên ngoài). Bạn có thể sao lưu JSON định kỳ, đồng bộ Secret Gist cá nhân hoặc xuất Markdown Daily Notes (.md) bất cứ lúc nào.'
            : 'All your data is stored strictly in your browser IndexedDB engine. You can download JSON backups, sync to your private GitHub Gist, or export formatted Markdown Daily Notes (.md) anytime.'}
        </p>
      </div>

      {/* 8. Rank Progression */}
      <div
        className="p-5 rounded-xl border space-y-4"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <div>
            <h3 className="text-sm font-bold">
              {language === 'vi' ? '8. Hệ Thống Cấp Bậc & Cảnh Giới (Rank Progression)' : '8. Rank Progression System'}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {language === 'vi'
                ? 'Hệ thống cảnh giới ma thuật lũy thừa. Càng hoàn thành nhiều nhiệm vụ, bạn càng tích lũy linh hồn/XP để đột phá lên cảnh giới cao hơn.'
                : 'Exponential power progression system. Complete quests to accumulate XP and breakthrough to higher domains of power.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {SHADOW_SLAVE_RANKS.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-lg border flex flex-col justify-between gap-2.5 transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono flex items-center gap-1"
                  style={{
                    color: r.color,
                    backgroundColor: r.badgeBg,
                    borderColor: r.badgeBorder,
                  }}
                >
                  <Shield className="w-3 h-3" />
                  <span>{language === 'vi' ? r.titleVi : r.titleEn}</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-[var(--color-text-tertiary)]">
                  {r.maxLevel < 1000 ? `Lv.${r.minLevel} - ${r.maxLevel}` : `Lv.${r.minLevel}+`}
                </span>
              </div>

              <div>
                <div className="font-semibold text-xs text-[var(--color-text-primary)]">
                  {language === 'vi' ? r.classVi : r.classEn}
                </div>
                <p className="text-[11px] mt-0.5 text-[var(--color-text-secondary)] leading-relaxed">
                  {language === 'vi' ? r.descriptionVi : r.descriptionEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
