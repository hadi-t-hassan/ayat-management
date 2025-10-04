import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, PartyPopper, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiGet } from '@/utils/api';

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
}

interface EventStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState<EventStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  });
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [nearestEvent, setNearestEvent] = useState<Event | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);


  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data
      const dashboardResponse = await apiGet('/dashboard/');
      
      if (dashboardResponse.error) {
        throw new Error(dashboardResponse.error);
      }
      
      const dashboardData = dashboardResponse.data;
      
      // Update stats with real data
      setStats({
        total: dashboardData.stats.total_events,
        pending: dashboardData.stats.pending_events,
        confirmed: dashboardData.stats.confirmed_events,
        cancelled: dashboardData.stats.cancelled_events,
        completed: dashboardData.stats.completed_events,
      });
      
      // Set upcoming event if available
      setUpcomingEvent(dashboardData.upcoming_event);
      
      // Set total users
      setTotalUsers(dashboardData.total_users);

      // Fetch all events to find the nearest one
      const eventsResponse = await apiGet('/events/');
      
      if (!eventsResponse.error) {
        const eventsData = eventsResponse.data;
        const events = eventsData.results || eventsData || [];
        
        // Find the nearest event (closest to today)
        if (events.length > 0) {
          const today = new Date();
          const futureEvents = events.filter((event: Event) => {
            const eventDate = new Date(event.date);
            return eventDate >= today; // Only future events
          });
          
          if (futureEvents.length > 0) {
            const nearestEvent = futureEvents.sort((a: Event, b: Event) => {
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              return dateA.getTime() - dateB.getTime();
            })[0];
            
            setNearestEvent(nearestEvent);
          } else {
            setNearestEvent(null);
          }
        } else {
          setNearestEvent(null);
        }
      } else {
        setNearestEvent(null);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Welcome Header */}
      <div className={`px-1 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t.welcomeBack} {profile?.name}!
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {t.overview}
        </p>
      </div>

      {/* Nearest Party/Event Banner */}
      {upcomingEvent ? (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-6 w-6" />
              <span className="text-xl">{t.nearestParty}</span>
              <Badge variant="secondary" className={`ml-auto bg-white/20 text-white border-white/30 ${isRTL ? 'mr-auto ml-0' : ''}`}>
                {upcomingEvent.status.charAt(0).toUpperCase() + upcomingEvent.status.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="bg-white/20 rounded-full p-2">
                  <PartyPopper className="h-5 w-5 text-white" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="text-2xl font-bold">{upcomingEvent.day} {t.party}</h3>
                  <p className="text-white/90 text-sm">{t.organizedBy} {upcomingEvent.created_by_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-white/20 rounded p-2">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-white/80">{t.dateAndTime}</p>
                    <p className="font-semibold">{formatDate(upcomingEvent.date)} {t.at} {upcomingEvent.time}</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-white/20 rounded p-2">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-white/80">{t.location}</p>
                    <p className="font-semibold">{upcomingEvent.place}</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-white/20 rounded p-2">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-white/80">{t.expectedParticipants}</p>
                    <p className="font-semibold">{upcomingEvent.number_of_participants} {t.people}</p>
                  </div>
                </div>
              </div>
              
              {upcomingEvent.event_reason && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className={`text-sm text-white/80 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t.eventPurpose}</p>
                  <p className={`text-white font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{upcomingEvent.event_reason}</p>
                </div>
              )}

              {/* Additional Party Details */}
              {upcomingEvent.participation_type && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className={`text-sm text-white/80 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t.participationType}</p>
                  <p className={`text-white font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{upcomingEvent.participation_type}</p>
                </div>
              )}

              {upcomingEvent.meeting_date && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className={`text-sm text-white/80 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t.meetingDetails}</p>
                  <p className={`text-white font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.meetingDate}: {formatDate(upcomingEvent.meeting_date)} {upcomingEvent.meeting_time && `- ${upcomingEvent.meeting_time}`}
                  </p>
                  {upcomingEvent.place_of_meeting && (
                    <p className={`text-white/90 text-sm mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t.meetingPlace}: {upcomingEvent.place_of_meeting}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : nearestEvent ? (
        <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-2 text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-6 w-6" />
              <span className="text-xl">{t.nearestEvent}</span>
              <Badge variant="secondary" className={`ml-auto bg-white/20 text-white border-white/30 ${isRTL ? 'mr-auto ml-0' : ''}`}>
                {nearestEvent.status.charAt(0).toUpperCase() + nearestEvent.status.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="bg-white/20 rounded-full p-2">
                  <PartyPopper className="h-5 w-5 text-white" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="text-2xl font-bold">{nearestEvent.day} {t.event}</h3>
                  <p className="text-white/90 text-sm">{t.organizedBy} {nearestEvent.created_by_name || 'System'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-white/20 rounded p-2">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-white/80">{t.dateAndTime}</p>
                    <p className="font-semibold">{formatDate(nearestEvent.date)} {t.at} {nearestEvent.time}</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-white/20 rounded p-2">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-white/80">{t.location}</p>
                    <p className="font-semibold">{nearestEvent.place}</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-white/20 rounded p-2">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-white/80">{t.expectedParticipants}</p>
                    <p className="font-semibold">{nearestEvent.number_of_participants} {t.people}</p>
                  </div>
                </div>
              </div>
              
              {nearestEvent.event_reason && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className={`text-sm text-white/80 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t.eventPurpose}</p>
                  <p className={`text-white font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{nearestEvent.event_reason}</p>
                </div>
              )}

              {nearestEvent.participation_type && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className={`text-sm text-white/80 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t.participationType}</p>
                  <p className={`text-white font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{nearestEvent.participation_type}</p>
                </div>
              )}

              {nearestEvent.meeting_date && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className={`text-sm text-white/80 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t.meetingDetails}</p>
                  <p className={`text-white font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.meetingDate}: {formatDate(nearestEvent.meeting_date)} {nearestEvent.meeting_time && `- ${nearestEvent.meeting_time}`}
                  </p>
                  {nearestEvent.place_of_meeting && (
                    <p className={`text-white/90 text-sm mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t.meetingPlace}: {nearestEvent.place_of_meeting}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-gray-100 to-gray-200 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-2 text-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-6 w-6" />
              <span className="text-xl">{t.noUpcomingParties}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-6">
              <div className="bg-gray-300 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t.noPartiesScheduled}</h3>
              <p className="text-gray-600 text-sm">
                {t.noPartiesDescription}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All events in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered system users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Events</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              Ready to proceed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Events</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Event Status Overview</CardTitle>
          <CardDescription>
            Current status distribution of all events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              {getStatusIcon('pending')}
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-xs text-muted-foreground">{stats.pending} events</p>
              </div>
              <Badge variant="secondary" className="status-pending ml-auto">
                {stats.pending}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {getStatusIcon('confirmed')}
              <div>
                <p className="text-sm font-medium">Confirmed</p>
                <p className="text-xs text-muted-foreground">{stats.confirmed} events</p>
              </div>
              <Badge variant="secondary" className="status-confirmed ml-auto">
                {stats.confirmed}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {getStatusIcon('completed')}
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-xs text-muted-foreground">{stats.completed} events</p>
              </div>
              <Badge variant="secondary" className="status-completed ml-auto">
                {stats.completed}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {getStatusIcon('cancelled')}
              <div>
                <p className="text-sm font-medium">Cancelled</p>
                <p className="text-xs text-muted-foreground">{stats.cancelled} events</p>
              </div>
              <Badge variant="secondary" className="status-cancelled ml-auto">
                {stats.cancelled}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}