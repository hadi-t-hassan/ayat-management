from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event, Song, EventParticipant, EventStats, DressDetail

User = get_user_model()


class SongSerializer(serializers.ModelSerializer):
    """Serializer for songs"""
    class Meta:
        model = Song
        fields = ('id', 'title', 'artist', 'duration', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')


class DressDetailSerializer(serializers.ModelSerializer):
    """Serializer for dress details"""
    class Meta:
        model = DressDetail
        fields = ('id', 'description', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')


class EventParticipantSerializer(serializers.ModelSerializer):
    """Serializer for event participants"""
    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EventParticipant
        fields = ('id', 'user', 'user_id', 'user_name', 'joined_at', 'is_confirmed')
        read_only_fields = ('id', 'joined_at')
    
    def get_user_name(self, obj):
        return obj.user.get_full_name()


class EventSerializer(serializers.ModelSerializer):
    """Serializer for events"""
    songs = SongSerializer(many=True, read_only=True)
    dress_details = DressDetailSerializer(many=True, read_only=True)
    participants = EventParticipantSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    is_upcoming = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    
    class Meta:
        model = Event
        fields = (
            'id', 'day', 'date', 'time', 'duration', 'place', 'number_of_participants',
            'status', 'meeting_time', 'meeting_date', 'place_of_meeting', 'vehicle',
            'camera_man', 'participation_type', 'event_reason', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'songs', 'dress_details', 'participants', 'is_upcoming', 'is_past'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name()
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating events"""
    songs_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    dress_details_data = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    participants_data = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Event
        fields = (
            'day', 'date', 'time', 'duration', 'place', 'number_of_participants',
            'meeting_time', 'meeting_date', 'place_of_meeting', 'vehicle',
            'camera_man', 'participation_type', 'event_reason', 'songs_data', 
            'dress_details_data', 'participants_data'
        )
    
    def create(self, validated_data):
        songs_data = validated_data.pop('songs_data', [])
        dress_details_data = validated_data.pop('dress_details_data', [])
        participants_data = validated_data.pop('participants_data', [])
        
        # Set the created_by field from the request user
        validated_data['created_by'] = self.context['request'].user
        
        event = Event.objects.create(**validated_data)
        
        # Create songs
        for i, song_data in enumerate(songs_data, 1):
            Song.objects.create(
                event=event,
                title=song_data.get('title', ''),
                artist=song_data.get('artist', ''),
                duration=song_data.get('duration'),
                order=i
            )
        
        # Create dress details
        for i, dress_detail in enumerate(dress_details_data, 1):
            if dress_detail.strip():  # Only create if not empty
                DressDetail.objects.create(
                    event=event,
                    description=dress_detail,
                    order=i
                )
        
        # Create participants
        for user_id in participants_data:
            try:
                user = User.objects.get(id=user_id)
                EventParticipant.objects.create(
                    event=event,
                    user=user,
                    is_confirmed=False
                )
            except User.DoesNotExist:
                continue
        
        return event


class EventUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating events"""
    songs_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    dress_details_data = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    participants_data = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Event
        fields = (
            'day', 'date', 'time', 'duration', 'place', 'number_of_participants',
            'status', 'meeting_time', 'meeting_date', 'place_of_meeting', 'vehicle',
            'camera_man', 'participation_type', 'event_reason', 'songs_data', 
            'dress_details_data', 'participants_data'
        )
    
    def update(self, instance, validated_data):
        songs_data = validated_data.pop('songs_data', None)
        dress_details_data = validated_data.pop('dress_details_data', None)
        participants_data = validated_data.pop('participants_data', None)
        
        # Update event
        event = super().update(instance, validated_data)
        
        # Update songs if provided
        if songs_data is not None:
            # Delete existing songs
            event.songs.all().delete()
            
            # Create new songs
            for i, song_data in enumerate(songs_data, 1):
                Song.objects.create(
                    event=event,
                    title=song_data.get('title', ''),
                    artist=song_data.get('artist', ''),
                    duration=song_data.get('duration'),
                    order=i
                )
        
        # Update dress details if provided
        if dress_details_data is not None:
            # Delete existing dress details
            event.dress_details.all().delete()
            
            # Create new dress details
            for i, dress_detail in enumerate(dress_details_data, 1):
                if dress_detail.strip():  # Only create if not empty
                    DressDetail.objects.create(
                        event=event,
                        description=dress_detail,
                        order=i
                    )
        
        # Update participants if provided
        if participants_data is not None:
            # Delete existing participants
            event.participants.all().delete()
            
            # Create new participants
            for user_id in participants_data:
                try:
                    user = User.objects.get(id=user_id)
                    EventParticipant.objects.create(
                        event=event,
                        user=user,
                        is_confirmed=False
                    )
                except User.DoesNotExist:
                    continue
        
        return event


class EventStatsSerializer(serializers.ModelSerializer):
    """Serializer for event statistics"""
    class Meta:
        model = EventStats
        fields = (
            'total_events', 'pending_events', 'confirmed_events',
            'completed_events', 'cancelled_events', 'total_users', 'updated_at'
        )
        read_only_fields = ('updated_at',)


class DashboardSerializer(serializers.Serializer):
    """Serializer for dashboard data"""
    stats = EventStatsSerializer()
    upcoming_event = EventSerializer(required=False, allow_null=True)
    recent_events = EventSerializer(many=True)
    total_users = serializers.IntegerField()
    
    def to_representation(self, instance):
        return {
            'stats': instance['stats'],
            'upcoming_event': instance.get('upcoming_event'),
            'recent_events': instance['recent_events'],
            'total_users': instance['total_users']
        }
