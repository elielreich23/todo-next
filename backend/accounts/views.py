from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.db import models
from .serializers import UserSerializer, UserRegistrationSerializer, UserLoginSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'User created successfully',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def signin(request):
    """User login endpoint"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': serializer.data
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'user': serializer.data
        })
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint that blacklists the refresh token"""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({
            'success': False,
            'message': 'Refresh token is required to logout'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        return Response({
            'success': False,
            'message': 'Invalid refresh token'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': True,
        'message': 'Logout successful'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    """List users for assignment (exclude the requester by default)."""
    qs = type(request.user).objects.exclude(id=request.user.id)
    data = UserSerializer(qs, many=True).data
    return Response({
        'success': True,
        'users': data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search users by name, username, or email (minimum 3 characters)."""
    query = request.GET.get('q', '').strip()
    
    if len(query) < 3:
        return Response({
            'success': True,
            'users': [],
            'message': 'Please enter at least 3 characters to search'
        })
    
    # Search in full_name, username, and email
    qs = type(request.user).objects.exclude(id=request.user.id).filter(
        models.Q(full_name__icontains=query) |
        models.Q(username__icontains=query) |
        models.Q(email__icontains=query)
    )[:20]  # Limit to 20 results
    
    data = UserSerializer(qs, many=True).data
    return Response({
        'success': True,
        'users': data
    })