import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { off } from 'process';
import { Offer } from '../models/offer.model';

@Component({
  selector: 'app-home-company',
  templateUrl: './home-company.component.html',
  styleUrls: ['./home-company.component.css']
})
export class HomeCompanyComponent implements OnInit {

  
  
  title = "";
  offerTitle = "";
  content = "";
  docs = [];
  start = "";
  end = "";
  type= "";
  types = [
    "PFA",
    "PFE",
    "Intership",
    "Job"
  ];
  noDocs = true;
  
  erreur1 = false;
  
  selectedFile : File;
  
  form: FormGroup;
  fileData: string;
  size = '';
  selectedDoc : Document = new Document();
  status = [];
  selectedFiles = [];
  
  offers = [];
  constructor(private http: HttpClient) { }
  
  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(null),
      file: new FormControl(null),
    });
    this.getOffers();
    //this.deleteOffer("6106e6266bb7c600158be9be");
  }

  onFileChanged(event) {
    this.selectedFiles = (event.target).files;
    console.log(this.selectedFiles);
    for(var i = 0;i<this.selectedFiles.length;i++){
      this.status.push({
        id : this.selectedFiles[i].size + 300 +'',
        status : 0,
        name : this.selectedFiles[i].name,
      });
    }
    this.noDocs = false;
  }

  

  postOffer(offer : Offer){
    
    this.http.post(`${environment.apiUrl}/api/offers`,offer ).subscribe((data : any)=>{
     console.log(data);
    this.offerTitle = "";
    this.content = "";
    
    //this.getOffers();
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
   });
  }
  
  addOffer() {
    if(this.offerTitle == "" || this.content == ""){
      this.erreur1 = true;
    }else{
      var offer = new Offer();
      offer.content = this.content;
      offer.title = this.offerTitle;
      offer.start = this.start;
      offer.end = this.end;
      offer.type = this.type;
      console.log(offer);
      if(this.noDocs){
        this.postOffer(offer);
      }else{
        
        var name = "";
        var nb = 0;
        for(var i=0;i<this.selectedFiles.length;i++){
          this.selectedFile = this.selectedFiles[i];
          this.size = Math.round(this.selectedFile.size/1024) + ' Ko';
          this.title = this.selectedFile.name;
          name = this.selectedFiles[i].name;
          
          
          const file = this.selectedFile;
          this.form.patchValue({ file: file });
          const reader = new FileReader();
  
          reader.onload = () => {
          this.fileData = reader.result as string;
          };
  
          reader.readAsDataURL(file);
    
          var type = this.selectedFile.name.split('.')[this.selectedFile.name.split('.').length-1];
          var fData = new FormData();
          var doc = new Document();
          
          fData.append("name",this.form.value.name);
          fData.append("file",  this.selectedFile, this.selectedFile.name);
          //console.log(fData);
          this.http.post(`${environment.apiUrl}/api/admin/newsdoc?type=`+type, fData ,{reportProgress : true, observe : 'events'}).subscribe((event : any)=>{
          if(event.type === HttpEventType.UploadProgress )  {
            for(var j = 0; j<this.status.length;j++){
              console.log(event)
              if(eval(this.status[j].id) < event.total + 100 && eval(this.status[j].id) > event.total - 100 && this.status[j].status < 100){
              if(this.status[j].status < Math.round(event.loaded/event.total * 100)) {
                this.status[j].status = Math.round(event.loaded/event.total * 100) ;
                break;
              }
              
              }
            }
          }else if(event.type === HttpEventType.Response){
            offer.docs.push({link : event.body.link, name : event.body.name});
            console.log(event);
            nb++;
            if(nb === this.status.length){//c'est fini
              this.selectedFiles = [];
              this.status = [];
              this.title = '';
              this.postOffer(offer);
              
            }
          }
          },
          (err : HttpErrorResponse)=>{
          console.log(err);
          });
          this.form.reset();
          this.fileData = null;
        }
      
        
      }
      
    }
    
    
    
  }

  getOffers(){
    console.log(`${environment.apiUrl}/api/offers/myoffers?id=`+localStorage.getItem('company_id'));
    
    this.http.get(`${environment.apiUrl}/api/offers/myoffers?id=`+localStorage.getItem('company_id') ).subscribe((data : any) => {
      this.offers = data;
      console.log(this.offers);
    },
    (err : HttpErrorResponse)=>{
    console.log(err);
    });
  }

  deleteOffer(id : string){
    
    this.http.delete(`${environment.apiUrl}/api/offers?id=`+id).subscribe((data : any) => {
      console.log(data);
      this.getOffers();
    },
    (err : HttpErrorResponse)=>{
    console.log(err);
    });
  }

  public togglePopup(){
    document.getElementById("popup-1").classList.toggle("active");
  }
  idUpdate = "";
  contentUpdate = "";
  offerTitleUpdate = "";
  endUpdate = "";
  startUpdate = "";
  typeUpdate = "";

  update(offer : any){
    console.log(offer);
    this.idUpdate = offer.id;
    this.contentUpdate = offer.content;
    this.startUpdate = offer.start;
    this.endUpdate = offer.end;
    this.typeUpdate = offer.type;
    this.offerTitleUpdate = offer.title;
  }
  updateOffer(){
    let offer = new Offer();
    offer.content = this.contentUpdate;
    offer.end = this.endUpdate;
    offer.start = this.startUpdate;
    //offer.type = this.typeUpdate;
    offer.title = this.offerTitleUpdate;
    offer.type = (<HTMLInputElement>document.getElementById("selectType")).value ;
    console.log(offer);
    
    this.http.patch(`${environment.apiUrl}/api/offers?id=`+this.idUpdate,offer).subscribe((data : any) => {
      console.log(data);
      this.togglePopup();
      this.getOffers();
    },
    (err : HttpErrorResponse)=>{
    console.log(err);
    });
  }



}
