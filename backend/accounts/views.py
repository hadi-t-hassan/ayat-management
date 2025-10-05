from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.db import transaction
from .models import User, Profile
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    ProfileSerializer, UserUpdateSerializer, UserCreateSerializer
)
from .jwt_serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with user data"""
    # Temporarily use default serializer to test
    # serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        # Debug logging
        print(f"Login attempt: username={request.data.get('username')}")
        
        response = super().post(request, *args, **kwargs)
        
        print(f"Response status: {response.status_code}")
        if hasattr(response, 'data'):
            print(f"Response data keys: {list(response.data.keys()) if response.data else 'None'}")
        
        if response.status_code == 200:
            # Get user data using username
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                user_data = UserSerializer(user).data
                
                # Add user data to the existing response (don't override tokens)
                response.data['user'] = user_data
                response.data['profile'] = ProfileSerializer(user.profile).data if hasattr(user, 'profile') else None
            except Exception as e:
                print(f"Error getting user data: {e}")
        
        return response


class UserRegistrationView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
                    
                    # Create profile if it doesn't exist with role
                    profile, created = Profile.objects.get_or_create(user=user, defaults={'role': user.role})
                    
                    # Generate tokens
                    refresh = RefreshToken.for_user(user)
                    access_token = refresh.access_token
                    
                    return Response({
                        'message': 'User created successfully',
                        'user': UserSerializer(user).data,
                        'profile': ProfileSerializer(profile).data,
                        'tokens': {
                            'access': str(access_token),
                            'refresh': str(refresh)
                        }
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'error': f'Registration failed: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'profile': ProfileSerializer(user.profile).data if hasattr(user, 'profile') else None,
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """Get current user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'user': UserSerializer(user).data,
            'profile': ProfileSerializer(user.profile).data if hasattr(user, 'profile') else None
        })


class UserUpdateView(APIView):
    """Update user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': UserSerializer(request.user).data,
                'profile': ProfileSerializer(request.user.profile).data if hasattr(request.user, 'profile') else None
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """List all users for participant selection"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # All authenticated users can view the user list for participant selection
        return User.objects.filter(is_active=True).order_by('-created_at')


class UserCreateView(generics.CreateAPIView):
    """Create user view (admin only)"""
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only admins can create users
        if not self.request.user.is_admin:
            raise PermissionDenied("Only administrators can create users")
        
        with transaction.atomic():
            user = serializer.save()
            # Create profile for the new user with role
            Profile.objects.create(user=user, role=user.role)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return the created user data
        user = serializer.instance
        user_data = UserSerializer(user).data
        profile_data = ProfileSerializer(user.profile).data if hasattr(user, 'profile') else None
        
        return Response({
            'message': 'User created successfully',
            'user': user_data,
            'profile': profile_data
        }, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """User detail view (admin only)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only admins can manage users
        if self.request.user.is_admin:
            return User.objects.all()
        return User.objects.none()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
    
    def perform_update(self, serializer):
        # Only admins can update users
        if not self.request.user.is_admin:
            raise PermissionDenied("Only administrators can update users")
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        # Prevent admin from deleting themselves
        user = self.get_object()
        if user == request.user:
            return Response(
                {'error': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logout successful'})
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_auth_view(request):
    """Check authentication status"""
    return Response({
        'authenticated': True,
        'user': UserSerializer(request.user).data,
        'profile': ProfileSerializer(request.user.profile).data if hasattr(request.user, 'profile') else None
    })