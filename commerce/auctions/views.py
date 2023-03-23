from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.db.models import Max
from django.db.models import F
from decimal import Decimal
from .models import User, Listing, Bids, Watchlist


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
    listing = Listing.objects.get(pk=pk, active=True)
    is_on_watchlist = False
    winning_bidder = None

    #checks if the listing the user is looking at is already on their watchlist
    if request.user.is_authenticated:
        is_on_watchlist = Watchlist.objects.filter(watcher_id=request.user, watchlisting_id=listing).exists()
        #check if the item is being sold by the signed in user
        is_users_listing_active = Listing.objects.filter(seller_id=request.user, id=listing.id, active=True).exists()
        
        # get highest bidder listing is finished 
        if listing.active == False:
            winning_bidder = Bids.objects.filter(listing_id=listing.id, bidder_id=request.user).order_by('-bid_amount').first()

        if  request.method == "POST":
            context = {
                "winning_bidder":winning_bidder
            }
            return render(request, "auctions/index.html", context)
  

    # Get the highest bid amount for the current listing
    highest_bid = Bids.objects.filter(listing_id=listing.id).aggregate(Max('bid_amount'))['bid_amount__max']


    # If it is GET method:
    if not request.method == "POST":
        context = {
            "listing": listing,
            "bid_amount": highest_bid if highest_bid else None,
            "is_on_watchlist": is_on_watchlist,
            "is_users_listing_active": is_users_listing_active,
        }
        return render(request, "auctions/listing.html", context)

    #if it is POST method
    elif not request.user.is_authenticated:
        messages.error(request, "You must be signed in to complete this action!")
        return HttpResponseRedirect(reverse("listing_detail", kwargs={'pk': pk}))
    
    # watchbutton checks if watchbutton has been pressed and assigns it to the variable at the same time. if it has been pressed the code continues.
    elif watchbutton := request.POST.get('watchbutton'):
        watcher_id = request.user
        watchlist_item = Watchlist.objects.filter(watcher_id=watcher_id, watchlisting_id=listing)

        # if its not already on the watchlist
        if watchbutton == 'add':
            new_watchlist = Watchlist(watcher_id=watcher_id, watchlisting_id=listing)
            new_watchlist.save()
            messages.success(request, "Item added to watchlist.")
        elif watchbutton == 'remove':
            watchlist_item.delete()
            messages.warning(request, "Item removed from your watchlist.")

        return HttpResponseRedirect(reverse("watchlist"))

    #closing the auction
    elif (closeauction := request.POST.get('closeauction')) and Listing.objects.filter(seller_id=request.user, id=listing.id).exists():
        print("Close auction value:", closeauction)
        listing.active = False
        print("Listing active before saving:", listing.active)
        listing.save(update_fields=['active'])
        print("Listing active after saving:", listing.active)
        return HttpResponseRedirect(reverse("listing_detail", kwargs={'pk': pk}))
                             
    #dealing with bids                                    
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


def watchlist(request):
    watchlist_entries = Watchlist.objects.filter(watcher_id=request.user)
    watchlist_with_bids = [
        {
            'watchlist_entry': entry,
            'bids': entry.watchlisting_id.bids_set.all()
        }
        for entry in watchlist_entries
    ]
    return render(request, "auctions/watchlist.html", {"entries_with_bids": watchlist_with_bids})

