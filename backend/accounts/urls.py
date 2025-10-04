from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import language_views

urlpatterns = [
    # Authentication
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/check/', views.check_auth_view, name='check_auth'),
    
    # User Management
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/create/', views.UserCreateView.as_view(), name='user_create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/update/', views.UserUpdateView.as_view(), name='user_update'),
    
    # Language Support
    path('language/set/', language_views.set_language, name='set_language'),
    path('language/get/', language_views.get_language, name='get_language'),
    path('language/available/', language_views.get_available_languages, name='available_languages'),
]
