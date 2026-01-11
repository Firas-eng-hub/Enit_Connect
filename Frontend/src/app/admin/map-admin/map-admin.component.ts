import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, AfterViewInit  } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-admin',
  templateUrl: './map-admin.component.html',
  styleUrls: ['./map-admin.component.css']
})
export class MapAdminComponent implements AfterViewInit {
  map;

  // retrieve from https://gist.github.com/ThomasG77/61fa02b35abf4b971390
  smallIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon-2x.png',
    iconSize:    [25, 41],
    iconAnchor:  [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    shadowSize:  [41, 41]
  });

  constructor(private http : HttpClient) { }
  addresses = [];
  entity = "";
  ngAfterViewInit(): void {
    if(localStorage.getItem("addresses") != undefined){
      this.addresses = JSON.parse(localStorage.getItem("addresses"));
    }
    if(this.addresses.length == 0){
      this.addresses.push('');
    }
    localStorage.removeItem("addresses");
    this.entity = localStorage.getItem("entity");
    localStorage.removeItem("entity");
    
    this.addresses.forEach(addr => {
      this.http.get(`${environment.apiUrl}/api/`+ this.entity + "/location?property=email&key=" + addr).subscribe((data : any)=>{
      console.log(data);
      if(data[0].lat != null && data[0].lng != null){
        var coord = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lng),
        };
        var popup = {
          coords: coord,
          text: data[0].name,
          open: true
        };
        this.addMarker(popup);
      }
      
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
   });
    });
      
    this.createMap();
  }

  createMap() {
    const Enit = {
      lat: 36.830942,
      lng: 10.146824,
    };

    const zoomLevel = 8;

    this.map = L.map('map', {
      center: [Enit.lat, Enit.lng],
      zoom: zoomLevel
    });

    const mainLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 3,
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    mainLayer.addTo(this.map);
    const descriptionWikipedia =
    'The National Engineering School of Tunis or ENIT'
    
     const popupOptions = {
      coords: Enit,
      text: descriptionWikipedia,
      open: true
    };
    this.addMarker(popupOptions);
  }

  addMarker({coords, text, open}) {
    const marker = L.marker([coords.lat, coords.lng], { icon: this.smallIcon });
    if (open) {
      marker.addTo(this.map).bindPopup(text).openPopup();
    } else {
      marker.addTo(this.map).bindPopup(text);
    }
  }

}
