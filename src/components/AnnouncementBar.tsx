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

  // Build marquee string by combining all active announcement texts
  const announcementTexts = activeAnnouncements.map((ann) => {
    return `${ann.text}${ann.linkText ? ` — ${ann.linkText}` : ''}`;
  });

  const fullMarqueeString = announcementTexts.join('   ✦   ');

  return (
    <aside
      aria-label="Announcements"
      className="w-full bg-neutral-950 text-stone-200 h-9 sm:h-10 flex items-center overflow-hidden border-0 border-none outline-none shadow-none m-0 p-0 select-none cursor-pointer"
      onClick={onNavigateToShop}
    >
      <div className="w-full overflow-hidden flex items-center">
        {/* Continuous Marquee Track (Repeated for seamless infinite loop) */}
        <div className="animate-marquee shrink-0 flex items-center gap-12 text-[10.5px] sm:text-[11px] font-heading font-medium tracking-[0.2em] uppercase text-stone-200">
          <span>{fullMarqueeString}</span>
          <span>✦</span>
          <span>{fullMarqueeString}</span>
          <span>✦</span>
          <span>{fullMarqueeString}</span>
          <span>✦</span>
          <span>{fullMarqueeString}</span>
          <span>✦</span>
        </div>
      </div>
    </aside>
  );
};
