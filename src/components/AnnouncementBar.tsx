import React from 'react';
import { AnnouncementItem } from '../types';

interface AnnouncementBarProps {
  announcements: AnnouncementItem[];
  onNavigateToShop?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  announcements,
  onNavigateToShop
}) => {
  const activeAnnouncements = announcements.filter((item) => {
    if (!item.active) return false;
    const nowTime = Date.now();

    if (item.startDate) {
      const startTime = new Date(item.startDate).getTime();
      if (!isNaN(startTime) && nowTime < startTime) return false;
    }
    if (item.endDate) {
      let endTime = new Date(item.endDate).getTime();
      if (item.endDate.length === 10) {
        endTime = new Date(`${item.endDate}T23:59:59`).getTime();
      }
      if (!isNaN(endTime) && nowTime > endTime) return false;
    }
    return true;
  });

  if (activeAnnouncements.length === 0) return null;

  // Uniform repeat for seamless infinite loop
  const repeatCount = activeAnnouncements.length < 3 ? 4 : 2;
  const repeatedItems = Array(repeatCount).fill(activeAnnouncements).flat();

  return (
    <aside
      aria-label="Announcements"
      className="w-full bg-neutral-950 text-stone-200 h-7 sm:h-8 flex items-center overflow-hidden border-0 border-none outline-none shadow-none m-0 p-0 select-none cursor-pointer"
      onClick={onNavigateToShop}
    >
      <div className="w-full overflow-hidden flex items-center">
        {/* Continuous Marquee Track with identical uniform gap between all items */}
        <div className="animate-marquee shrink-0 flex items-center gap-8 sm:gap-10 text-[9.5px] sm:text-[10px] font-heading font-medium tracking-[0.2em] uppercase text-stone-200">
          {repeatedItems.map((ann, idx) => (
            <React.Fragment key={`${ann.id}-${idx}`}>
              <span className="whitespace-nowrap">
                {ann.text}{ann.linkText ? ` - ${ann.linkText}` : ''}
              </span>
              <span className="text-stone-400 text-xs shrink-0 select-none">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </aside>
  );
};
