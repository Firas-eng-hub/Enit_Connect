export class Document {
    idcreator : string = "";
    namecreator : string = "";
    date : string = "";
    title: string = "";
    type : string = "";
    link : string = "";
    emplacement: string = "";
    extension : string = "";
    size : string = "";
    public constructor(){
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        this.date = day + "/" + month + "/" + year;
        this.namecreator = localStorage.getItem("name");
        if(this.namecreator == "Administrator"){
            this.idcreator = localStorage.getItem('admin_id');
        }else{
            this.idcreator = localStorage.getItem('user_id');
        }
    }
}