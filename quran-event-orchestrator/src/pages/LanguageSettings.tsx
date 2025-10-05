import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, RotateCcw, Languages, Search, Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// Translation key type
type TranslationKey = keyof typeof import('@/contexts/LanguageContext').Translations;

// Translation categories
const translationCategories = {
  common: {
    title: 'Common',
    keys: ['loading', 'error', 'success', 'cancel', 'save', 'delete', 'edit', 'add', 'search', 'filter', 'clear', 'confirm', 'back', 'next', 'previous']
  },
  navigation: {
    title: 'Navigation',
    keys: ['dashboard', 'users', 'events', 'parties', 'settings', 'logout']
  },
  auth: {
    title: 'Authentication',
    keys: ['signIn', 'username', 'password', 'welcomeBack', 'signInFailed', 'fillAllFields']
  },
  dashboard: {
    title: 'Dashboard',
    keys: ['overview', 'statistics', 'upcomingEvents', 'recentActivity', 'nearestParty', 'nearestEvent', 'party', 'event', 'organizedBy', 'dateAndTime', 'at', 'location', 'expectedParticipants', 'people', 'eventPurpose', 'participationType', 'meetingDetails', 'meetingDate', 'meetingPlace', 'noUpcomingParties', 'noPartiesScheduled', 'noPartiesDescription', 'allPartiesInSystem']
  },
  users: {
    title: 'Users',
    keys: ['userManagement', 'addNewUser', 'editUser', 'deleteUser', 'fullName', 'role', 'admin', 'coordinator', 'participant', 'permissions', 'created', 'updated', 'actions']
  },
  events: {
    title: 'Events',
    keys: ['eventManagement', 'createEvent', 'editEvent', 'deleteEvent', 'eventDetails', 'day', 'date', 'time', 'duration', 'place', 'participants', 'status', 'pending', 'confirmed', 'completed', 'cancelled']
  },
  messages: {
    title: 'Status Messages',
    keys: ['userCreated', 'userUpdated', 'userDeleted', 'eventCreated', 'eventUpdated', 'eventDeleted', 'accessDenied', 'onlyAdminsCan']
  }
};

export default function LanguageSettings() {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('common');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load current translations from localStorage or use defaults
    loadTranslations();
  }, [language]);

  const loadTranslations = () => {
    const savedTranslations = localStorage.getItem(`translations_${language}`);
    if (savedTranslations) {
      setTranslations(JSON.parse(savedTranslations));
    } else {
      // Load default translations
      const defaultTranslations = getDefaultTranslations();
      setTranslations(defaultTranslations);
    }
  };

  const getDefaultTranslations = () => {
    // This would normally come from the LanguageContext
    // For now, we'll create a basic structure
    const defaultTranslations: Record<string, string> = {};
    
    // Load all translation keys from categories
    Object.values(translationCategories).forEach(category => {
      category.keys.forEach(key => {
        defaultTranslations[key] = t[key as keyof typeof t] || '';
      });
    });
    
    return defaultTranslations;
  };

  const handleTranslationChange = (key: string, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const saveTranslations = () => {
    localStorage.setItem(`translations_${language}`, JSON.stringify(translations));
    setHasChanges(false);
    toast({
      title: "Translations Saved",
      description: `Language settings for ${language.toUpperCase()} have been saved successfully.`,
    });
  };

  const resetTranslations = () => {
    const defaultTranslations = getDefaultTranslations();
    setTranslations(defaultTranslations);
    setHasChanges(true);
  };

  const filteredKeys = Object.keys(translations).filter(key => {
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        translations[key].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = translationCategories[selectedCategory as keyof typeof translationCategories]?.keys.includes(key);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className={`px-1 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Language Settings
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Customize translation values for {language.toUpperCase()} language
        </p>
      </div>

      {/* Language Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Languages className="h-5 w-5" />
            Current Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              onClick={() => setLanguage('en')}
              className="flex items-center gap-2"
            >
              🇺🇸 English
            </Button>
            <Button
              variant={language === 'ar' ? 'default' : 'outline'}
              onClick={() => setLanguage('ar')}
              className="flex items-center gap-2"
            >
              🇸🇦 العربية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search translations</Label>
              <Input
                id="search"
                placeholder="Search by key or value..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isRTL ? 'text-right' : 'text-left'}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                {Object.entries(translationCategories).map(([key, category]) => (
                  <option key={key} value={key}>{category.title}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Translation Editor */}
      <Card>
        <CardHeader>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Filter className="h-5 w-5" />
                {translationCategories[selectedCategory as keyof typeof translationCategories]?.title} Translations
              </CardTitle>
              <CardDescription>
                Edit translation values for {language.toUpperCase()}
              </CardDescription>
            </div>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 mb-2 sm:mb-0">
                  Unsaved Changes
                </Badge>
              )}
              <div className={`flex flex-col sm:flex-row gap-2 w-full sm:w-auto ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTranslations}
                  className="flex items-center gap-1 w-full sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={saveTranslations}
                  disabled={!hasChanges}
                  className="flex items-center gap-1 w-full sm:w-auto"
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No translations found matching your search criteria.
              </div>
            ) : (
              filteredKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Label htmlFor={key} className="font-mono text-sm text-muted-foreground min-w-0 flex-shrink-0">
                      {key}
                    </Label>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${key}_en`} className="text-xs text-muted-foreground">English</Label>
                      <Input
                        id={`${key}_en`}
                        value={language === 'en' ? translations[key] : ''}
                        onChange={(e) => handleTranslationChange(key, e.target.value)}
                        className={isRTL ? 'text-right' : 'text-left'}
                        placeholder="English translation..."
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${key}_ar`} className="text-xs text-muted-foreground">Arabic</Label>
                      <Input
                        id={`${key}_ar`}
                        value={language === 'ar' ? translations[key] : ''}
                        onChange={(e) => handleTranslationChange(key, e.target.value)}
                        className={isRTL ? 'text-right' : 'text-left'}
                        placeholder="Arabic translation..."
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
