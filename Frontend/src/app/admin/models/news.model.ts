export class News {
    date : string = "";
    title: string = "";
    content : string = "";
    picture : string = "";
    docs: any[] = [];
    public constructor(){
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        this.date = day + "/" + month + "/" + year;
        
    }
}