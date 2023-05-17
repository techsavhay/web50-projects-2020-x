from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.models import UserManager
from .models import User, Post, Like
from django.views.decorators.csrf import csrf_exempt
import json
from django.core.paginator import Paginator
from django.db.models import Count
from django.http import HttpResponseNotFound
from django.contrib.auth.decorators import login_required

def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password) # type: ignore
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
    
@login_required
@csrf_exempt
def save_post(request):

    if request.method == 'POST':
        # Load the JSON data from request.body
        data = json.loads(request.body)

        # Get the content from the data dictionary
        content = data.get('content', '').strip()

        if content:
            new_post = Post(content=content, post_owner=request.user)
            new_post.save()
            return JsonResponse({"success": True})
        else:
            return JsonResponse({"success": False, "error": "Content is empty."})
    else:
        return JsonResponse({"success": False, "error": "Invalid request method."})
    
@login_required
def get_posts(request, view, page_number=1, username=None):
    # Add current user to variable
    current_user = request.user

    # Initialize filtered_posts with an empty queryset
    filtered_posts = Post.objects.none()

    # Initialize followers_count and following_count with default values
    followers_count = 0
    following_count = 0

    # initialises and sets up if the user is followed by another user
    is_followed = False
    if username is not None:
        user_instance = User.objects.get(username=username)
        if request.user.is_authenticated:
            is_followed = user_instance.is_followed_by(request.user)

    # Filter posts based on the 'view' eg all, followed, or self.
    if view == "followed":
        # Get all the users that the current user is following
        following_users = current_user.following.all()

        # Filter the posts by checking if the post_owner is in the list of following users
        filtered_posts = Post.objects.filter(post_owner__in=following_users)

    elif view == "myposts":
        # search posts for users own posts.
        filtered_posts = Post.objects.filter(post_owner=current_user)

    elif view == "allposts":
        filtered_posts = Post.objects.all()

    elif view == "userposts":
         if username:
            try:
                # Get user instance and calculate the number of followers and the number of users they are following
                user_instance = User.objects.get(username=username)
                followers_count = user_instance.following_users.count() # type: ignore
                following_count = user_instance.following.count()

                # Filter the posts by the specified user
                filtered_posts = Post.objects.filter(post_owner=user_instance)
                
            except User.DoesNotExist:
                return JsonResponse({"success": False, "error": "User not found."})

    # Order the queryset by timestamp and annotate the queryset with the number of likes
    filtered_posts = filtered_posts.annotate(likes_count=Count('like')).order_by('-timestamp')

    # Use Django's Paginator to paginate the results
    paginator = Paginator(filtered_posts, 10)
    page = paginator.get_page(page_number)

    # Convert the queryset to a list of dictionaries
    post_data = list(page.object_list.values('id', 'content', 'post_owner__username', 'post_owner__first_name', 'post_owner__last_name', 'timestamp', 'likes_count'))

    # Add information about whether the current user has liked each post or not
    for post in post_data:
        post['liked_by_current_user'] = Like.objects.filter(like_user_id=current_user.id, like_post_id=post['id']).exists()

    # Return a JSON response
    response_data = {
        'posts': post_data,
        'has_next': page.has_next(),
        'has_previous': page.has_previous(),
        'next_page_number': page.next_page_number() if page.has_next() else None,
        'previous_page_number': page.previous_page_number() if page.has_previous() else None,
        'current_user_is_following': is_followed,
    }

    # Include followers and following counts if the view is "userposts"
    if view == "userposts" and username:
        response_data['followers_count'] = followers_count
        response_data['following_count'] = following_count

    return JsonResponse(response_data)



@csrf_exempt
@login_required
def save_like(request, post_id):
    # Add current user to variable
    current_user = request.user

    # Get the specific post using the provided post_id
    try:
        post_instance = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return HttpResponseNotFound("The requested post does not exist.")

    # Check if the user has already liked this post
    try:
        like_instance = Like.objects.get(like_user=current_user, like_post=post_instance)
        like_instance.delete()  # If so, delete the like
        response_data = {
            'success': True,
            'message': 'Operation delete like completed successfully'
        }
        return JsonResponse(response_data)
    except Like.DoesNotExist:
        # If the user hasn't already liked this post, create a new Like object and save it
        new_like = Like(like_user=current_user, like_post=post_instance)
        new_like.save()
        response_data = {
            'success': True,
            'message': 'Operation save like completed successfully'
        }
        return JsonResponse(response_data)



@csrf_exempt
@login_required
def follow(request, username):
    # Try to get the user instance for the given username
    try:
        user_instance = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"success": False, "error": "User not found."})

    # Check if the current user is already following this user
    if request.user.following.filter(username=username).exists():
        # If so, unfollow the user
        request.user.following.remove(user_instance)
        followed = False
    else:
        # Otherwise, follow the user
        request.user.following.add(user_instance)
        followed = True

    # Calculate the new followers count
    followers_count = user_instance.following_users.count() # type: ignore

    return JsonResponse({
        "followed": followed,
        "followers_count": followers_count,
    })

@csrf_exempt
@csrf_exempt
def update_post(request, post_id):
    if request.method == 'POST':
        # Ensure the user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({"error": "User not authenticated."}, status=400)

        # Get the post to be updated
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Post not found."}, status=404)

        # Ensure the user is the owner of the post
        if post.post_owner != request.user:
            return JsonResponse({"error": "User not authorized to edit this post."}, status=403)

        # Load the JSON data from request.body
        data = json.loads(request.body)

        # Get the content from the data dictionary
        content = data.get('content', '').strip()

        if content:
            # Update the post content
            post.content = content
            post.save()

            return JsonResponse({"message": "Post updated successfully."}, status=201)
        else:
            return JsonResponse({"error": "Content is empty."}, status=400)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)


