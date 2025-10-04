import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, Users, ArrowUpDown, ArrowUp, ArrowDown, Music, Shirt, Car, Camera, Eye, Share2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// Event type
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

export default function ViewParties() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewEventOpen, setViewEventOpen] = useState(false);
  const [eventToView, setEventToView] = useState<Event | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        setEvents([]);
        return;
      }

      const response = await fetch('/api/events/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle paginated response - extract results array
      if (data && data.results && Array.isArray(data.results)) {
        setEvents(data.results);
      } else if (Array.isArray(data)) {
        setEvents(data);
      } else {
        console.error('Expected array or paginated response but got:', typeof data, data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsByStatus = (status: string) => {
    return events.filter(event => event.status === status);
  };

  const sortEvents = (events: Event[]) => {
    if (!sortConfig.key || !sortConfig.direction) return events;

    return [...events].sort((a, b) => {
      const getValue = (event: Event, key: string) => {
        switch (key) {
          case 'date':
            return new Date(event.date).getTime();
          case 'time':
            return event.time;
          case 'duration':
            return event.duration;
          case 'participants':
            return event.number_of_participants;
          case 'place':
            return event.place;
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
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewEvent = (event: Event) => {
    setEventToView(event);
    setViewEventOpen(true);
  };

  const handleShareEvent = (event: Event) => {
    generateEventPDF(event);
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

  const EventCard = ({ event }: { event: Event }) => (
    <Card className={`hover:shadow-lg transition-all duration-200 ${isRTL ? 'border-r-4 border-r-primary' : 'border-l-4 border-l-primary'}`}>
      <CardHeader className="pb-3">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CardTitle className={`text-lg font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{event.day} {t.event}</CardTitle>
          <Badge 
            variant={event.status === 'completed' ? 'default' : 
                    event.status === 'cancelled' ? 'destructive' : 
                    event.status === 'confirmed' ? 'secondary' : 'outline'}
            className="capitalize"
          >
            {event.status}
          </Badge>
        </div>
        {event.participation_type && (
          <CardDescription className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
            {event.participation_type} • {event.event_reason}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Calendar className="h-4 w-4 text-primary" />
            <span className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{formatDate(event.date)}</span>
          </div>
          <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="h-4 w-4 text-primary" />
            <span className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{event.time}</span>
          </div>
        </div>

        {/* Location and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
            <MapPin className="h-4 w-4" />
            <span className={`truncate ${isRTL ? 'text-right' : 'text-left'}`}>{event.place}</span>
          </div>
          <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="h-4 w-4" />
            <span className={isRTL ? 'text-right' : 'text-left'}>{event.duration} min</span>
          </div>
        </div>

        {/* Participants */}
        <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Users className="h-4 w-4" />
          <span className={isRTL ? 'text-right' : 'text-left'}>{event.number_of_participants} {t.participants}</span>
          {event.participants && event.participants.length > 0 && (
            <span className={`text-primary ${isRTL ? 'text-right' : 'text-left'}`}>({event.participants.length} selected)</span>
          )}
        </div>

        {/* Additional Details */}
        {(event.meeting_time || event.vehicle || event.camera_man) && (
          <div className="pt-2 border-t border-muted">
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              {event.meeting_time && (
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="h-3 w-3" />
                  <span className={isRTL ? 'text-right' : 'text-left'}>Meeting: {event.meeting_time}</span>
                </div>
              )}
              {event.vehicle && (
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Car className="h-3 w-3" />
                  <span className={isRTL ? 'text-right' : 'text-left'}>Vehicle: {event.vehicle}</span>
                </div>
              )}
              {event.camera_man && (
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Camera className="h-3 w-3" />
                  <span className={isRTL ? 'text-right' : 'text-left'}>Camera: {event.camera_man}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Songs and Dress Details */}
        {(event.songs?.length || event.dress_details?.length) && (
          <div className="pt-2 border-t border-muted">
            <div className={`flex gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
              {event.songs && event.songs.length > 0 && (
                <Button variant="outline" size="sm" className={`text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Music className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  Songs ({event.songs.length})
                </Button>
              )}
              {event.dress_details && event.dress_details.length > 0 && (
                <Button variant="outline" size="sm" className={`text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Shirt className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  Dress ({event.dress_details.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`flex gap-2 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline" size="sm" className={`flex-1 ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => handleViewEvent(event)}>
            <Eye className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            View
          </Button>
          <Button variant="outline" size="sm" className={`flex-1 ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => handleShareEvent(event)}>
            <Share2 className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className={`px-1 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.parties}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {t.allPartiesInSystem}
        </p>
      </div>

      {/* Sorting Controls */}
      <Card>
        <CardContent className="p-4">
          <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Sort by:</span>
              <Select value={sortConfig.key || ''} onValueChange={handleSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="participants">Participants</SelectItem>
                  <SelectItem value="place">Place</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="updated">Updated Date</SelectItem>
                </SelectContent>
              </Select>
              {sortConfig.key && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort(sortConfig.key!)}
                  className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {getSortIcon(sortConfig.key)}
                  <span className="capitalize">
                    {sortConfig.direction === 'asc' ? 'A to Z' : 'Z to A'}
                  </span>
                </Button>
              )}
            </div>
            <div className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
              {events.length} total events
              {sortConfig.key && sortConfig.direction && (
                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-primary`}>
                  • Sorted by {sortConfig.key} ({sortConfig.direction === 'asc' ? 'A to Z' : 'Z to A'})
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className={isRTL ? 'text-right' : 'text-left'}>Pending ({filterEventsByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="completed" className={isRTL ? 'text-right' : 'text-left'}>Completed ({filterEventsByStatus('completed').length})</TabsTrigger>
          <TabsTrigger value="cancelled" className={isRTL ? 'text-right' : 'text-left'}>Cancelled ({filterEventsByStatus('cancelled').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortEvents(filterEventsByStatus('pending')).length === 0 ? (
              <div className={`col-span-full text-center py-8 text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                No pending events
              </div>
            ) : (
              sortEvents(filterEventsByStatus('pending')).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </TabsContent>


        <TabsContent value="completed" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortEvents(filterEventsByStatus('completed')).length === 0 ? (
              <div className={`col-span-full text-center py-8 text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                No completed events
              </div>
            ) : (
              sortEvents(filterEventsByStatus('completed')).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortEvents(filterEventsByStatus('cancelled')).length === 0 ? (
              <div className={`col-span-full text-center py-8 text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                No cancelled events
              </div>
            ) : (
              sortEvents(filterEventsByStatus('cancelled')).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Event Dialog */}
      <Dialog open={viewEventOpen} onOpenChange={setViewEventOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>Event Details</DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              Complete information about this event
            </DialogDescription>
          </DialogHeader>
          {eventToView && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Day & Date</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{eventToView.day} - {formatDate(eventToView.date)}</p>
                </div>
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Time & Duration</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{eventToView.time} ({eventToView.duration} minutes)</p>
                </div>
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Place</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{eventToView.place}</p>
                </div>
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Participants</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{eventToView.number_of_participants}</p>
                </div>
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Participation Type</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{eventToView.participation_type || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Status</Label>
                  <Badge variant={eventToView.status === 'completed' ? 'default' : 
                          eventToView.status === 'cancelled' ? 'destructive' : 
                          eventToView.status === 'confirmed' ? 'secondary' : 'outline'}>
                    {eventToView.status.charAt(0).toUpperCase() + eventToView.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              {eventToView.event_reason && (
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Event Reason</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{eventToView.event_reason}</p>
                </div>
              )}

              {eventToView.meeting_date && (
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Meeting Details</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                    Date: {formatDate(eventToView.meeting_date)}<br/>
                    Time: {eventToView.meeting_time || 'N/A'}<br/>
                    Place: {eventToView.place_of_meeting || 'N/A'}
                  </p>
                </div>
              )}

              {eventToView.vehicle && (
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Logistics</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                    Vehicle: {eventToView.vehicle}<br/>
                    Camera Person: {eventToView.camera_man || 'N/A'}
                  </p>
                </div>
              )}

              {eventToView.songs && eventToView.songs.length > 0 && (
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Songs Used</Label>
                  <ul className={`text-sm list-disc ${isRTL ? 'list-inside text-right' : 'list-inside text-left'}`}>
                    {eventToView.songs.map((song, index) => (
                      <li key={index}>{song.title}</li>
                    ))}
                  </ul>
                </div>
              )}

              {eventToView.dress_details && eventToView.dress_details.length > 0 && (
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Dress Details</Label>
                  <ul className={`text-sm list-disc ${isRTL ? 'list-inside text-right' : 'list-inside text-left'}`}>
                    {eventToView.dress_details.map((detail, index) => (
                      <li key={index}>{detail.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Created</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{formatDate(eventToView.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <Label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>Last Updated</Label>
                  <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{formatDate(eventToView.updated_at)}</p>
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
    </div>
  );
}