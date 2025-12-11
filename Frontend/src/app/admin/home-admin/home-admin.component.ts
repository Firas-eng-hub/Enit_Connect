import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { News } from '../models/news.model';

@Component({
  selector: 'app-home-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.css']
})
export class HomeAdminComponent implements OnInit {

  
  title = "";
  newsTitle = "";
  content = "";
  docs = [];
  
  noPicture = true;
  noDocs = true;
  
  erreur1 = false;
  
  selectedFile : File;
  selectedImage : File;
  form: FormGroup;
  fileData: string;
  size = '';
  selectedDoc : Document = new Document();
  status = [];
  selectedFiles = [];
  imagePath = "../../../assets/img/addpic.png";
  news = [];
  constructor(private http: HttpClient) { }
  
  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(null),
      file: new FormControl(null),
    });
    this.getNews();
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

  onSelectImage(event) {
    this.selectedImage = (event.target).files[0];
    console.log(this.selectedImage);
    this.noPicture = false;
    var reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('pic').setAttribute('src',e.target.result.toString());
    };
    reader.readAsDataURL(this.selectedImage);
  }

  postNews(news : News){
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.post(`${environment.apiUrl}/api/admin/news`,news ,{ headers: reqHeader }).subscribe((data : any)=>{
     console.log(data);
    this.newsTitle = "";
    this.content = "";
    this.imagePath = "../../../assets/img/addpic.png";
    this.getNews();
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
   });
  }
  
  addNews() {
    if(this.newsTitle == "" || this.content == ""){
      this.erreur1 = true;
    }else{
      var news = new News();
      news.content = this.content;
      news.title = this.newsTitle;
      if(this.noDocs && this.noPicture){
        this.postNews(news);
      }else{
        if(!this.noPicture){
          var name = "";
          this.selectedFile = this.selectedImage;
          this.size = Math.round(this.selectedFile.size/1024) + ' Ko';
          this.title = this.selectedFile.name;
          name = this.selectedFile.name;
         
          
          const file = this.selectedFile;
          this.form.patchValue({ file: file });
          const reader = new FileReader();
  
          reader.onload = () => {
          this.fileData = reader.result as string;
          };
  
          reader.readAsDataURL(file);
    
          var type = this.selectedFile.name.split('.')[this.selectedFile.name.split('.').length-1];
          var fData = new FormData();
          
          
          fData.append("name",this.form.value.name);
          fData.append("file",  this.selectedFile, this.selectedFile.name);
          console.log(fData);

          this.http.post(`${environment.apiUrl}/api/admin/newsdoc?type=`+type, fData ).subscribe((data : any)=>{
            console.log(data);
            news.picture = data.link;
            if(this.noDocs){
              this.postNews(news);
            }
          },
          (err : HttpErrorResponse)=>{
            console.log(err);
          });
        }
        if(!this.noDocs){
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
              news.docs.push({link : event.body.link, name : event.body.name});
              console.log(event);
              nb++;
              if(nb === this.status.length){//c'est fini
                this.selectedFiles = [];
                this.status = [];
                this.title = '';
                this.postNews(news);
                
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
    
    
    
  }

  getNews(){
    this.http.get(`${environment.apiUrl}/api/admin/news`).subscribe((data : any) => {
      this.news = data;
      console.log(this.news);
    },
    (err : HttpErrorResponse)=>{
    console.log(err);
    });
  }

  deleteNews(id : string){
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.delete(`${environment.apiUrl}/api/admin/news/`+id,{ headers: reqHeader }).subscribe((data : any) => {
      console.log(data);
      this.getNews();
    },
    (err : HttpErrorResponse)=>{
    console.log(err);
    });
  }

}
