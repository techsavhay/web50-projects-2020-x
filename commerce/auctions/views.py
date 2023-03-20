from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.db.models import Max
from django.db.models import F
from decimal import Decimal
from .models import User, Listing, Bids


def index(request):
    listings = Listing.objects.annotate(
        highest_bid=Max(
            'bids__bid_amount',
            default=F('starting_bid')  # Use starting_bid as the default value if there are no bids
        )
    )
    return render(request, "auctions/index.html", {
        "entries": listings
    })



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
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


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
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")

def create_listing(request):
    category_choices = Listing.CATEGORY_CHOICES
    context = {'category_choices': category_choices}
    if not request.method == "POST":
        if not request.user.is_authenticated:
            return HttpResponseRedirect("login", {
                "message": "You must be logged in to create a listing."
            })
        elif request.user.is_authenticated:
            return render(request, "auctions/create_listing.html", context)
    # code below for POST requests only
    else:
        title = request.POST.get('title')
        description = request.POST.get('description')
        starting_bid = request.POST.get('starting_bid')
        image_url = request.POST.get('image_url')
        category = request.POST.get('category')

        #converts starting bid from a string to a decimal
        starting_bid = Decimal(starting_bid)

        #associate the logged in user with the listing
        seller_id = request.user
        new_listing = Listing(title=title, description=description, image_url=image_url, category=category, seller_id=seller_id, starting_bid=starting_bid)
        new_listing.save()
        # return HttpResponseRedirect(reverse("listing_page")) # Uncomment once 'listing_page' view and URL pattern are created
        return HttpResponseRedirect(reverse("index"))

    
def listing_detail(request, pk):
    listing = Listing.objects.get(pk=pk)

    # Get the highest bid amount for the current listing
    highest_bid = Bids.objects.filter(listing_id=listing.id).aggregate(Max('bid_amount'))['bid_amount__max']
    
    # If it is a POST method
    if not request.method == "POST":
        context = {
            "listing": listing,
            "bid_amount": highest_bid if highest_bid else None
        }
        return render(request, "auctions/listing.html", context)

    
    elif not request.user.is_authenticated:
        messages.error(request, "You must be signed in to bid!")
        return HttpResponseRedirect(reverse("listing_detail", kwargs={'pk': pk}))

    else:
        bid = request.POST.get('bid')
        if not bid:
            messages.error(request, "Please enter a bid value.")
            return HttpResponseRedirect(reverse("listing_detail", kwargs={'pk': pk}))

        bid = Decimal(bid)

    if highest_bid is None or (bid > highest_bid):
        bidder_id = request.user
        new_bid = Bids(bidder_id=bidder_id, bid_amount=bid, listing_id=listing)
        new_bid.save()
        messages.success(request, "Your bid was successful!")
        return HttpResponseRedirect(reverse("listing_detail", kwargs={'pk': pk}))

    else:
        messages.success(request, "Bid needs to be higher than the current highest bid!")
        return HttpResponseRedirect(reverse("listing_detail", kwargs={'pk': pk}))
        