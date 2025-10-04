from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Event(models.Model):
    """Quran Event model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Basic Event Information
    day = models.CharField(max_length=20, help_text="Day of the week (e.g., Friday)")
    date = models.DateField(help_text="Event date")
    time = models.TimeField(help_text="Event start time")
    duration = models.PositiveIntegerField(
        help_text="Duration in minutes",
        validators=[MinValueValidator(30), MaxValueValidator(480)]
    )
    place = models.CharField(max_length=200, help_text="Event location")
    number_of_participants = models.PositiveIntegerField(
        default=0,
        help_text="Expected number of participants"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Event status"
    )
    
    # Meeting Details
    meeting_time = models.TimeField(blank=True, null=True, help_text="Pre-event meeting time")
    meeting_date = models.DateField(blank=True, null=True, help_text="Pre-event meeting date")
    place_of_meeting = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Meeting location"
    )
    
    # Logistics
    vehicle = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Transportation details"
    )
    camera_man = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Camera operator name"
    )
    # Event Details
    participation_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Type of participation (e.g., Recitation, Listening, etc.)"
    )
    event_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason or purpose of the event"
    )
    
    # Event Management
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_events',
        help_text="User who created the event"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'events'
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.day} Event - {self.date} at {self.place}"
    
    @property
    def is_upcoming(self):
        """Check if event is in the future"""
        from django.utils import timezone
        return self.date >= timezone.now().date()
    
    @property
    def is_past(self):
        """Check if event is in the past"""
        return not self.is_upcoming


class Song(models.Model):
    """Songs used in events"""
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='songs',
        help_text="Event this song belongs to"
    )
    title = models.CharField(max_length=200, help_text="Song title")
    artist = models.CharField(max_length=100, blank=True, null=True, help_text="Song artist")
    duration = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Song duration in seconds"
    )
    order = models.PositiveIntegerField(
        default=1,
        help_text="Order of song in event"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'songs'
        verbose_name = 'Song'
        verbose_name_plural = 'Songs'
        ordering = ['event', 'order']
        unique_together = ['event', 'order']
    
    def __str__(self):
        return f"{self.title} - {self.event}"


class DressDetail(models.Model):
    """Dress details for events"""
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='dress_details',
        help_text="Event this dress detail belongs to"
    )
    description = models.CharField(max_length=200, help_text="Dress requirement description")
    order = models.PositiveIntegerField(
        default=1,
        help_text="Order of dress detail in event"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'dress_details'
        verbose_name = 'Dress Detail'
        verbose_name_plural = 'Dress Details'
        ordering = ['event', 'order']
        unique_together = ['event', 'order']
    
    def __str__(self):
        return f"{self.description} - {self.event}"


class EventParticipant(models.Model):
    """Event participants"""
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='participants',
        help_text="Event"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='event_participations',
        help_text="Participant user"
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_confirmed = models.BooleanField(default=False, help_text="Participation confirmed")
    
    class Meta:
        db_table = 'event_participants'
        verbose_name = 'Event Participant'
        verbose_name_plural = 'Event Participants'
        unique_together = ['event', 'user']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.event}"


class EventStats(models.Model):
    """Event statistics for dashboard"""
    total_events = models.PositiveIntegerField(default=0)
    pending_events = models.PositiveIntegerField(default=0)
    confirmed_events = models.PositiveIntegerField(default=0)
    completed_events = models.PositiveIntegerField(default=0)
    cancelled_events = models.PositiveIntegerField(default=0)
    total_users = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'event_stats'
        verbose_name = 'Event Statistics'
        verbose_name_plural = 'Event Statistics'
    
    def __str__(self):
        return f"Event Stats - {self.updated_at}"
    
    @classmethod
    def get_or_create_stats(cls):
        """Get or create statistics record"""
        stats, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                'total_events': 0,
                'pending_events': 0,
                'confirmed_events': 0,
                'completed_events': 0,
                'cancelled_events': 0,
                'total_users': 0,
            }
        )
        return stats
    
    def update_stats(self):
        """Update statistics from actual data"""
        from django.db.models import Count, Q
        
        # Update event counts
        event_counts = Event.objects.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            confirmed=Count('id', filter=Q(status='confirmed')),
            completed=Count('id', filter=Q(status='completed')),
            cancelled=Count('id', filter=Q(status='cancelled')),
        )
        
        self.total_events = event_counts['total']
        self.pending_events = event_counts['pending']
        self.confirmed_events = event_counts['confirmed']
        self.completed_events = event_counts['completed']
        self.cancelled_events = event_counts['cancelled']
        
        # Update user count
        self.total_users = User.objects.count()
        
        self.save()