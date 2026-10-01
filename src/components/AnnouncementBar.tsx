import React from 'react';
import { Megaphone, ArrowRight } from 'lucide-react';
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
      // If only YYYY-MM-DD date provided, set until end of the date
      if (item.endDate.length === 10) {
        endTime = new Date(`${item.endDate}T23:59:59`).getTime();
      }
      if (!isNaN(endTime) && nowTime > endTime) return false;
    }
    return true;
  });

  if (activeAnnouncements.length === 0) return null;

  return (
    <aside
      aria-label="Announcements and offers"
      className="bg-neutral-900 text-neutral-100 overflow-hidden py-2 px-4 shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full justify-center text-center">
          <Megaphone className="h-4 w-4 shrink-0 text-amber-400" />
          {activeAnnouncements.map((ann, idx) => (
            <div key={ann.id || idx} className="inline-flex items-center gap-2">
              <span>{ann.text}</span>
              {ann.linkText && (
                <button
                  type="button"
                  onClick={onNavigateToShop}
                  className="font-bold underline text-amber-300 hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{ann.linkText}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
