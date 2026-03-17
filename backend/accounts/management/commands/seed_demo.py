import os
import getpass
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rooms.models import Room, Bed, Booking

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with demo resident and room data, and optionally creates an Admin.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding demo data...\n')

        # 1. Ask about Admin
        create_admin = input("Do you want to create an Admin user now? (y/N): ").strip().lower() == 'y'
        if create_admin:
            admin_email = input("Enter admin email: ").strip()
            
            if User.objects.filter(email=admin_email).exists():
                self.stdout.write(self.style.WARNING(f'Admin {admin_email} already exists.'))
            else:
                admin_pass = getpass.getpass("Enter admin password: ")
                admin_name = input("Enter admin full name: ").strip()
                admin_phone = input("Enter admin phone number: ").strip()

                admin = User.objects.create_user(
                    email=admin_email,
                    password=admin_pass,
                    full_name=admin_name if admin_name else 'Demo Admin',
                    phone=admin_phone if admin_phone else '9999999999',
                    role='admin'
                )
                admin.is_staff = True
                admin.is_superuser = True
                admin.save()
                self.stdout.write(self.style.SUCCESS(f'Created Admin: {admin_email} successfully.\n'))
        else:
            self.stdout.write("Skipping Admin creation...\n")

        # 2. Basic Resident
        resident_email = 'resident@demo.com'
        resident = None

        if not User.objects.filter(email=resident_email).exists():
            resident = User.objects.create_user(
                email=resident_email,
                password='password123',
                full_name='Demo Resident',
                phone='8888888888',
                role='resident'
            )
            # Simulate they finished profile setup
            resident.profile_setup_complete = True
            resident.save()
            self.stdout.write(self.style.SUCCESS(f'Created Resident: {resident_email} / password123\n'))
        else:
            resident = User.objects.get(email=resident_email)
            self.stdout.write(f'Resident {resident_email} already exists.\n')

        # 3. Create Rooms & Beds
        room_data = [
            {'num': '101', 'floor': 1, 'type': 'single', 'rent': 3000, 'beds': 1},
            {'num': '102', 'floor': 1, 'type': 'double', 'rent': 2000, 'beds': 2},
            {'num': '201', 'floor': 2, 'type': 'single', 'rent': 3200, 'beds': 1},
            {'num': '202', 'floor': 2, 'type': 'double', 'rent': 2200, 'beds': 2},
            {'num': '203', 'floor': 2, 'type': 'triple', 'rent': 1800, 'beds': 3},
        ]

        rooms_created: int = 0
        beds_created: int = 0

        for r_info in room_data:
            room, created = Room.objects.get_or_create(
                room_number=r_info['num'],
                defaults={
                    'floor': int(r_info['floor']),
                    'room_type': str(r_info['type']),
                    'rent_amount': int(r_info['rent']),
                    'total_beds': int(r_info['beds'])
                }
            )
            if created:
                rooms_created += 1
                # Auto-generate beds for this room
                num_beds = int(r_info['beds'])
                for i in range(1, num_beds + 1):
                    Bed.objects.create(room=room, bed_number=i)
                    beds_created += 1

        if rooms_created > 0:
            self.stdout.write(self.style.SUCCESS(f'Created {rooms_created} demo rooms with {beds_created} total beds.'))
        else:
            self.stdout.write('Demo rooms already exist.')

        # 4. Create a demo pending booking for the resident (linked to Room 101)
        if resident and not Booking.objects.filter(resident=resident, status='pending').exists():
            create_booking = input("Do you want to create a demo pending booking for the resident? (y/N): ").strip().lower() == 'y'
            if create_booking:
                room101 = Room.objects.filter(room_number='101').first()
                if room101:
                    Booking.objects.create(
                        resident=resident,
                        room=room101,
                        preferred_room_type=room101.room_type,
                        move_in_date=date.today() + timedelta(days=7),
                        duration_months=3,
                    )
                    self.stdout.write(self.style.SUCCESS('Created demo pending booking for resident in Room 101.\n'))

        # 5. Payments Mock Data
        from payments.models import Payment
        create_payments = input("Do you want to create mock payment data (Paid, Pending, Overdue)? (y/N): ").strip().lower() == 'y'
        if create_payments and resident:
            if not Payment.objects.filter(resident=resident).exists():
                Payment.objects.create(resident=resident, amount=3000, status='paid', due_date=date.today() - timedelta(days=40), paid_date=date.today() - timedelta(days=38), month_label=(date.today() - timedelta(days=30)).strftime('%B %Y'))
                Payment.objects.create(resident=resident, amount=3000, status='paid', due_date=date.today() - timedelta(days=10), paid_date=date.today() - timedelta(days=8), month_label=date.today().strftime('%B %Y'))
                Payment.objects.create(resident=resident, amount=3000, status='pending', due_date=date.today() + timedelta(days=10), month_label=(date.today() + timedelta(days=30)).strftime('%B %Y'))
                Payment.objects.create(resident=resident, amount=3000, status='overdue', due_date=date.today() - timedelta(days=5), month_label=date.today().strftime('%B %Y'))
                self.stdout.write(self.style.SUCCESS('Created mock payments for resident.\n'))
            else:
                self.stdout.write('Mock payments already exist for resident.\n')

        # 6. Complaints Mock Data
        from complaints.models import Complaint, ComplaintMessage
        create_complaints = input("Do you want to create mock complaints data? (y/N): ").strip().lower() == 'y'
        if create_complaints and resident:
            if not Complaint.objects.filter(resident=resident).exists():
                c1 = Complaint.objects.create(resident=resident, category='plumbing', description='Leaking tap. Tap in the bathroom is leaking continuously.', status='submitted', priority='medium')
                c2 = Complaint.objects.create(resident=resident, category='electrical', description='Fan not working. Ceiling fan is making noise and not spinning fast.', status='in_progress', priority='high')
                c3 = Complaint.objects.create(resident=resident, category='cleanliness', description='Room cleaning required. Room has not been cleaned for 3 days.', status='resolved', priority='low')
                ComplaintMessage.objects.create(complaint=c2, sender_role='resident', message='Any update on this?')
                self.stdout.write(self.style.SUCCESS('Created mock complaints for resident.\n'))
            else:
                self.stdout.write('Mock complaints already exist for resident.\n')

        self.stdout.write(self.style.SUCCESS('\nDemo data seeding complete!'))
        self.stdout.write('If you created an Admin, you can log in with those credentials.')
        self.stdout.write('For the resident demo, log in with: resident@demo.com / password123')

