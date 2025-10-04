import React, { createContext, useContext, useEffect, useState } from 'react';

// Translation types
interface Translations {
  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  filter: string;
  clear: string;
  confirm: string;
  back: string;
  next: string;
  previous: string;
  
  // Navigation
  dashboard: string;
  users: string;
  events: string;
  parties: string;
  settings: string;
  logout: string;
  
  // Auth
  signIn: string;
  username: string;
  password: string;
  welcomeBack: string;
  signInFailed: string;
  fillAllFields: string;
  
  // Dashboard
  overview: string;
  statistics: string;
  upcomingEvents: string;
  recentActivity: string;
  nearestParty: string;
  nearestEvent: string;
  party: string;
  event: string;
  organizedBy: string;
  dateAndTime: string;
  at: string;
  location: string;
  expectedParticipants: string;
  people: string;
  eventPurpose: string;
  participationType: string;
  meetingDetails: string;
  meetingDate: string;
  meetingPlace: string;
  noUpcomingParties: string;
  noPartiesScheduled: string;
  noPartiesDescription: string;
  allPartiesInSystem: string;
  
  // Users
  userManagement: string;
  addNewUser: string;
  editUser: string;
  deleteUser: string;
  fullName: string;
  role: string;
  admin: string;
  coordinator: string;
  participant: string;
  permissions: string;
  created: string;
  updated: string;
  actions: string;
  
  // Events
  eventManagement: string;
  createEvent: string;
  editEvent: string;
  deleteEvent: string;
  eventDetails: string;
  day: string;
  date: string;
  time: string;
  duration: string;
  place: string;
  participants: string;
  status: string;
  pending: string;
  confirmed: string;
  completed: string;
  cancelled: string;
  
  // Status messages
  userCreated: string;
  userUpdated: string;
  userDeleted: string;
  eventCreated: string;
  eventUpdated: string;
  eventDeleted: string;
  accessDenied: string;
  onlyAdminsCan: string;
}

// English translations
const enTranslations: Translations = {
  // Common
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  search: 'Search',
  filter: 'Filter',
  clear: 'Clear',
  confirm: 'Confirm',
  back: 'Back',
  next: 'Next',
  previous: 'Previous',
  
  // Navigation
  dashboard: 'Dashboard',
  users: 'Users',
  events: 'Events',
  parties: 'Parties',
  settings: 'Settings',
  logout: 'Logout',
  
  // Auth
  signIn: 'Sign In',
  username: 'Username',
  password: 'Password',
  welcomeBack: 'Welcome back!',
  signInFailed: 'Sign In Failed',
  fillAllFields: 'Please fill in all fields',
  
  // Dashboard
  overview: 'Overview',
  statistics: 'Statistics',
  upcomingEvents: 'Upcoming Events',
  recentActivity: 'Recent Activity',
  nearestParty: 'Nearest Party',
  nearestEvent: 'Nearest Event',
  party: 'Party',
  event: 'Event',
  organizedBy: 'Organized by',
  dateAndTime: 'Date & Time',
  at: 'at',
  location: 'Location',
  expectedParticipants: 'Expected Participants',
  people: 'people',
  eventPurpose: 'Event Purpose',
  participationType: 'Participation Type',
  meetingDetails: 'Meeting Details',
  meetingDate: 'Meeting Date',
  meetingPlace: 'Meeting Place',
  noUpcomingParties: 'No Upcoming Parties',
  noPartiesScheduled: 'No Parties Scheduled',
  noPartiesDescription: 'There are currently no confirmed parties scheduled. Check back later or create a new event.',
  allPartiesInSystem: 'All parties in the system',
  
  // Users
  userManagement: 'User Management',
  addNewUser: 'Add New User',
  editUser: 'Edit User',
  deleteUser: 'Delete User',
  fullName: 'Full Name',
  role: 'Role',
  admin: 'Admin',
  coordinator: 'Coordinator',
  participant: 'Participant',
  permissions: 'Permissions',
  created: 'Created',
  updated: 'Updated',
  actions: 'Actions',
  
  // Events
  eventManagement: 'Event Management',
  createEvent: 'Create Event',
  editEvent: 'Edit Event',
  deleteEvent: 'Delete Event',
  eventDetails: 'Event Details',
  day: 'Day',
  date: 'Date',
  time: 'Time',
  duration: 'Duration',
  place: 'Place',
  participants: 'Participants',
  status: 'Status',
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  
  // Status messages
  userCreated: 'User created successfully',
  userUpdated: 'User updated successfully',
  userDeleted: 'User deleted successfully',
  eventCreated: 'Event created successfully',
  eventUpdated: 'Event updated successfully',
  eventDeleted: 'Event deleted successfully',
  accessDenied: 'Access Denied',
  onlyAdminsCan: 'Only administrators can perform this action',
};

// Arabic translations
const arTranslations: Translations = {
  // Common
  loading: 'جاري التحميل...',
  error: 'خطأ',
  success: 'نجح',
  cancel: 'إلغاء',
  save: 'حفظ',
  delete: 'حذف',
  edit: 'تعديل',
  add: 'إضافة',
  search: 'بحث',
  filter: 'تصفية',
  clear: 'مسح',
  confirm: 'تأكيد',
  back: 'رجوع',
  next: 'التالي',
  previous: 'السابق',
  
  // Navigation
  dashboard: 'الصفحة الرئيسية',
  users: 'المستخدمين',
  events: 'ادارة المناسبات',
  parties: 'المناسبات',
  settings: 'الإعدادات',
  logout: 'تسجيل الخروج',
  
  // Auth
  signIn: 'تسجيل الدخول',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  welcomeBack: 'مرحباً بعودتك!',
  signInFailed: 'فشل تسجيل الدخول',
  fillAllFields: 'يرجى ملء جميع الحقول',
  
  // Dashboard
  overview: 'نظرة عامة',
  statistics: 'الإحصائيات',
  upcomingEvents: 'الأحداث القادمة',
  recentActivity: 'النشاط الأخير',
  nearestParty: 'أقرب حفلة',
  nearestEvent: 'أقرب فعالية',
  party: 'حفلة',
  event: 'فعالية',
  organizedBy: 'منظم بواسطة',
  dateAndTime: 'التاريخ والوقت',
  at: 'في',
  location: 'الموقع',
  expectedParticipants: 'المشاركون المتوقعون',
  people: 'أشخاص',
  eventPurpose: 'غرض الحدث',
  participationType: 'نوع المشاركة',
  meetingDetails: 'تفاصيل الاجتماع',
  meetingDate: 'تاريخ الاجتماع',
  meetingPlace: 'مكان الاجتماع',
  noUpcomingParties: 'لا توجد حفلات قادمة',
  noPartiesScheduled: 'لا توجد حفلات مجدولة',
  noPartiesDescription: 'لا توجد حالياً حفلات مؤكدة مجدولة. تحقق مرة أخرى لاحقاً أو أنشئ حدثاً جديداً.',
  allPartiesInSystem: 'جميع الحفلات في النظام',
  
  // Users
  userManagement: 'إدارة المستخدمين',
  addNewUser: 'إضافة مستخدم جديد',
  editUser: 'تعديل المستخدم',
  deleteUser: 'حذف المستخدم',
  fullName: 'الاسم الكامل',
  role: 'الدور',
  admin: 'مدير',
  coordinator: 'منسق',
  participant: 'مشارك',
  permissions: 'الصلاحيات',
  created: 'تاريخ الإنشاء',
  updated: 'تاريخ التحديث',
  actions: 'الإجراءات',
  
  // Events
  eventManagement: 'إدارة الأحداث',
  createEvent: 'إنشاء حدث',
  editEvent: 'تعديل الحدث',
  deleteEvent: 'حذف الحدث',
  eventDetails: 'تفاصيل الحدث',
  day: 'اليوم',
  date: 'التاريخ',
  time: 'الوقت',
  duration: 'المدة',
  place: 'المكان',
  participants: 'المشاركون',
  status: 'الحالة',
  pending: 'معلق',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  
  // Status messages
  userCreated: 'تم إنشاء المستخدم بنجاح',
  userUpdated: 'تم تحديث المستخدم بنجاح',
  userDeleted: 'تم حذف المستخدم بنجاح',
  eventCreated: 'تم إنشاء الحدث بنجاح',
  eventUpdated: 'تم تحديث الحدث بنجاح',
  eventDeleted: 'تم حذف الحدث بنجاح',
  accessDenied: 'تم رفض الوصول',
  onlyAdminsCan: 'يمكن للمديرين فقط تنفيذ هذا الإجراء',
};

interface LanguageContextType {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'ar' | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
    // Update document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Get translations with custom overrides
  const getTranslations = () => {
    const baseTranslations = language === 'ar' ? arTranslations : enTranslations;
    
    // Load custom translations from localStorage
    const customTranslations = localStorage.getItem(`translations_${language}`);
    if (customTranslations) {
      try {
        const parsed = JSON.parse(customTranslations);
        return { ...baseTranslations, ...parsed };
      } catch (error) {
        console.error('Error parsing custom translations:', error);
      }
    }
    
    return baseTranslations;
  };

  const translations = getTranslations();
  const isRTL = language === 'ar';

  const value = {
    language,
    setLanguage,
    t: translations,
    isRTL,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
