import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import type { ReactNode } from 'react';

interface TabsProps {
  tabs: Array<{ key: string; label: string; content: ReactNode }>;
}

export function Tabs({ tabs }: TabsProps) {
  return (
    <TabGroup>
      <TabList className="flex gap-2 rounded-xl bg-slate-100 p-1">
        {tabs.map((item) => (
          <Tab
            key={item.key}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 data-selected:bg-white data-selected:text-slate-900 data-selected:shadow-sm"
          >
            {item.label}
          </Tab>
        ))}
      </TabList>
      <TabPanels className="mt-4">
        {tabs.map((item) => (
          <TabPanel key={item.key}>{item.content}</TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
