import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('resident', 'Resident'), ('admin', 'Admin')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='resident')

    # Profile
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    id_proof = models.ImageField(upload_to='id_proofs/', null=True, blank=True)

    # Contacts
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    parent_contact_name = models.CharField(max_length=255, blank=True)
    parent_contact_phone = models.CharField(max_length=20, blank=True)
    residential_address = models.TextField(blank=True)

    # Auth state
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_2fa_setup = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=64, blank=True)

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.full_name} ({self.email})'
