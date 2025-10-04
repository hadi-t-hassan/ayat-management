from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Event, Song, EventParticipant, EventStats
from .serializers import (
    EventSerializer, EventCreateSerializer, EventUpdateSerializer,
    EventStatsSerializer, DashboardSerializer
)

User = get_user_model()



class EventListView(generics.ListCreateAPIView):
    """List and create events"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EventCreateSerializer
        return EventSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        # Return the created event with all related data
        return_serializer = EventSerializer(event)
        return Response(return_serializer.data, status=status.HTTP_201_CREATED)
    
    def get_queryset(self):
        queryset = Event.objects.select_related('created_by').prefetch_related('songs', 'dress_details', 'participants__user')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Sorting functionality
        sort_by = self.request.query_params.get('sort_by', 'date_time')
        sort_order = self.request.query_params.get('sort_order', 'asc')
        
        if sort_by == 'date_time':
            # Sort by date first, then by time
            if sort_order == 'desc':
                queryset = queryset.order_by('-date', '-time')
            else:  # asc
                queryset = queryset.order_by('date', 'time')
        elif sort_by == 'date':
            if sort_order == 'desc':
                queryset = queryset.order_by('-date')
            else:
                queryset = queryset.order_by('date')
        elif sort_by == 'time':
            if sort_order == 'desc':
                queryset = queryset.order_by('-time')
            else:
                queryset = queryset.order_by('time')
        elif sort_by == 'created':
            if sort_order == 'desc':
                queryset = queryset.order_by('-created_at')
            else:
                queryset = queryset.order_by('created_at')
        else:
            # Default sorting by date and time (nearest first)
            queryset = queryset.order_by('date', 'time')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Event detail view"""
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Event.objects.select_related('created_by').prefetch_related('songs', 'participants__user')
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return EventUpdateSerializer
        return EventSerializer
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        # Return the updated event with all related data
        return_serializer = EventSerializer(event)
        return Response(return_serializer.data)


class EventStatusUpdateView(APIView):
    """Update event status"""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
            new_status = request.data.get('status')
            
            if new_status not in ['pending', 'confirmed', 'completed', 'cancelled']:
                return Response(
                    {'error': 'Invalid status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Only admins and coordinators can update status
            if not (request.user.is_admin or request.user.is_coordinator):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            event.status = new_status
            event.save()
            
            return Response({
                'message': 'Event status updated successfully',
                'event': EventSerializer(event).data
            })
            
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class DashboardView(APIView):
    """Dashboard data endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get or create stats
        stats = EventStats.get_or_create_stats()
        stats.update_stats()
        
        # Get upcoming event (nearest event to current time, including pending)
        # First try to get future events
        upcoming_event = Event.objects.filter(
            date__gte=timezone.now().date()
        ).order_by('date', 'time').first()
        
        # If no future events, get the most recent event (nearest to today)
        if not upcoming_event:
            upcoming_event = Event.objects.order_by('date', 'time').first()
        
        # Get recent events
        recent_events = Event.objects.select_related('created_by').prefetch_related('songs')[:5]
        
        # Get total users
        total_users = User.objects.count()
        
        dashboard_data = {
            'stats': EventStatsSerializer(stats).data,
            'upcoming_event': EventSerializer(upcoming_event).data if upcoming_event else None,
            'recent_events': EventSerializer(recent_events, many=True).data,
            'total_users': total_users
        }
        
        return Response(dashboard_data)


class EventStatsView(APIView):
    """Event statistics endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get or create stats
        stats = EventStats.get_or_create_stats()
        stats.update_stats()
        
        return Response(EventStatsSerializer(stats).data)


class EventByStatusView(generics.ListAPIView):
    """Get events by status"""
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        status = self.kwargs.get('status')
        return Event.objects.filter(status=status).select_related('created_by').prefetch_related('songs', 'participants__user').order_by('-created_at')


class EventSearchView(generics.ListAPIView):
    """Search events"""
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Event.objects.select_related('created_by').prefetch_related('songs', 'dress_details', 'participants__user')
        
        # Search by place
        place = self.request.query_params.get('place')
        if place:
            queryset = queryset.filter(place__icontains=place)
        
        # Search by day
        day = self.request.query_params.get('day')
        if day:
            queryset = queryset.filter(day__icontains=day)
        
        # Search by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset.order_by('-created_at')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_events_view(request):
    """Get upcoming events"""
    events = Event.objects.filter(
        date__gte=timezone.now().date(),
        status__in=['pending', 'confirmed']
    ).select_related('created_by').prefetch_related('songs').order_by('date', 'time')
    
    return Response(EventSerializer(events, many=True).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def past_events_view(request):
    """Get past events"""
    events = Event.objects.filter(
        date__lt=timezone.now().date()
    ).select_related('created_by').prefetch_related('songs').order_by('-date', '-time')
    
    return Response(EventSerializer(events, many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_event_view(request, pk):
    """Join an event"""
    try:
        event = Event.objects.get(pk=pk)
        
        # Check if user is already a participant
        if EventParticipant.objects.filter(event=event, user=request.user).exists():
            return Response(
                {'error': 'Already joined this event'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create participation
        participant = EventParticipant.objects.create(
            event=event,
            user=request.user,
            is_confirmed=False
        )
        
        return Response({
            'message': 'Successfully joined the event',
            'participant': {
                'id': participant.id,
                'user': request.user.get_full_name(),
                'joined_at': participant.joined_at,
                'is_confirmed': participant.is_confirmed
            }
        })
        
    except Event.DoesNotExist:
        return Response(
            {'error': 'Event not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def leave_event_view(request, pk):
    """Leave an event"""
    try:
        event = Event.objects.get(pk=pk)
        participant = EventParticipant.objects.get(event=event, user=request.user)
        participant.delete()
        
        return Response({'message': 'Successfully left the event'})
        
    except Event.DoesNotExist:
        return Response(
            {'error': 'Event not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except EventParticipant.DoesNotExist:
        return Response(
            {'error': 'Not participating in this event'},
            status=status.HTTP_400_BAD_REQUEST
        )