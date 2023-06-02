from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

User = get_user_model()

admin.site.unregister(User)
admin.site.register(User, BaseUserAdmin)
