export class Candidacy {
    idStudent : string;
    date : string;
    namecreator : string;
    body : string;
    docs : any[] = [];
    constructor(){
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        this.date = day + "/" + month + "/" + year;
        this.namecreator = localStorage.getItem("name");
        
        this.idStudent = localStorage.getItem('user_id');
    }
    
        
}