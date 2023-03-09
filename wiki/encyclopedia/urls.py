from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("wiki/<str:title>", views.entry, name="entry"),
    path("search/", views.search, name="search"),
    path("new_page/", views.new_page, name="new_page"),
    path("wiki/<str:title>/edit_page/", views.edit_page, name="edit_page"),
    path("wiki/<str:title>/save_edit/", views.save_edit, name="save_edit"),
    path("wiki/random_page/", views.random_page, name="random_page"),
    ]
