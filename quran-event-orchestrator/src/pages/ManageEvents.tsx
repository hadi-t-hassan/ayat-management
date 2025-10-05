import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Clock, Plus, Edit, Trash2, X, CheckCircle, XCircle, AlertCircle, Eye, Share2, FileText, ArrowUpDown, ArrowUp, ArrowDown, Music, Shirt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/utils/api';

// Types
interface Event {
  id: string;
  day: string;
  date: string;
  time: string;
  duration: number;
  place: string;
  number_of_participants: number;
  status: string;
  created_at: string;
  updated_at: string;
  meeting_time?: string;
  meeting_date?: string;
  place_of_meeting?: string;
  vehicle?: string;
  camera_man?: string;
  participation_type?: string;
  event_reason?: string;
  songs?: Array<{id: number; title: string; artist?: string; duration?: number; order: number; created_at: string}>;
  dress_details?: Array<{id: number; description: string; order: number; created_at: string}>;
  participants?: Array<{id: number; user: string; user_id: number; user_name: string; joined_at: string; is_confirmed: boolean}>;
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  name: string;
  role: string;
  permissions?: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ManageEvents() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [fetchingProfiles, setFetchingProfiles] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [viewEventOpen, setViewEventOpen] = useState(false);
  const [bulkShareOpen, setBulkShareOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [eventToComplete, setEventToComplete] = useState<string | null>(null);
  const [eventToCancel, setEventToCancel] = useState<string | null>(null);
  const [eventToView, setEventToView] = useState<Event | null>(null);
  const [selectedEventsForShare, setSelectedEventsForShare] = useState<string[]>([]);
  const [songsDialogOpen, setSongsDialogOpen] = useState(false);
  const [dressDialogOpen, setDressDialogOpen] = useState(false);
  const [eventForDetails, setEventForDetails] = useState<Event | null>(null);
  const [filters, setFilters] = useState({
    day: '',
    date: '',
    time: '',
    place: '',
    participation_type: '',
    event_reason: '',
    status: 'all',
    meeting_date: '',
    vehicle: '',
    camera_man: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null
  });

  const [eventForm, setEventForm] = useState({
    day: '',
    date: '',
    time: '',
    duration: '',
    place: '',
    number_of_participants: '',
    meeting_time: '',
    meeting_date: '',
    place_of_meeting: '',
    vehicle: '',
    camera_man: '',
    participation_type: '',
    event_reason: '',
    songs_used: [''],
    dress_details: [''],
    participants: [],
  });

  useEffect(() => {
    fetchEvents();
    fetchProfiles();
  }, []);


  const fetchEvents = async () => {
    try {
      const response = await apiGet('/events/');
      
      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data;
      console.log('Fetched events from API:', data);
      
      // Handle paginated response - extract results array
      if (data && data.results && Array.isArray(data.results)) {
        console.log('Setting events from paginated response:', data.results);
        setEvents(data.results);
      } else if (Array.isArray(data)) {
        console.log('Setting events from direct array:', data);
        setEvents(data);
      } else {
        console.error('Expected array or paginated response but got:', typeof data, data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setFetchingEvents(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      setFetchingProfiles(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch('/api/users/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle paginated response - extract results array
      if (data && data.results && Array.isArray(data.results)) {
        setProfiles(data.results);
      } else if (Array.isArray(data)) {
        // Handle direct array response
        setProfiles(data);
      } else {
        console.error('Expected array or paginated response but got:', typeof data, data);
        setProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setFetchingProfiles(false);
    }
  };

  const addSongField = () => {
    setEventForm({
      ...eventForm,
      songs_used: [...eventForm.songs_used, '']
    });
  };

  const removeSongField = (index: number) => {
    if (eventForm.songs_used.length > 1) {
      const newSongs = eventForm.songs_used.filter((_, i) => i !== index);
      setEventForm({
        ...eventForm,
        songs_used: newSongs
      });
    }
  };

  const updateSongField = (index: number, value: string) => {
    const newSongs = [...eventForm.songs_used];
    newSongs[index] = value;
    setEventForm({
      ...eventForm,
      songs_used: newSongs
    });
  };

  const addDressDetailField = () => {
    setEventForm({
      ...eventForm,
      dress_details: [...eventForm.dress_details, '']
    });
  };

  const removeDressDetailField = (index: number) => {
    if (eventForm.dress_details.length > 1) {
      const newDressDetails = eventForm.dress_details.filter((_, i) => i !== index);
      setEventForm({
        ...eventForm,
        dress_details: newDressDetails
      });
    }
  };

  const updateDressDetailField = (index: number, value: string) => {
    const newDressDetails = [...eventForm.dress_details];
    newDressDetails[index] = value;
    setEventForm({
      ...eventForm,
      dress_details: newDressDetails
    });
  };

  const handleParticipantChange = (userId: number, checked: boolean) => {
    if (checked) {
      setEventForm({
        ...eventForm,
        participants: [...eventForm.participants, userId],
        number_of_participants: (eventForm.participants.length + 1).toString()
      });
    } else {
      const newParticipants = eventForm.participants.filter(id => id !== userId);
      setEventForm({
        ...eventForm,
        participants: newParticipants,
        number_of_participants: newParticipants.length.toString()
      });
    }
  };

  const handleStatusUpdate = async (eventId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({
          title: "Error",
          description: "No access token found",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/events/${eventId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedEvent = await response.json();
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? updatedEvent : event
        )
      );
      toast({
        title: "Status Updated",
        description: `Event status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating event status:', error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <AlertCircle className="h-4 w-4" />;
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredEvents = events.filter(event => {
    // Global search - search across all fields
    const globalSearchMatch = !globalSearch || [
      event.day,
      formatDate(event.date),
      event.time,
      event.place,
      event.participation_type || '',
      event.event_reason || '',
      event.status,
      event.meeting_date ? formatDate(event.meeting_date) : '',
      event.vehicle || '',
      event.camera_man || '',
      event.number_of_participants.toString(),
      event.duration.toString()
    ].some(field => field.toLowerCase().includes(globalSearch.toLowerCase()));

    // Date range filter
    const dateRangeMatch = (() => {
      if (!dateRange.from && !dateRange.to) return true;
      
      const eventDate = new Date(event.date);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;
      
      if (fromDate && toDate) {
        return eventDate >= fromDate && eventDate <= toDate;
      } else if (fromDate) {
        return eventDate >= fromDate;
      } else if (toDate) {
        return eventDate <= toDate;
      }
      return true;
    })();

    // Individual field filters
    const fieldFiltersMatch = (
      (!filters.day || event.day.toLowerCase().includes(filters.day.toLowerCase())) &&
      (!filters.date || formatDate(event.date).includes(filters.date)) &&
      (!filters.time || event.time.includes(filters.time)) &&
      (!filters.place || event.place.toLowerCase().includes(filters.place.toLowerCase())) &&
      (!filters.participation_type || (event.participation_type && event.participation_type.toLowerCase().includes(filters.participation_type.toLowerCase()))) &&
      (!filters.event_reason || (event.event_reason && event.event_reason.toLowerCase().includes(filters.event_reason.toLowerCase()))) &&
      (!filters.status || filters.status === 'all' || event.status.toLowerCase().includes(filters.status.toLowerCase())) &&
      (!filters.meeting_date || (event.meeting_date && formatDate(event.meeting_date).includes(filters.meeting_date))) &&
      (!filters.vehicle || (event.vehicle && event.vehicle.toLowerCase().includes(filters.vehicle.toLowerCase()))) &&
      (!filters.camera_man || (event.camera_man && event.camera_man.toLowerCase().includes(filters.camera_man.toLowerCase())))
    );

    return globalSearchMatch && fieldFiltersMatch && dateRangeMatch;
  });

  // Apply sorting to filtered events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;

    const getValue = (event: Event, key: string) => {
      switch (key) {
        case 'day':
          return event.day;
        case 'date':
          return new Date(event.date).getTime();
        case 'time':
          return event.time;
        case 'date_time':
          // Combined date and time sorting for nearest events
          const eventDateTime = new Date(`${event.date}T${event.time}`);
          return eventDateTime.getTime();
        case 'duration':
          return event.duration;
        case 'place':
          return event.place;
        case 'participants':
          return event.number_of_participants;
        case 'participation_type':
          return event.participation_type || '';
        case 'event_reason':
          return event.event_reason || '';
        case 'meeting_date':
          return event.meeting_date ? new Date(event.meeting_date).getTime() : 0;
        case 'meeting_time':
          return event.meeting_time || '';
        case 'meeting_place':
          return event.place_of_meeting || '';
        case 'vehicle':
          return event.vehicle || '';
        case 'camera_man':
          return event.camera_man || '';
        case 'songs_count':
          return event.songs_used ? event.songs_used.length : 0;
        case 'dress_count':
          return event.dress_details ? event.dress_details.length : 0;
        case 'selected_participants':
          return event.participants ? event.participants.length : 0;
        case 'status':
          return event.status;
        case 'created':
          return new Date(event.created_at).getTime();
        case 'updated':
          return new Date(event.updated_at).getTime();
        default:
          return '';
      }
    };

    const aValue = getValue(a, sortConfig.key);
    const bValue = getValue(b, sortConfig.key);

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const clearFilters = () => {
    setFilters({
      day: '',
      date: '',
      time: '',
      place: '',
      participation_type: '',
      event_reason: '',
      status: 'all',
      meeting_date: '',
      vehicle: '',
      camera_man: ''
    });
    setGlobalSearch('');
    setDateRange({ from: '', to: '' });
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        // Same column clicked - cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
      // New column clicked - start with asc
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4 text-primary" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4 text-primary" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  const handleExportToExcel = () => {
    // Create CSV content (Excel-compatible)
    const headers = [
      'Day', 'Date', 'Time', 'Duration (min)', 'Place', 'Participants',
      'Participation Type', 'Event Reason', 'Meeting Date', 'Meeting Time',
      'Meeting Place', 'Vehicle', 'Camera Man', 'Songs Used', 'Dress Details',
      'Status', 'Created', 'Updated'
    ];

    const csvContent = [
      headers.join(','),
      ...sortedEvents.map(event => [
        `"${event.day}"`,
        `"${formatDate(event.date)}"`,
        `"${event.time}"`,
        event.duration,
        `"${event.place}"`,
        event.number_of_participants,
        `"${event.participation_type || 'N/A'}"`,
        `"${event.event_reason || 'N/A'}"`,
        `"${event.meeting_date ? formatDate(event.meeting_date) : 'N/A'}"`,
        `"${event.meeting_time || 'N/A'}"`,
        `"${event.place_of_meeting || 'N/A'}"`,
        `"${event.vehicle || 'N/A'}"`,
        `"${event.camera_man || 'N/A'}"`,
        `"${event.songs ? event.songs.map(song => song.title).join('; ') : 'N/A'}"`,
        `"${event.dress_details ? event.dress_details.map(detail => detail.description).join('; ') : 'N/A'}"`,
        `"${event.status}"`,
        `"${formatDate(event.created_at)}"`,
        `"${formatDate(event.updated_at)}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quran-events-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${sortedEvents.length} events exported to Excel file`,
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({
          title: "Error",
          description: "No access token found",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/events/${eventId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast({
        title: "Event Deleted",
        description: "Event has been removed successfully",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      day: event.day,
      date: event.date,
      time: event.time,
      duration: event.duration.toString(),
      place: event.place,
      number_of_participants: event.number_of_participants.toString(),
      meeting_time: event.meeting_time || '',
      meeting_date: event.meeting_date || '',
      place_of_meeting: event.place_of_meeting || '',
      vehicle: event.vehicle || '',
      camera_man: event.camera_man || '',
      participation_type: event.participation_type || '',
      event_reason: event.event_reason || '',
      songs_used: event.songs ? event.songs.map(song => song.title) : [''],
      dress_details: event.dress_details ? event.dress_details.map(detail => detail.description) : [''],
      participants: event.participants ? event.participants.map(p => p.user_id) : []
    });
    setDialogOpen(true);
  };

  const handleDeleteConfirm = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteConfirmOpen(true);
  };

  const handleCompleteConfirm = (eventId: string) => {
    setEventToComplete(eventId);
    setCompleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      handleDeleteEvent(eventToDelete);
      setEventToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const confirmComplete = () => {
    if (eventToComplete) {
      handleStatusUpdate(eventToComplete, 'completed');
      setEventToComplete(null);
    }
    setCompleteConfirmOpen(false);
  };

  const handleCancelConfirm = (eventId: string) => {
    setEventToCancel(eventId);
    setCancelConfirmOpen(true);
  };

  const confirmCancel = () => {
    if (eventToCancel) {
      handleStatusUpdate(eventToCancel, 'cancelled');
      setEventToCancel(null);
    }
    setCancelConfirmOpen(false);
  };

  const handleViewEvent = (event: Event) => {
    setEventToView(event);
    setViewEventOpen(true);
  };

  const handleViewSongs = (event: Event) => {
    setEventForDetails(event);
    setSongsDialogOpen(true);
  };

  const handleViewDressDetails = (event: Event) => {
    setEventForDetails(event);
    setDressDialogOpen(true);
  };

  const handleShareEvent = (event: Event) => {
    generateEventPDF(event);
  };

  const handleBulkShare = () => {
    setBulkShareOpen(true);
  };

  const handleSelectEventForShare = (eventId: string, checked: boolean) => {
    if (checked) {
      setSelectedEventsForShare(prev => [...prev, eventId]);
    } else {
      setSelectedEventsForShare(prev => prev.filter(id => id !== eventId));
    }
  };

  const handleSelectAllEvents = (checked: boolean) => {
    if (checked) {
      setSelectedEventsForShare(events.map(event => event.id));
    } else {
      setSelectedEventsForShare([]);
    }
  };

  const generateEventPDF = (event: Event) => {
    const eventDetails = `
Quran Event Details
===================

Event Information:
- Day: ${event.day}
- Date: ${formatDate(event.date)}
- Time: ${event.time}
- Duration: ${event.duration} minutes
- Place: ${event.place}

Participation Details:
- Type: ${event.participation_type || 'N/A'}
- Reason: ${event.event_reason || 'N/A'}
- Participants: ${event.number_of_participants}

Meeting Information:
- Meeting Date: ${event.meeting_date ? formatDate(event.meeting_date) : 'N/A'}
- Meeting Time: ${event.meeting_time || 'N/A'}
- Meeting Place: ${event.place_of_meeting || 'N/A'}

Logistics:
- Vehicle: ${event.vehicle || 'N/A'}
- Camera Person: ${event.camera_man || 'N/A'}

Songs Used:
${event.songs && event.songs.length > 0 
  ? event.songs.map(song => `- ${song.title}`).join('\n')
  : 'N/A'}

Dress Details:
${event.dress_details && event.dress_details.length > 0 
  ? event.dress_details.map(detail => `- ${detail.description}`).join('\n')
  : 'N/A'}

Status: ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
Created: ${formatDate(event.created_at)}
Updated: ${formatDate(event.updated_at)}
    `;

    // Create a blob with the event details
    const blob = new Blob([eventDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `quran-event-${event.day}-${event.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // For WhatsApp sharing, we'll use the text content
    const whatsappText = `*Quran Event Details*\n\n${eventDetails.replace(/=/g, '').replace(/-/g, '•')}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "Event Shared",
      description: "Event details have been shared via WhatsApp and downloaded as text file",
    });
  };

  const generateBulkEventsPDF = () => {
    if (selectedEventsForShare.length === 0) {
      toast({
        title: "No Events Selected",
        description: "Please select at least one event to share",
        variant: "destructive",
      });
      return;
    }

    const selectedEvents = events.filter(event => selectedEventsForShare.includes(event.id));
    
    const bulkEventDetails = `
Quran Events Summary
====================

Total Events: ${selectedEvents.length}
Generated: ${new Date().toLocaleDateString()}

${selectedEvents.map((event, index) => `
Event ${index + 1}:
- Day: ${event.day}
- Date: ${formatDate(event.date)}
- Time: ${event.time}
- Duration: ${event.duration} minutes
- Place: ${event.place}
- Participants: ${event.number_of_participants}
- Status: ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
- Participation Type: ${event.participation_type || 'N/A'}
- Reason: ${event.event_reason || 'N/A'}
${event.songs && event.songs.length > 0 ? `- Songs: ${event.songs.map(song => song.title).join(', ')}` : ''}
${event.dress_details && event.dress_details.length > 0 ? `- Dress: ${event.dress_details.map(detail => detail.description).join(', ')}` : ''}
`).join('\n')}
    `;

    // Create a blob with the bulk event details
    const blob = new Blob([bulkEventDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `quran-events-bulk-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // For WhatsApp sharing
    const whatsappText = `*Quran Events Summary*\n\n${bulkEventDetails.replace(/=/g, '').replace(/-/g, '•')}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "Events Shared",
      description: `${selectedEvents.length} events have been shared via WhatsApp and downloaded as text file`,
    });

    setBulkShareOpen(false);
    setSelectedEventsForShare([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventForm.day || !eventForm.date || !eventForm.time || !eventForm.place || !eventForm.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const confirmSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setConfirmDialogOpen(false);

    try {
      if (editingEvent) {
        // Update existing event - save to database
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast({
            title: "Error",
            description: "No access token found",
            variant: "destructive",
          });
          return;
        }

        const eventData = {
          day: eventForm.day,
          date: eventForm.date,
          time: eventForm.time,
          duration: parseInt(eventForm.duration),
          place: eventForm.place,
          number_of_participants: parseInt(eventForm.number_of_participants) || 0,
          meeting_time: eventForm.meeting_time || null,
          meeting_date: eventForm.meeting_date || null,
          place_of_meeting: eventForm.place_of_meeting || null,
          vehicle: eventForm.vehicle || null,
          camera_man: eventForm.camera_man || null,
          participation_type: eventForm.participation_type || null,
          event_reason: eventForm.event_reason || null,
          songs_data: eventForm.songs_used.filter(song => song.trim() !== '').map(song => ({ title: song, artist: '', duration: null })),
          dress_details_data: eventForm.dress_details.filter(detail => detail.trim() !== ''),
          participants_data: eventForm.participants,
        };

        const response = await fetch(`/api/events/${editingEvent.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const updatedEvent = await response.json();
        setEvents(prev => prev.map(event => event.id === editingEvent.id ? updatedEvent : event));
        setEditingEvent(null);

        toast({
          title: "Success!",
          description: "Event has been updated successfully",
        });
      } else {
        // Create new event - save to database
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast({
            title: "Error",
            description: "No access token found",
            variant: "destructive",
          });
          return;
        }

        const eventData = {
          day: eventForm.day,
          date: eventForm.date,
          time: eventForm.time,
          duration: parseInt(eventForm.duration),
          place: eventForm.place,
          number_of_participants: parseInt(eventForm.number_of_participants) || 0,
          status: 'pending', // Always start as pending
          meeting_time: eventForm.meeting_time || null,
          meeting_date: eventForm.meeting_date || null,
          place_of_meeting: eventForm.place_of_meeting || null,
          vehicle: eventForm.vehicle || null,
          camera_man: eventForm.camera_man || null,
          participation_type: eventForm.participation_type || null,
          event_reason: eventForm.event_reason || null,
          songs_data: eventForm.songs_used.filter(song => song.trim() !== '').map(song => ({ title: song, artist: '', duration: null })),
          dress_details_data: eventForm.dress_details.filter(detail => detail.trim() !== ''),
          participants_data: eventForm.participants,
        };

        const response = await fetch('/api/events/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const newEvent = await response.json();
        console.log('Created event from API:', newEvent);
        setEvents(prev => [newEvent, ...prev]);

        toast({
          title: "Success!",
          description: "Event has been created successfully",
        });
      }

      // Reset form
      setEventForm({
        day: '',
        date: '',
        time: '',
        duration: '',
        place: '',
        number_of_participants: '',
        meeting_time: '',
        meeting_date: '',
        place_of_meeting: '',
        vehicle: '',
        camera_man: '',
        participation_type: '',
        event_reason: '',
        songs_used: [''],
        dress_details: [''],
        participants: [],
      });

      setDialogOpen(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 md:space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`px-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.eventManagement}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t.createAndManageEvents}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleBulkShare} variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Events
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingEvent(null);
            // Reset form when closing
            setEventForm({
              day: '',
              date: '',
              time: '',
              duration: '',
              place: '',
              number_of_participants: '',
              meeting_time: '',
              meeting_date: '',
              place_of_meeting: '',
              vehicle: '',
              camera_man: '',
              participation_type: '',
              event_reason: '',
              songs_used: [''],
              dress_details: [''],
              participants: []
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Update the event details' : 'Fill in the event details below'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="day">Day *</Label>
                  <Input
                    id="day"
                    placeholder="e.g., Friday"
                    value={eventForm.day}
                    onChange={(e) => setEventForm({ ...eventForm, day: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 120"
                    value={eventForm.duration}
                    onChange={(e) => setEventForm({ ...eventForm, duration: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="place">Place *</Label>
                  <Input
                    id="place"
                    placeholder="Event location"
                    value={eventForm.place}
                    onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Number of Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    placeholder="Expected participants"
                    value={eventForm.number_of_participants}
                    onChange={(e) => setEventForm({ ...eventForm, number_of_participants: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting_time">Meeting Time</Label>
                  <Input
                    id="meeting_time"
                    type="time"
                    value={eventForm.meeting_time}
                    onChange={(e) => setEventForm({ ...eventForm, meeting_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting_date">Meeting Date</Label>
                  <Input
                    id="meeting_date"
                    type="date"
                    value={eventForm.meeting_date}
                    onChange={(e) => setEventForm({ ...eventForm, meeting_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="place_of_meeting">Place of Meeting</Label>
                  <Input
                    id="place_of_meeting"
                    placeholder="Meeting location"
                    value={eventForm.place_of_meeting}
                    onChange={(e) => setEventForm({ ...eventForm, place_of_meeting: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle</Label>
                  <Input
                    id="vehicle"
                    placeholder="Transportation details"
                    value={eventForm.vehicle}
                    onChange={(e) => setEventForm({ ...eventForm, vehicle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="camera_man">Camera Man</Label>
                  <Input
                    id="camera_man"
                    placeholder="Camera operator"
                    value={eventForm.camera_man}
                    onChange={(e) => setEventForm({ ...eventForm, camera_man: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participation_type">Type of Participation</Label>
                  <Input
                    id="participation_type"
                    placeholder="e.g., Recitation, Listening, etc."
                    value={eventForm.participation_type}
                    onChange={(e) => setEventForm({ ...eventForm, participation_type: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="event_reason">Reason of the Event</Label>
                  <Textarea
                    id="event_reason"
                    placeholder="Purpose or reason for this event"
                    value={eventForm.event_reason}
                    onChange={(e) => setEventForm({ ...eventForm, event_reason: e.target.value })}
                  />
                </div>
              </div>

              {/* Songs Used */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Songs Used</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSongField}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Song
                  </Button>
                </div>
                <div className="space-y-2">
                  {eventForm.songs_used.map((song, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Song ${index + 1}`}
                        value={song}
                        onChange={(e) => updateSongField(index, e.target.value)}
                      />
                      {eventForm.songs_used.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSongField(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dress Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dress Details</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDressDetailField}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Dress Detail
                  </Button>
                </div>
                <div className="space-y-2">
                  {eventForm.dress_details.map((detail, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Dress requirement ${index + 1}`}
                        value={detail}
                        onChange={(e) => updateDressDetailField(index, e.target.value)}
                      />
                      {eventForm.dress_details.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDressDetailField(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Participants Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Select Participants</Label>
                  <span className="text-sm text-muted-foreground">
                    {eventForm.participants.length} selected
                  </span>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 bg-muted/20">
                  <div className="max-h-48 overflow-y-auto space-y-3">
                    {fetchingProfiles ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
                      </div>
                    ) : profiles.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No users available</p>
                        <p className="text-xs text-muted-foreground mt-1">Profiles count: {profiles.length}</p>
                      </div>
                    ) : (
                      profiles.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`participant-${user.id}`}
                            checked={eventForm.participants.includes(parseInt(user.id))}
                            onCheckedChange={(checked) => handleParticipantChange(parseInt(user.id), checked as boolean)}
                          />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={`participant-${user.id}`} 
                              className="text-sm font-medium cursor-pointer flex items-center space-x-2"
                            >
                              <span className="truncate">{user.name}</span>
                              <span className="text-muted-foreground">(@{user.username})</span>
                            </Label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {eventForm.participants.length > 0 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
                    <p className="text-sm font-medium text-primary">
                      ✓ {eventForm.participants.length} participant{eventForm.participants.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingEvent ? 'Update Event' : 'Create Event'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Confirm Event Update' : 'Confirm Event Creation'}</DialogTitle>
            <DialogDescription>
              {editingEvent 
                ? 'Are you sure you want to update this event with the provided details?'
                : 'Are you sure you want to create this event with the provided details?'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              No, Cancel
            </Button>
            <Button onClick={confirmSubmit} disabled={loading}>
              {editingEvent ? 'Yes, Update Event' : 'Yes, Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Events List
              </CardTitle>
              <CardDescription>
                All events in the system ({sortedEvents.length} of {events.length} shown)
                {sortConfig.key && sortConfig.direction && (
                  <span className="ml-2 text-primary">
                    • Sorted by {sortConfig.key} ({sortConfig.direction === 'asc' ? 'A to Z' : 'Z to A'})
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleSort('date_time')}
                className="gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Nearest Events</span>
                <span className="sm:hidden">Nearest</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleExportToExcel}
                className="gap-2 w-full sm:w-auto"
                size="sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 w-full sm:w-auto"
                size="sm"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                <span className="sm:hidden">{showFilters ? 'Hide' : 'Filters'}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="space-y-4">
              {/* Global Search */}
              <div className="space-y-2">
                <Label htmlFor="global-search">Global Search</Label>
                <Input
                  id="global-search"
                  placeholder="Search across all fields..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Search across day, date, time, place, participation type, reason, status, and more...
                </p>
              </div>
              
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Date Range Filter</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Filter events within a specific date range
                </p>
              </div>
              
              {/* Individual Filters */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="filter-day">Day</Label>
                <Input
                  id="filter-day"
                  placeholder="Filter by day..."
                  value={filters.day}
                  onChange={(e) => setFilters(prev => ({ ...prev, day: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-date">Date</Label>
                <Input
                  id="filter-date"
                  placeholder="Filter by date..."
                  value={filters.date}
                  onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-time">Time</Label>
                <Input
                  id="filter-time"
                  placeholder="Filter by time..."
                  value={filters.time}
                  onChange={(e) => setFilters(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-place">Place</Label>
                <Input
                  id="filter-place"
                  placeholder="Filter by place..."
                  value={filters.place}
                  onChange={(e) => setFilters(prev => ({ ...prev, place: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-participation">Participation Type</Label>
                <Input
                  id="filter-participation"
                  placeholder="Filter by participation..."
                  value={filters.participation_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, participation_type: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-reason">Event Reason</Label>
                <Input
                  id="filter-reason"
                  placeholder="Filter by reason..."
                  value={filters.event_reason}
                  onChange={(e) => setFilters(prev => ({ ...prev, event_reason: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-meeting-date">Meeting Date</Label>
                <Input
                  id="filter-meeting-date"
                  placeholder="Filter by meeting date..."
                  value={filters.meeting_date}
                  onChange={(e) => setFilters(prev => ({ ...prev, meeting_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-vehicle">Vehicle</Label>
                <Input
                  id="filter-vehicle"
                  placeholder="Filter by vehicle..."
                  value={filters.vehicle}
                  onChange={(e) => setFilters(prev => ({ ...prev, vehicle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-camera">Camera Man</Label>
                <Input
                  id="filter-camera"
                  placeholder="Filter by camera man..."
                  value={filters.camera_man}
                  onChange={(e) => setFilters(prev => ({ ...prev, camera_man: e.target.value }))}
                />
              </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Events List
          </CardTitle>
          <CardDescription>
            All events in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchingEvents ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('day')}
                    >
                      <div className="flex items-center gap-2">
                        Day
                        {getSortIcon('day')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        {getSortIcon('date')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[80px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('time')}
                    >
                      <div className="flex items-center gap-2">
                        Time
                        {getSortIcon('time')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[120px] cursor-pointer hover:bg-muted/50 select-none bg-primary/5"
                      onClick={() => handleSort('date_time')}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4" />
                        Nearest
                        {getSortIcon('date_time')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[80px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('duration')}
                    >
                      <div className="flex items-center gap-2">
                        Duration
                        {getSortIcon('duration')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[120px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('place')}
                    >
                      <div className="flex items-center gap-2">
                        Place
                        {getSortIcon('place')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('participants')}
                    >
                      <div className="flex items-center gap-2">
                        Participants
                        {getSortIcon('participants')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[120px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('participation_type')}
                    >
                      <div className="flex items-center gap-2">
                        Participation Type
                        {getSortIcon('participation_type')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[150px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('event_reason')}
                    >
                      <div className="flex items-center gap-2">
                        Event Reason
                        {getSortIcon('event_reason')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('meeting_date')}
                    >
                      <div className="flex items-center gap-2">
                        Meeting Date
                        {getSortIcon('meeting_date')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('meeting_time')}
                    >
                      <div className="flex items-center gap-2">
                        Meeting Time
                        {getSortIcon('meeting_time')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[120px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('meeting_place')}
                    >
                      <div className="flex items-center gap-2">
                        Meeting Place
                        {getSortIcon('meeting_place')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('vehicle')}
                    >
                      <div className="flex items-center gap-2">
                        Vehicle
                        {getSortIcon('vehicle')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('camera_man')}
                    >
                      <div className="flex items-center gap-2">
                        Camera Man
                        {getSortIcon('camera_man')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[150px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('songs_count')}
                    >
                      <div className="flex items-center gap-2">
                        Songs Used
                        {getSortIcon('songs_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[150px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('dress_count')}
                    >
                      <div className="flex items-center gap-2">
                        Dress Details
                        {getSortIcon('dress_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('created')}
                    >
                      <div className="flex items-center gap-2">
                        Created
                        {getSortIcon('created')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('updated')}
                    >
                      <div className="flex items-center gap-2">
                        Updated
                        {getSortIcon('updated')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[200px] min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={20} className="text-center py-8 text-muted-foreground">
                        {events.length === 0 ? 'No events found. Create your first event!' : 'No events match the current filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                            <p className="font-medium">{event.day}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{formatDate(event.date)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.time}</p>
                        </TableCell>
                        <TableCell className="bg-primary/5">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary" />
                            <p className="text-sm font-medium">
                              {new Date(`${event.date}T${event.time}`).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.duration} min</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.place}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.number_of_participants}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.participation_type || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm truncate" title={event.event_reason || 'N/A'}>
                            {event.event_reason || 'N/A'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.meeting_date ? formatDate(event.meeting_date) : 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.meeting_time || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.place_of_meeting || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.vehicle || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.camera_man || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px]">
                            {event.songs && event.songs.length > 0 ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => handleViewSongs(event)}
                              >
                                <Music className="h-3 w-3 mr-1" />
                                Songs ({event.songs.length})
                              </Button>
                            ) : (
                              <p className="text-sm text-muted-foreground">N/A</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px]">
                            {event.dress_details && event.dress_details.length > 0 ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => handleViewDressDetails(event)}
                              >
                                <Shirt className="h-3 w-3 mr-1" />
                                Dress ({event.dress_details.length})
                              </Button>
                            ) : (
                              <p className="text-sm text-muted-foreground">N/A</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusBadgeVariant(event.status)}
                            className={`status-${event.status} flex items-center gap-1`}
                          >
                            {getStatusIcon(event.status)}
                            {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{formatDate(event.created_at)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{formatDate(event.updated_at)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            {event.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCompleteConfirm(event.id)}
                                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Mark as completed"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelConfirm(event.id)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Cancel event"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="View event details"
                              onClick={() => handleViewEvent(event)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Edit event"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                              title="Share event"
                              onClick={() => handleShareEvent(event)}
                            >
                              <Share2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              title="Delete event"
                              onClick={() => handleDeleteConfirm(event.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              No, Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Yes, Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Dialog */}
      <Dialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Complete</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this event as completed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteConfirmOpen(false)}>
              No, Cancel
            </Button>
            <Button onClick={confirmComplete}>
              Yes, Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancel</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this event?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>
              No, Cancel
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Yes, Cancel Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={viewEventOpen} onOpenChange={setViewEventOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Complete information about this event
            </DialogDescription>
          </DialogHeader>
          {eventToView && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Day & Date</Label>
                  <p className="text-sm">{eventToView.day} - {formatDate(eventToView.date)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Time & Duration</Label>
                  <p className="text-sm">{eventToView.time} ({eventToView.duration} minutes)</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Place</Label>
                  <p className="text-sm">{eventToView.place}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Participants</Label>
                  <p className="text-sm">{eventToView.number_of_participants}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Participation Type</Label>
                  <p className="text-sm">{eventToView.participation_type || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusBadgeVariant(eventToView.status)}>
                    {eventToView.status ? eventToView.status.charAt(0).toUpperCase() + eventToView.status.slice(1) : 'Unknown'}
                  </Badge>
                </div>
              </div>
              
              {eventToView.event_reason && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Event Reason</Label>
                  <p className="text-sm">{eventToView.event_reason}</p>
                </div>
              )}

              {eventToView.meeting_date && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Meeting Details</Label>
                  <p className="text-sm">
                    Date: {formatDate(eventToView.meeting_date)}<br/>
                    Time: {eventToView.meeting_time || 'N/A'}<br/>
                    Place: {eventToView.place_of_meeting || 'N/A'}
                  </p>
                </div>
              )}

              {eventToView.vehicle && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Logistics</Label>
                  <p className="text-sm">
                    Vehicle: {eventToView.vehicle}<br/>
                    Camera Person: {eventToView.camera_man || 'N/A'}
                  </p>
                </div>
              )}

              {eventToView.songs && eventToView.songs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Songs Used</Label>
                  <ul className="text-sm list-disc list-inside">
                    {eventToView.songs.map((song, index) => (
                      <li key={index}>{song.title}</li>
                    ))}
                  </ul>
                </div>
              )}

              {eventToView.dress_details && eventToView.dress_details.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dress Details</Label>
                  <ul className="text-sm list-disc list-inside">
                    {eventToView.dress_details.map((detail, index) => (
                      <li key={index}>{detail.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{formatDate(eventToView.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm">{formatDate(eventToView.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewEventOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Share Events Dialog */}
      <Dialog open={bulkShareOpen} onOpenChange={setBulkShareOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Events</DialogTitle>
            <DialogDescription>
              Select events to share as PDF via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedEventsForShare.length === events.length}
                onCheckedChange={handleSelectAllEvents}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Select All Events ({events.length})
              </Label>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.map((event) => (
                <div key={event.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={`event-${event.id}`}
                    checked={selectedEventsForShare.includes(event.id)}
                    onCheckedChange={(checked) => handleSelectEventForShare(event.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`event-${event.id}`} className="text-sm font-medium">
                      {event.day} - {formatDate(event.date)} at {event.time}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {event.place} • {event.number_of_participants} participants • {event.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {selectedEventsForShare.length > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
                <p className="text-sm font-medium text-primary">
                  ✓ {selectedEventsForShare.length} event{selectedEventsForShare.length !== 1 ? 's' : ''} selected for sharing
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateBulkEventsPDF} disabled={selectedEventsForShare.length === 0}>
              <Share2 className="h-4 w-4 mr-2" />
              Share {selectedEventsForShare.length} Event{selectedEventsForShare.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Songs Dialog */}
      <Dialog open={songsDialogOpen} onOpenChange={setSongsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Songs Used</DialogTitle>
            <DialogDescription>
              Songs for this event
            </DialogDescription>
          </DialogHeader>
          {eventForDetails && (
            <div className="space-y-2">
              {eventForDetails.songs && eventForDetails.songs.length > 0 ? (
                <ul className="space-y-2">
                  {eventForDetails.songs.map((song, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Music className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{song.title}</p>
                        {song.artist && <p className="text-sm text-muted-foreground">{song.artist}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No songs specified for this event.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSongsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dress Details Dialog */}
      <Dialog open={dressDialogOpen} onOpenChange={setDressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dress Details</DialogTitle>
            <DialogDescription>
              Dress requirements for this event
            </DialogDescription>
          </DialogHeader>
          {eventForDetails && (
            <div className="space-y-2">
              {eventForDetails.dress_details && eventForDetails.dress_details.length > 0 ? (
                <ul className="space-y-2">
                  {eventForDetails.dress_details.map((detail, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Shirt className="h-4 w-4 text-primary" />
                      <p className="font-medium">{detail.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No dress details specified for this event.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDressDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}