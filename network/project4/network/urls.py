
from django.urls import path, re_path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("api/save_post", views.save_post, name='save_post'),
    re_path(r'api/posts/(?P<view>[a-z]+)/(?P<page_number>\d+)/?((?P<username>[\w@.+-]+)/)?$', views.get_posts, name='get_posts'),
    path("api/likes/<int:post_id>/", views.save_like, name="save_like"),
    path("api/follow/<str:username>", views.follow, name="follow"),
]