from django.contrib.auth.models import AbstractUser
from django.db import models

#Created custom usermodel even though abstractuser should cover what i want in case i need to expand it in the future.
class User(AbstractUser):
    pass 


class Post(models.Model):
    content = models.CharField(max_length=280, blank=True)
    date_visited = models.DateTimeField(blank=True)
    
    owner = models.ForeignKey(User, on_delete= models.CASCADE)

class Pub(models.Model):
    name = models.CharField(max_length=100, blank=False)
    address = models.CharField(max_length=200, blank=False)
    heritage_stars = models.IntegerField()
    url = models.URLField()
    description = models.TextField()
    photos = models.ImageField(upload_to='pub_photos')

    users_visited = models.ManyToManyField(User, related_name='visited_pubs')
    posts = models.ForeignKey(Post, on_delete=models.CASCADE)
    
