from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class User(AbstractUser):
    following = models.ManyToManyField("self", symmetrical=False, related_name="following_users", blank=True)
    
    #prevent a user following themselves.
    def follow(self, user_to_follow):
            if self == user_to_follow:
                raise ValidationError("A user cannot follow themselves.")
            self.following.add(user_to_follow)

class Post(models.Model):
    content = models.CharField(max_length=280, blank=False)
    post_owner = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)

class Like(models.Model):
    like_user = models.ForeignKey(User, blank=False, on_delete=models.CASCADE)
    like_post = models.ForeignKey(Post, blank=False, on_delete=models.CASCADE)