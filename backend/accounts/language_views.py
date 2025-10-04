from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import translation
from django.conf import settings


@api_view(['POST'])
@permission_classes([])  # Allow anonymous users to set language
def set_language(request):
    """Set user's preferred language"""
    language = request.data.get('language', 'en')
    
    # Validate language
    if language not in [lang[0] for lang in settings.LANGUAGES]:
        return Response({
            'error': 'Unsupported language'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Set language in session
    request.session['django_language'] = language
    translation.activate(language)
    
    return Response({
        'message': f'Language set to {language}',
        'language': language,
        'available_languages': [{'code': code, 'name': name} for code, name in settings.LANGUAGES]
    })


@api_view(['GET'])
@permission_classes([])
def get_language(request):
    """Get current language"""
    current_language = request.session.get('django_language', settings.LANGUAGE_CODE)
    
    return Response({
        'current_language': current_language,
        'available_languages': [{'code': code, 'name': name} for code, name in settings.LANGUAGES]
    })


@api_view(['GET'])
@permission_classes([])
def get_available_languages(request):
    """Get all available languages"""
    return Response({
        'languages': [{'code': code, 'name': name} for code, name in settings.LANGUAGES]
    })
