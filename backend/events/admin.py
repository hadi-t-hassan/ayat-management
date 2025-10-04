from django.contrib import admin
from .models import Event, Song, EventParticipant, EventStats


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Event admin"""
    list_display = ('day', 'date', 'time', 'place', 'status', 'number_of_participants', 'created_by', 'created_at')
    list_filter = ('status', 'day', 'date', 'created_at')
    search_fields = ('day', 'place', 'created_by__email', 'created_by__username')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('day', 'date', 'time', 'duration', 'place', 'number_of_participants', 'status')
        }),
        ('Meeting Details', {
            'fields': ('meeting_time', 'meeting_date', 'place_of_meeting'),
            'classes': ('collapse',)
        }),
        ('Logistics', {
            'fields': ('vehicle', 'camera_man', 'dress_details'),
            'classes': ('collapse',)
        }),
        ('Management', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Only set created_by for new objects
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    """Song admin"""
    list_display = ('title', 'artist', 'event', 'order', 'duration', 'created_at')
    list_filter = ('event', 'created_at')
    search_fields = ('title', 'artist', 'event__day', 'event__place')
    ordering = ('event', 'order')
    
    fieldsets = (
        (None, {'fields': ('event', 'title', 'artist', 'duration', 'order')}),
        ('Timestamps', {'fields': ('created_at',)}),
    )
    
    readonly_fields = ('created_at',)


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    """Event Participant admin"""
    list_display = ('user', 'event', 'is_confirmed', 'joined_at')
    list_filter = ('is_confirmed', 'joined_at', 'event__status')
    search_fields = ('user__email', 'user__username', 'event__day', 'event__place')
    ordering = ('-joined_at',)
    
    fieldsets = (
        (None, {'fields': ('event', 'user', 'is_confirmed')}),
        ('Timestamps', {'fields': ('joined_at',)}),
    )
    
    readonly_fields = ('joined_at',)


@admin.register(EventStats)
class EventStatsAdmin(admin.ModelAdmin):
    """Event Statistics admin"""
    list_display = ('total_events', 'pending_events', 'confirmed_events', 'completed_events', 'cancelled_events', 'total_users', 'updated_at')
    readonly_fields = ('total_events', 'pending_events', 'confirmed_events', 'completed_events', 'cancelled_events', 'total_users', 'updated_at')
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False