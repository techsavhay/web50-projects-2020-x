from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class User(AbstractUser):
    following = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="following_users",
        related_query_name="followed_by",
        blank=True
    )

    #def follow(self, user_to_follow):
        #if self == user_to_follow:
           # raise ValidationError("A user cannot follow themselves.")
        #self.following.add(user_to_follow)

    def is_followed_by(self, other_user):
        return self.following_users.filter(id=other_user.id).exists() # type: ignore


class Post(models.Model):
    content = models.CharField(max_length=280, blank=False)
    post_owner = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)

class Like(models.Model):
    like_user = models.ForeignKey(User, blank=False, on_delete=models.CASCADE)
    like_post = models.ForeignKey(Post, blank=False, on_delete=models.CASCADE)