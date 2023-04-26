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
    
def get_posts(request, view, page_number=1):
    # Add current user to variable
    current_user = request.user

    # Initialize filtered_posts with an empty queryset
    filtered_posts = Post.objects.none()

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

    # Order the queryset by timestamp and annotate the queryset with the number of likes
    filtered_posts = filtered_posts.annotate(likes_count=Count('like')).order_by('-timestamp')

    # Convert the queryset to a list of dictionaries
    filtered_posts = filtered_posts.values('id', 'content', 'post_owner__username', 'post_owner__first_name', 'post_owner__last_name','timestamp', 'likes_count')

    # Use Django's Paginator to paginate the results
    paginator = Paginator(filtered_posts, 10)
    page = paginator.get_page(page_number)

    # Return a JSON response
    return JsonResponse({
        'posts': list(page),
        'has_next': page.has_next(),
        'has_previous': page.has_previous(),
        'next_page_number': page.next_page_number() if page.has_next() else None,
        'previous_page_number': page.previous_page_number() if page.has_previous() else None,
    })

def save_like(request, post_id):
    # Add current user to variable
    current_user = request.user

        # Get the specific post using the provided post_id
    try:
        post_instance = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return HttpResponseNotFound("The requested post does not exist.")
    
    #get the specific post and perform action if it has been liked by the user
    if Like.objects.filter(user_id = current_user.id, post_id = post_id):
        #delete the like instance.
        like_instance = Like.objects.get(user_id=current_user.id, post_id=post_id)
        like_instance.delete()

    else: #save the new like
        new_like = Like(user=current_user, post=post_instance)
        new_like.save()

    



