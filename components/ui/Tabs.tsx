'use client';

interface Tab { label: string; value: string; }

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={`inline-flex bg-gray-100 p-1 rounded-[10px] gap-1${className ? ` ${className}` : ''}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-2 py-2 rounded-[8px] text-sm font-medium transition-all
            ${activeTab === tab.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
