import type { Language, Section } from './types';

const messages = {
  gu: {
    app: 'મારો હિસાબ', subtitle: 'વ્યક્તિગત એન્ટ્રી સોફ્ટવેર',
    buta: 'બુટા', top: 'ટોપ', names: 'નામ', searchNames: 'નામ શોધો...',
    addName: 'નવું નામ', noNames: 'હજુ કોઈ નામ નથી', noNamesHint: 'શરૂ કરવા માટે નવું નામ ઉમેરો.',
    noResults: 'કોઈ પરિણામ મળ્યું નથી', name: 'નામ', save: 'સાચવો', cancel: 'રદ કરો',
    rename: 'નામ બદલો', deleteName: 'નામ કાઢી નાખો', confirmDeleteName: 'આ નામ અને તેની બધી એન્ટ્રીઓ કાયમ માટે કાઢી નાખવી છે?',
    edit: 'સુધારો', deleteShort: 'કાઢો', actions: 'ક્રિયા',
    back: 'પાછા', date: 'તારીખ', entries: 'એન્ટ્રીઓ', addEntry: 'એન્ટ્રી ઉમેરો',
    titleOptional: 'વિગત (વૈકલ્પિક)', quantity: 'નંગ', price: 'ભાવ', total: 'કુલ',
    grandTotal: 'કુલ રકમ', complete: 'પૂર્ણ', entry: 'એન્ટ્રી',
    noEntries: 'આ તારીખે કોઈ એન્ટ્રી નથી', noEntriesHint: 'નવી એન્ટ્રી ઉમેરો અથવા બીજી તારીખ પસંદ કરો.',
    all: 'બધી', pending: 'બાકી', done: 'પૂર્ણ', more: 'વધુ વિકલ્પો',
    changeDate: 'એન્ટ્રીની તારીખ બદલો', removeEntry: 'એન્ટ્રી કાઢો',
    confirmDeleteEntry: 'આ એન્ટ્રી કાયમ માટે કાઢી નાખવી છે?',
    searchEntries: 'વિગત અથવા રકમ શોધો...', saved: 'સાચવ્યું', saving: 'સાચવી રહ્યું છે...',
    retry: 'ફરી પ્રયાસ કરો', saveError: 'ફેરફારો સાચવાયા નથી. ફરી પ્રયાસ કરો.',
    loadError: 'ડેટા લોડ થતો નથી. સર્વર અને MongoDB તપાસો.',
    duplicate: 'આ નામ પહેલેથી છે.', genericError: 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.',
    itemCount: 'એન્ટ્રી', daily: 'પસંદ કરેલી તારીખ', close: 'બંધ કરો',
  },
  en: {
    app: 'My Ledger', subtitle: 'Personal entry software',
    buta: 'Buta', top: 'Top', names: 'Names', searchNames: 'Search names...',
    addName: 'Add name', noNames: 'No names yet', noNamesHint: 'Add your first name to get started.',
    noResults: 'No matching results', name: 'Name', save: 'Save', cancel: 'Cancel',
    rename: 'Rename', deleteName: 'Delete name', confirmDeleteName: 'Delete this name and all its entries permanently?',
    edit: 'Edit', deleteShort: 'Delete', actions: 'Actions',
    back: 'Back', date: 'Date', entries: 'Entries', addEntry: 'Add entry',
    titleOptional: 'Title (optional)', quantity: 'Quantity', price: 'Price', total: 'Total',
    grandTotal: 'Grand total', complete: 'Done', entry: 'Entry',
    noEntries: 'No entries for this date', noEntriesHint: 'Add an entry or select another date.',
    all: 'All', pending: 'Pending', done: 'Done', more: 'More options',
    changeDate: 'Change entry date', removeEntry: 'Delete entry',
    confirmDeleteEntry: 'Delete this entry permanently?',
    searchEntries: 'Search title or amount...', saved: 'Saved', saving: 'Saving...',
    retry: 'Retry', saveError: 'Changes are not saved. Please retry.',
    loadError: 'Could not load data. Check the server and MongoDB connection.',
    duplicate: 'This name already exists.', genericError: 'Something went wrong. Please try again.',
    itemCount: 'entries', daily: 'Selected date', close: 'Close',
  },
} as const;
export type TranslationKey = keyof typeof messages.en;
export function t(lang: Language, key: TranslationKey): string { return messages[lang][key]; }
export function sectionLabel(lang: Language, section: Section): string { return t(lang, section); }
