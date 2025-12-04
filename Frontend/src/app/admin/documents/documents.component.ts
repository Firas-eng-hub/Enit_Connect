import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Document } from 'app/admin/models/document.model';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit {
  
  documents = [];
  title = "";
  emp = "/";
  emptyFolder = false;
  noResult = false;
  names = [];
  folders = [];
  files = [];
  foldersReserve = [];
  filesReserve = [];
  erreur1 = false;
  erreur2 = false;
  selectedFile : File;
  form: FormGroup;
  fileData: string;
  size = '';
  selectedDoc : Document = new Document();
  status = [];
  selectedFiles = [];
  
  constructor(private http: HttpClient) { }
  
  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(null),
      file: new FormControl(null),
    });
    this.getDocuments(this.emp);
  }

  enterFolder(emp : string){
    this.emp = emp;
    this.getDocuments(this.emp);
  }

  quitFolder(){
    let fd = this.emp.split('/');
    this.emp = "";
    for(var i =0; i<fd.length - 2;i++){
      this.emp += fd[i] + "/";
    }
    this.getDocuments(this.emp);
  }
  
  getDocuments(emp : string){
    this.noResult = false;
    this.names = [];
    this.filesReserve=[];
    this.foldersReserve = [];
    this.files=[];
    this.folders = [];
    this.documents = [];
    this.emp = emp;
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.post("http://localhost:3000/admin/documents",{emp : emp} ,{ headers: reqHeader }).subscribe((data : any)=>{
     console.log(data);
      this.documents = data;
      if(this.documents.length == 0){
        this.emptyFolder = true;
      }else{
        this.emptyFolder = false;
        this.documents.forEach(elt =>{
          this.names.push(elt.title);
          if(elt.type == 'folder'){
            this.folders.push(elt);
            this.foldersReserve.push(elt);
          }else{
            this.files.push(elt);
            this.filesReserve.push(elt);
          }
        });
      }
      
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
   });
  }
  
  createFolder(title : string){
    if(this.names.includes(title)){
      this.erreur1 = true;
    }else{
      let doc = new Document();
      doc.type = "folder";
      doc.title = title;
      doc.emplacement = this.emp;
      console.log(doc);
      var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
      this.http.post("http://localhost:3000/admin/folder", doc ,{ headers: reqHeader }).subscribe((data : any)=>{
        console.log(data);
        this.title = "";
        this.togglePopup1();
        this.getDocuments(this.emp);
     },
     (err : HttpErrorResponse)=>{
      console.log(err);
     });  
    }
    
  }
  
  delete(title : string){
    if(!this.names.includes(title)){
      this.erreur2 = true;
    }else{
      let type = "";
      let link = "";
      this.documents.forEach(elt => {
        if(elt.title == title){
          type = elt.type;
          link = elt.link;
        }
      });
      var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
      this.http.post("http://localhost:3000/admin/deldoc",{title:  title , emplacement: this.emp ,type: type ,link: link} ,{ headers: reqHeader }).subscribe((data : any)=>{
        console.log(data);
        this.title = "";
        this.togglePopup2();
        this.getDocuments(this.emp);
     },
     (err : HttpErrorResponse)=>{
      console.log(err);
     });
    }
    
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
  }

  
  uploadFile() {
    var name = "";
    var nb = 0;
    for(var i=0;i<this.selectedFiles.length;i++){
      this.selectedFile = this.selectedFiles[i];
      this.size = Math.round(this.selectedFile.size/1024) + ' Ko';
      this.title = this.selectedFile.name;
      if(this.names.includes(this.selectedFiles[i].name)){
        name = localStorage.getItem('name').split(' ')[0][0] + localStorage.getItem('name').split(' ')[1][0] + Date.now() + this.selectedFiles[i].name;
      }else{
        name = this.selectedFiles[i].name;
      }
      this.names.push(name);
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
      console.log(fData);
      this.http.post('http://localhost:3000/admin/file?type='+type+'&title='+name+'&emplacement='+this.emp+'&idcreator='+doc.idcreator+'&date='+doc.date+'&namecreator='+doc.namecreator+'&size='+this.size, fData ,{reportProgress : true, observe : 'events'}).subscribe((event : any)=>{
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
        console.log(event);
        nb++;
        if(nb === this.status.length){
          this.selectedFiles = [];
          this.status = [];
          this.title = '';
          this.togglePopup3();
          this.getDocuments(this.emp);
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

  search(){
    if(this.title == ""){
      this.getDocuments(this.emp);
    }else{
      this.emptyFolder = false;
      this.names = [];
      this.filesReserve=[];
      this.foldersReserve = [];
      this.files=[];
      this.folders = [];
      this.documents = [];
      this.emp = '/';
      var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
      this.http.post("http://localhost:3000/admin/searchdoc",{title : this.title} ,{ headers: reqHeader }).subscribe((data : any)=>{
       console.log(data);
        this.documents = data;
        if(this.documents.length == 0){
          this.noResult = true;
        }else{
          this.noResult = false;
          this.documents.forEach(elt =>{
            this.names.push(elt.title);
            if(elt.type == 'folder'){
              this.folders.push(elt);
              this.foldersReserve.push(elt);
            }else{
              this.files.push(elt);
              this.filesReserve.push(elt);
            }
          });
        }
        
     },
     (err : HttpErrorResponse)=>{
      console.log(err);
     });
    }
    
  }
    

  
  public togglePopup1(){
    document.getElementById("popup-1").classList.toggle("active");
    this.erreur1 = false;
    this.erreur2 = false;
    this.title = '';
  }

  public togglePopup2(){
    document.getElementById("popup-2").classList.toggle("active");
  }
  
  public togglePopup3(){
    document.getElementById("popup-3").classList.toggle("active");
    this.erreur1 = false;
    this.erreur2 = false;
    this.title = '';
  }

  public togglePopup4(){
    document.getElementById("popup-4").classList.toggle("active");
  }

  filter(key : string){
    console.log(key);
    this.folders = [];
    this.files = [];
    if(key == ''){
      this.folders = this.foldersReserve;
      this.files = this.filesReserve;
    }else{
      this.folders = [];
      this.foldersReserve.forEach(elt =>{
        if(elt.title.toUpperCase().includes(key.toUpperCase())){
          this.folders.push(elt);
        }
      });
      this.files = [];
      this.filesReserve.forEach(elt =>{
        if(elt.title.toUpperCase().includes(key.toUpperCase())){
          this.files.push(elt);
        }
      });
    }
    console.log(this.folders);
    console.log(this.files);
  }
}
