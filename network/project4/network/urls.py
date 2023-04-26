
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("api/save_post", views.save_post, name='save_post'),
    path("api/posts/<str:view>/<int:page_number>/", views.get_posts, name="get_posts"),
    path("api/likes/<int:post_id>/", views.save_like, name="save_like"),
]
