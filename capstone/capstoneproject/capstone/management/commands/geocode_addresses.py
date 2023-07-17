from django.core.management.base import BaseCommand
from capstone.models import Pub
import requests

def geocode_address(api_key, address):
    base_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": api_key,
    }
    response = requests.get(base_url, params=params)
    if response.status_code == 200 and response.json()['status'] == 'OK':
        location = response.json()['results'][0]['geometry']['location']
        return location['lat'], location['lng']
    else:
        return None, None

class Command(BaseCommand):
    help = "Geocode addresses for Pubs"

    def handle(self, *args, **options):
        api_key = 'AIzaSyAyo_wEPw--GZf5e8ztb5YQiH8lIOCiQr4'

        for pub in Pub.objects.all()[:5]:
            if not pub.latitude or not pub.longitude:
                lat, lng = geocode_address(api_key, pub.address)
                if lat and lng:
                    pub.latitude = lat
                    pub.longitude = lng
                    pub.save()
