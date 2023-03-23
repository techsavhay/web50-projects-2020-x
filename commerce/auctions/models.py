from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.db.models import Max
from django.db.models import F

class User(AbstractUser):
    pass

class Listing(models.Model):
    CATEGORY_CHOICES = [
        ('books', 'Books'),
        ('electronics', 'Electronics'),
        ('fashion', 'Fashion'),
        ('home', 'Home'),
        ('sports', 'Sports'),
    ]

    title = models.CharField(max_length=255, blank=False)
    description = models.CharField(max_length=600, blank=False)
    image_url = models.URLField()
    starting_bid = models.DecimalField(max_digits=10, decimal_places=2, default=0.01)
    seller_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    active = models.BooleanField(default=True)

class Bids(models.Model):
    bidder_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bids')
    listing_id = models.ForeignKey(Listing, on_delete=models.CASCADE)
    bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    bid_time = models.DateTimeField(default=timezone.now)

class Comments(models.Model):
    listing_id = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='comments')
    commenter_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    comment = models.CharField(max_length=255)
    comment_time = models.DateTimeField(default=timezone.now)

class Watchlist(models.Model):
    watcher_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist_items')
    watchlisting_id = models.ForeignKey(Listing, on_delete=models.CASCADE)