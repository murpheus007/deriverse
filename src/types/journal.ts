export type JournalEntry = {
  id: string;
  createdAt: string;
  tradeRef?: string;
  accountId?: string | null;
  title: string;
  strategyTag: string;
  mood: string;
  mistakes: string;
  lessons: string;
  screenshotUrls: string[];
  customTags: string[];
};

export type JournalEntryUpsert = {
  id?: string;
  tradeRef?: string;
  accountId?: string | null;
  title: string;
  strategyTag: string;
  mood: string;
  mistakes: string;
  lessons: string;
  screenshotUrls: string[];
  customTags: string[];
};
