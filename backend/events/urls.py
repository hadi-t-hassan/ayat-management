from django.urls import path
from . import views

urlpatterns = [
    # Events
    path('events/', views.EventListView.as_view(), name='event_list'),
    path('events/<int:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    path('events/<int:pk>/status/', views.EventStatusUpdateView.as_view(), name='event_status_update'),
    path('events/status/<str:status>/', views.EventByStatusView.as_view(), name='events_by_status'),
    path('events/search/', views.EventSearchView.as_view(), name='event_search'),
    path('events/upcoming/', views.upcoming_events_view, name='upcoming_events'),
    path('events/past/', views.past_events_view, name='past_events'),
    path('events/<int:pk>/join/', views.join_event_view, name='join_event'),
    path('events/<int:pk>/leave/', views.leave_event_view, name='leave_event'),
    
    # Dashboard and Stats
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('stats/', views.EventStatsView.as_view(), name='event_stats'),
]
